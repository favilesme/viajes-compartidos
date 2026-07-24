// Server functions para el "workspace" compartido.
// La app usa una única barrera básica (contraseña compartida): quien conoce la
// contraseña ve los mismos datos en cualquier dispositivo. NO es autenticación
// empresarial ni sustituye a un sistema de cuentas por usuario.
//
// Todos los datos viven en la nube. Los navegadores nunca reciben la
// contraseña ni el hash; solo una cookie firmada de sesión con el workspace_id.
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { AppState } from "./types";

const SESSION_COOKIE_NAME = "vc-session";

type WorkspaceSession = { workspaceId?: string };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET no está configurado.");
  return {
    password,
    name: SESSION_COOKIE_NAME,
    maxAge: 60 * 60 * 24 * 7, // 7 días
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function equalHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/**
 * Devuelve el workspaceId activo (o null) leyendo la cookie de sesión.
 * Público: se usa desde el índice para saber si mostrar Login o la app.
 */
export const getWorkspaceSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useSession<WorkspaceSession>(sessionConfig());
    return { workspaceId: session.data.workspaceId ?? null };
  },
);

/**
 * Valida la contraseña compartida contra el hash SHA-256 guardado en el
 * workspace y firma una cookie de sesión.
 */
export const unlockWorkspace = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) =>
    z.object({ password: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const hash = sha256Hex(data.password);

    const { data: rows, error } = await supabaseAdmin
      .from("workspaces")
      .select("id, passcode_hash")
      .limit(50);
    if (error) throw new Error("No se pudo verificar el acceso.");

    const match = rows?.find((w) => equalHex(w.passcode_hash, hash));
    if (!match) return { ok: false as const };

    const session = await useSession<WorkspaceSession>(sessionConfig());
    await session.update({ workspaceId: match.id });
    return { ok: true as const, workspaceId: match.id };
  });

/** Cierra la sesión (borra la cookie). */
export const lockWorkspace = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await useSession<WorkspaceSession>(sessionConfig());
    await session.clear();
    return { ok: true as const };
  },
);

async function requireWorkspaceId(): Promise<string> {
  const session = await useSession<WorkspaceSession>(sessionConfig());
  const id = session.data.workspaceId;
  if (!id) throw new Error("Sesión no válida.");
  return id;
}

/** Lee el snapshot completo del workspace autenticado. */
export const loadSnapshot = createServerFn({ method: "GET" }).handler(
  async () => {
    const workspaceId = await requireWorkspaceId();
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .select("id, snapshot, updated_at")
      .eq("id", workspaceId)
      .maybeSingle();
    if (error || !data) throw new Error("No se pudo cargar el estado.");
    return {
      workspaceId: data.id,
      snapshot: data.snapshot as unknown as AppState,
      updatedAt: data.updated_at,
    };
  },
);

/**
 * Reemplaza el snapshot completo. Estrategia intencionalmente simple: la app
 * es de dos personas, cada guardado empuja el estado completo. Realtime se
 * encarga de notificar a los otros dispositivos.
 */
export const saveSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data: { snapshot: unknown }) => {
    if (!data || typeof data !== "object" || !("snapshot" in data)) {
      throw new Error("Payload inválido.");
    }
    const snap = (data as { snapshot: unknown }).snapshot;
    if (!snap || typeof snap !== "object") {
      throw new Error("Snapshot inválido.");
    }
    return { snapshot: snap as AppState };
  })
  .handler(async ({ data }) => {
    const workspaceId = await requireWorkspaceId();
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("workspaces")
      .update({
        snapshot: data.snapshot as unknown as never,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId);
    if (error) throw new Error("No se pudo guardar el estado.");
    return { ok: true as const };
  });

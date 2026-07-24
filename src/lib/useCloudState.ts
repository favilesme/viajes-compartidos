// Hook que reemplaza el estado local por sincronización en la nube.
// Expone el mismo contrato que el estado previo: `state`, `setState`,
// `reemplazar` y `guardando` para que los componentes de UI no cambien.
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { AppState } from "./types";
import { supabase } from "@/integrations/supabase/client";
import {
  loadSnapshot,
  saveSnapshot,
} from "./workspace.functions";

const SNAPSHOT_KEY = ["workspace-snapshot"] as const;

export function useCloudState() {
  const queryClient = useQueryClient();
  const loadFn = useServerFn(loadSnapshot);
  const saveFn = useServerFn(saveSnapshot);

  const { data, isLoading, error } = useQuery({
    queryKey: SNAPSHOT_KEY,
    queryFn: () => loadFn(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const workspaceId = data?.workspaceId ?? null;

  // Sincronización entre dispositivos por Realtime **Broadcast**: no requiere
  // lectura pública a ninguna tabla. Un tab identifica sus propios envíos con
  // `senderId` para no recargarse a sí mismo tras guardar.
  const senderIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  );
  const broadcastRef = useRef<((payload: { senderId: string }) => void) | null>(
    null,
  );

  useEffect(() => {
    if (!workspaceId) {
      broadcastRef.current = null;
      return;
    }
    const channel = supabase.channel(`workspace-sync-${workspaceId}`, {
      config: { broadcast: { self: false, ack: false } },
    });
    channel.on("broadcast", { event: "snapshot-updated" }, (msg) => {
      const senderId = (msg.payload as { senderId?: string } | undefined)
        ?.senderId;
      if (senderId === senderIdRef.current) return;
      queryClient.invalidateQueries({ queryKey: SNAPSHOT_KEY });
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        broadcastRef.current = (payload) => {
          void channel.send({
            type: "broadcast",
            event: "snapshot-updated",
            payload,
          });
        };
      }
    });
    return () => {
      broadcastRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  const mutation = useMutation({
    mutationFn: (snapshot: AppState) => saveFn({ data: { snapshot } }),
    onMutate: async (snapshot) => {
      await queryClient.cancelQueries({ queryKey: SNAPSHOT_KEY });
      const previous = queryClient.getQueryData(SNAPSHOT_KEY);
      queryClient.setQueryData(SNAPSHOT_KEY, (old: any) =>
        old
          ? { ...old, snapshot }
          : { workspaceId, snapshot, updatedAt: new Date().toISOString() },
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(SNAPSHOT_KEY, ctx.previous);
    },
    onSuccess: () => {
      broadcastRef.current?.({ senderId: senderIdRef.current });
    },
  });

  const saveRef = useRef(mutation.mutate);
  saveRef.current = mutation.mutate;

  const api = useMemo(() => {
    const state: AppState = data?.snapshot ?? {
      version: 1,
      trips: [],
      activeTripId: null,
    };
    const setState = (next: AppState | ((prev: AppState) => AppState)) => {
      const resolved =
        typeof next === "function"
          ? (next as (p: AppState) => AppState)(state)
          : next;
      queryClient.setQueryData(SNAPSHOT_KEY, (old: any) =>
        old
          ? { ...old, snapshot: resolved }
          : { workspaceId, snapshot: resolved, updatedAt: new Date().toISOString() },
      );
      saveRef.current(resolved);
    };
    return { state, setState };
  }, [data, queryClient, workspaceId]);

  return {
    ...api,
    isLoading,
    error: error as Error | null,
    guardando: mutation.isPending,
  };
}

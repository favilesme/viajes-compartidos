// Pantalla de acceso — barrera básica compartida (NO autenticación empresarial).
// Envía la contraseña al servidor, que valida su SHA-256 contra el hash
// almacenado en la nube y firma una cookie httpOnly de sesión.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { unlockWorkspace } from "../lib/workspace.functions";

interface Props {
  onAcceso: () => void;
}

export function Login({ onAcceso }: Props) {
  const unlock = useServerFn(unlockWorkspace);
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await unlock({ data: { password } });
      if (!res.ok) {
        setError("Contraseña incorrecta.");
        return;
      }
      await queryClient.invalidateQueries();
      onAcceso();
    } catch {
      setError("No se pudo verificar el acceso. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm card-surface">
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Anima Praxis
          </p>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            Viajes Compartidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa la contraseña compartida para continuar.
          </p>
        </div>
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="password" className="field-label">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "password-error" : undefined}
          />
          {error && (
            <p
              id="password-error"
              role="alert"
              className="mt-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary mt-4 w-full"
            disabled={cargando || password.length === 0}
          >
            {cargando ? "Verificando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Acceso básico protegido con SHA-256 y una cookie firmada. Los datos se
          sincronizan de forma segura entre dispositivos que compartan la
          contraseña.
        </p>
      </div>
    </main>
  );
}

// Pantalla de acceso — barrera básica, NO autenticación empresarial.
import { useState } from "react";
import { verifyPassword, openSession } from "../lib/auth";

interface Props {
  onAcceso: () => void;
}

export function Login({ onAcceso }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const ok = await verifyPassword(password);
      if (!ok) {
        setError("Contraseña incorrecta.");
        return;
      }
      openSession();
      onAcceso();
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm card-surface">
        <div className="mb-5 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-foreground text-xl font-bold"
          >
            VC
          </div>
          <h1 className="text-xl font-semibold text-foreground">Viajes Compartidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa la contraseña para continuar.
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
          Acceso básico protegido con SHA-256 en el navegador. La sesión se guarda
          únicamente en la pestaña actual.
        </p>
      </div>
    </main>
  );
}

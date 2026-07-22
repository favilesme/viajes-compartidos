// Diálogo de confirmación accesible con foco automático y cierre por Escape.
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  titulo: string;
  mensaje: string;
  confirmarTexto?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({
  open,
  titulo,
  mensaje,
  confirmarTexto = "Eliminar",
  onConfirmar,
  onCancelar,
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancelar]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-foreground">
          {titulo}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{mensaje}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            ref={btnRef}
            className="btn-danger"
            onClick={onConfirmar}
          >
            {confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  );
}

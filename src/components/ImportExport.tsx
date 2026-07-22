// Importar y exportar el estado completo en JSON versionado.
import { useRef, useState } from "react";
import type { AppState } from "../lib/types";
import { exportStateJSON, importStateJSON } from "../lib/storage";

interface Props {
  state: AppState;
  onImportar: (nuevo: AppState) => void;
}

export function ImportExport({ state, onImportar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function exportar() {
    const blob = new Blob([exportStateJSON(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viajes-compartidos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Archivo exportado.");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const nuevo = importStateJSON(text);
      onImportar(nuevo);
      setMsg("Datos importados correctamente.");
    } catch (err) {
      setMsg(`Error al importar: ${(err as Error).message}`);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Importar / exportar</h2>
      <div className="card-surface space-y-3">
        <p className="text-sm text-muted-foreground">
          Descarga una copia de seguridad JSON o reemplaza el estado con un
          archivo previamente exportado. El formato incluye la versión del esquema.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={exportar}>
            Exportar JSON
          </button>
          <label className="btn-accent cursor-pointer">
            Importar JSON
            <input
              ref={inputRef}
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={onFile}
            />
          </label>
        </div>
        {msg && (
          <p role="status" className="text-sm text-muted-foreground">
            {msg}
          </p>
        )}
      </div>
    </section>
  );
}

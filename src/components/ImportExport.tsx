// Panel de Datos: importar, exportar, restablecer demostración y borrar todo.
// Import y borrado piden confirmación explícita; borrar todo requiere doble
// confirmación y deja un estado válido vacío (no re-crea el demo).
import { useRef, useState } from "react";
import type { AppState } from "../lib/types";
import {
  clearAllState,
  emptyState,
  exportStateJSON,
  importStateJSON,
  resetToDemoState,
} from "../lib/storage";
import { buildDemoState } from "../lib/demo";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  state: AppState;
  onImportar: (nuevo: AppState) => void;
}

type Pendiente =
  | { tipo: "importar"; estado: AppState; nombreArchivo: string }
  | null;

export function ImportExport({ state, onImportar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<Pendiente>(null);
  const [confirmarDemo, setConfirmarDemo] = useState(false);
  const [confirmarBorrar1, setConfirmarBorrar1] = useState(false);
  const [confirmarBorrar2, setConfirmarBorrar2] = useState(false);

  function limpiarMensajes() {
    setMsg(null);
    setError(null);
  }

  function exportar() {
    limpiarMensajes();
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
    limpiarMensajes();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const nuevo = importStateJSON(text);
      // No sobrescribir hasta que el usuario confirme el reemplazo total.
      setPendiente({ tipo: "importar", estado: nuevo, nombreArchivo: file.name });
    } catch (err) {
      setError(`No se pudo importar: ${(err as Error).message}`);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function confirmarImportacion() {
    if (pendiente?.tipo !== "importar") return;
    onImportar(pendiente.estado);
    setPendiente(null);
    setMsg("Datos importados correctamente.");
  }

  function restablecerDemo() {
    const fresh = resetToDemoState();
    onImportar(fresh);
    setConfirmarDemo(false);
    setMsg("Datos de demostración restablecidos.");
  }

  function borrarTodo() {
    const vacio = clearAllState();
    onImportar(vacio);
    setConfirmarBorrar1(false);
    setConfirmarBorrar2(false);
    setMsg("Todos los datos han sido borrados.");
  }

  const totalViajes = state.trips.length;
  const totalGastos = state.trips.reduce((s, t) => s + t.gastos.length, 0);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Datos</h2>
      <div className="card-surface space-y-3">
        <p className="text-sm text-muted-foreground">
          Actualmente hay <strong>{totalViajes}</strong> viaje(s) y{" "}
          <strong>{totalGastos}</strong> gasto(s) registrados.
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
          <button type="button" className="btn-ghost" onClick={() => setConfirmarDemo(true)}>
            Restablecer demostración
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirmarBorrar1(true)}>
            Borrar todos los datos
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Importar y restablecer <strong>reemplazan por completo</strong> los datos actuales.
          Borrar deja el sistema vacío (no recrea la demostración automáticamente).
        </p>
        {msg && (
          <p role="status" className="text-sm text-emerald">
            {msg}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendiente?.tipo === "importar"}
        titulo="Reemplazar todos los datos"
        mensaje={
          pendiente?.tipo === "importar"
            ? `Se importará "${pendiente.nombreArchivo}" con ${pendiente.estado.trips.length} viaje(s). Esto reemplazará por completo los datos actuales. ¿Continuar?`
            : ""
        }
        confirmarTexto="Reemplazar"
        onCancelar={() => setPendiente(null)}
        onConfirmar={confirmarImportacion}
      />

      <ConfirmDialog
        open={confirmarDemo}
        titulo="Restablecer demostración"
        mensaje={`Se reemplazarán los datos actuales por el viaje de demostración a ${
          buildDemoState().trips[0].destino
        }. ¿Continuar?`}
        confirmarTexto="Restablecer"
        onCancelar={() => setConfirmarDemo(false)}
        onConfirmar={restablecerDemo}
      />

      <ConfirmDialog
        open={confirmarBorrar1}
        titulo="Borrar todos los datos"
        mensaje="Se eliminarán TODOS los viajes, gastos, actividades y compras. Esta acción no se puede deshacer."
        confirmarTexto="Continuar"
        onCancelar={() => setConfirmarBorrar1(false)}
        onConfirmar={() => {
          setConfirmarBorrar1(false);
          setConfirmarBorrar2(true);
        }}
      />

      <ConfirmDialog
        open={confirmarBorrar2}
        titulo="Confirmación final"
        mensaje={`Vas a borrar ${totalViajes} viaje(s) y ${totalGastos} gasto(s). Después quedará vacío (${emptyState().trips.length} viajes). ¿Confirmas?`}
        confirmarTexto="Borrar definitivamente"
        onCancelar={() => setConfirmarBorrar2(false)}
        onConfirmar={borrarTodo}
      />
    </section>
  );
}

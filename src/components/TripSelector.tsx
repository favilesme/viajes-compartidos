// Selector y gestor de viajes: crear, elegir y eliminar. Dos participantes exactos.
import { useState } from "react";
import type { AppState, Trip } from "../lib/types";
import { newId } from "../lib/storage";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  state: AppState;
  onChange: (state: AppState) => void;
}

export function TripSelector({ state, onChange }: Props) {
  const [creando, setCreando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState<Trip | null>(null);

  const activo = state.trips.find((t) => t.id === state.activeTripId) ?? null;

  function seleccionar(id: string) {
    onChange({ ...state, activeTripId: id });
  }

  function crear(nuevo: Trip) {
    onChange({
      ...state,
      trips: [...state.trips, nuevo],
      activeTripId: nuevo.id,
    });
    setCreando(false);
  }

  function borrar(trip: Trip) {
    const restantes = state.trips.filter((t) => t.id !== trip.id);
    onChange({
      ...state,
      trips: restantes,
      activeTripId: restantes[0]?.id ?? null,
    });
    setConfirmarBorrar(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="trip-select" className="sr-only">
        Viaje activo
      </label>
      <select
        id="trip-select"
        className="field-input max-w-xs"
        value={activo?.id ?? ""}
        onChange={(e) => seleccionar(e.target.value)}
        disabled={state.trips.length === 0}
      >
        {state.trips.length === 0 && <option value="">Sin viajes</option>}
        {state.trips.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre} — {t.destino}
          </option>
        ))}
      </select>
      <button type="button" className="btn-ghost" onClick={() => setCreando(true)}>
        + Nuevo viaje
      </button>
      {activo && (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setConfirmarBorrar(activo)}
          aria-label={`Eliminar viaje ${activo.nombre}`}
        >
          Eliminar viaje
        </button>
      )}

      {creando && <NuevoViajeDialog onCancelar={() => setCreando(false)} onCrear={crear} />}
      <ConfirmDialog
        open={confirmarBorrar !== null}
        titulo="Eliminar viaje"
        mensaje={`Se eliminarán todos los datos de "${confirmarBorrar?.nombre ?? ""}". Esta acción no se puede deshacer.`}
        onCancelar={() => setConfirmarBorrar(null)}
        onConfirmar={() => confirmarBorrar && borrar(confirmarBorrar)}
      />
    </div>
  );
}

function NuevoViajeDialog({
  onCancelar,
  onCrear,
}: {
  onCancelar: () => void;
  onCrear: (t: Trip) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trip: Trip = {
      id: newId(),
      nombre: nombre.trim(),
      destino: destino.trim(),
      moneda: moneda.trim() || "USD",
      fechaInicio,
      fechaFin,
      participantes: [
        { id: newId(), nombre: p1.trim() },
        { id: newId(), nombre: p2.trim() },
      ],
      gastos: [],
      actividades: [],
      compras: [],
      createdAt: new Date().toISOString(),
    };
    onCrear(trip);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuevo-viaje-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancelar}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="nuevo-viaje-title" className="text-lg font-semibold text-foreground">
          Nuevo viaje
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="nv-nombre" className="field-label">Nombre</label>
            <input id="nv-nombre" required className="field-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nv-destino" className="field-label">Destino</label>
            <input id="nv-destino" required className="field-input" value={destino} onChange={(e) => setDestino(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nv-moneda" className="field-label">Moneda</label>
            <input id="nv-moneda" required className="field-input" value={moneda} onChange={(e) => setMoneda(e.target.value)} />
          </div>
          <div />
          <div>
            <label htmlFor="nv-fi" className="field-label">Fecha inicio</label>
            <input id="nv-fi" type="date" required className="field-input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nv-ff" className="field-label">Fecha fin</label>
            <input id="nv-ff" type="date" required className="field-input" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nv-p1" className="field-label">Participante 1</label>
            <input id="nv-p1" required className="field-input" value={p1} onChange={(e) => setP1(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nv-p2" className="field-label">Participante 2</label>
            <input id="nv-p2" required className="field-input" value={p2} onChange={(e) => setP2(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn-primary">Crear</button>
        </div>
      </form>
    </div>
  );
}

// Selector de viajes con creación, edición y borrado.
// La edición conserva los IDs de participantes; sólo cambian sus nombres.
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
  const [editando, setEditando] = useState<Trip | null>(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState<Trip | null>(null);

  const activo = state.trips.find((t) => t.id === state.activeTripId) ?? null;

  function seleccionar(id: string) {
    onChange({ ...state, activeTripId: id });
  }

  function crear(nuevo: Trip) {
    onChange({ ...state, trips: [...state.trips, nuevo], activeTripId: nuevo.id });
    setCreando(false);
  }

  function guardarEdicion(t: Trip) {
    onChange({
      ...state,
      trips: state.trips.map((x) => (x.id === t.id ? t : x)),
    });
    setEditando(null);
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
      <button
        type="button"
        className="btn-outline-onprimary"
        data-header-action="true"
        onClick={() => setCreando(true)}
      >
        + Nuevo viaje
      </button>
      {activo && (
        <>
          <button
            type="button"
            className="btn-outline-onprimary"
            data-header-action="true"
            onClick={() => setEditando(activo)}
          >
            Editar viaje
          </button>
          <button
            type="button"
            className="btn-outline-onprimary"
            data-header-action="true"
            onClick={() => setConfirmarBorrar(activo)}
            aria-label={`Eliminar viaje ${activo.nombre}`}
          >
            Eliminar viaje
          </button>
        </>
      )}

      {creando && <TripForm onCancelar={() => setCreando(false)} onGuardar={crear} />}
      {editando && (
        <TripForm
          trip={editando}
          onCancelar={() => setEditando(null)}
          onGuardar={guardarEdicion}
        />
      )}
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

/**
 * Formulario compartido para crear y editar. En edición preserva los IDs de
 * los participantes: sólo cambian los nombres visibles.
 */
function TripForm({
  trip,
  onCancelar,
  onGuardar,
}: {
  trip?: Trip;
  onCancelar: () => void;
  onGuardar: (t: Trip) => void;
}) {
  const esEdicion = Boolean(trip);
  const [nombre, setNombre] = useState(trip?.nombre ?? "");
  const [destino, setDestino] = useState(trip?.destino ?? "");
  const [moneda, setMoneda] = useState(trip?.moneda ?? "USD");
  const [fechaInicio, setFechaInicio] = useState(trip?.fechaInicio ?? "");
  const [fechaFin, setFechaFin] = useState(trip?.fechaFin ?? "");
  const [p1, setP1] = useState(trip?.participantes[0].nombre ?? "");
  const [p2, setP2] = useState(trip?.participantes[1].nombre ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (fechaFin < fechaInicio) {
      setError("La fecha fin no puede ser anterior a la fecha inicio.");
      return;
    }
    setError(null);
    if (esEdicion && trip) {
      // Preservar ids de participantes.
      const nuevo: Trip = {
        ...trip,
        nombre: nombre.trim(),
        destino: destino.trim(),
        moneda: moneda.trim() || "USD",
        fechaInicio,
        fechaFin,
        participantes: [
          { id: trip.participantes[0].id, nombre: p1.trim() },
          { id: trip.participantes[1].id, nombre: p2.trim() },
        ],
      };
      onGuardar(nuevo);
      return;
    }
    onGuardar({
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
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tf-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancelar}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tf-title" className="text-lg font-semibold text-foreground">
          {esEdicion ? "Editar viaje" : "Nuevo viaje"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="tf-nombre" className="field-label">Nombre</label>
            <input id="tf-nombre" required maxLength={80} className="field-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tf-destino" className="field-label">Destino</label>
            <input id="tf-destino" required maxLength={120} className="field-input" value={destino} onChange={(e) => setDestino(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tf-moneda" className="field-label">Moneda</label>
            <input id="tf-moneda" required maxLength={8} className="field-input" value={moneda} onChange={(e) => setMoneda(e.target.value)} />
          </div>
          <div />
          <div>
            <label htmlFor="tf-fi" className="field-label">Fecha inicio</label>
            <input id="tf-fi" type="date" required className="field-input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tf-ff" className="field-label">Fecha fin</label>
            <input id="tf-ff" type="date" required className="field-input" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tf-p1" className="field-label">Participante 1</label>
            <input id="tf-p1" required maxLength={60} className="field-input" value={p1} onChange={(e) => setP1(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tf-p2" className="field-label">Participante 2</label>
            <input id="tf-p2" required maxLength={60} className="field-input" value={p2} onChange={(e) => setP2(e.target.value)} />
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {esEdicion && (
          <p className="mt-3 text-xs text-muted-foreground">
            Los identificadores de los participantes se conservan; sólo cambia el nombre visible.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn-primary">{esEdicion ? "Guardar" : "Crear"}</button>
        </div>
      </form>
    </div>
  );
}

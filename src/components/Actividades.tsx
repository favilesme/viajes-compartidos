// CRUD de actividades. Al pasar a "realizada" se crea o actualiza el gasto
// vinculado sin duplicar; al cambiar de estado o borrar se elimina.
import { useState } from "react";
import type { Activity, ActivityStatus, Trip, UUID } from "../lib/types";
import { newId } from "../lib/storage";
import {
  participantName,
  removeLinkedExpenses,
  syncActivityExpense,
} from "../lib/derive";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  trip: Trip;
  onUpdateTrip: (t: Trip) => void;
}

const ESTADOS: ActivityStatus[] = ["planificada", "realizada", "cancelada"];

export function Actividades({ trip, onUpdateTrip }: Props) {
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Activity | null>(null);
  const [borrar, setBorrar] = useState<Activity | null>(null);

  function guardar(act: Activity) {
    const existente = trip.actividades.some((a) => a.id === act.id);
    const nuevas = existente
      ? trip.actividades.map((a) => (a.id === act.id ? act : a))
      : [...trip.actividades, act];
    // Sincroniza el gasto vinculado sin duplicar.
    const nuevosGastos = syncActivityExpense(trip.gastos, act);
    onUpdateTrip({ ...trip, actividades: nuevas, gastos: nuevosGastos });
    setCreando(false);
    setEditando(null);
  }

  function eliminar(act: Activity) {
    onUpdateTrip({
      ...trip,
      actividades: trip.actividades.filter((a) => a.id !== act.id),
      gastos: removeLinkedExpenses(trip.gastos, "actividad", act.id),
    });
    setBorrar(null);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Actividades</h2>
        <button type="button" className="btn-primary" onClick={() => setCreando(true)}>
          + Nueva actividad
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trip.actividades.length === 0 && (
          <p className="card-surface text-muted-foreground">Sin actividades registradas.</p>
        )}
        {trip.actividades
          .slice()
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
          .map((a) => (
            <article key={a.id} className="card-surface flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold">{a.titulo}</h3>
                  <EstadoBadge estado={a.estado} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.fecha} · {a.lugar}
                </p>
                <p className="mt-2 text-sm">
                  Costo:{" "}
                  <strong>
                    {a.costo.toFixed(2)} {trip.moneda}
                  </strong>{" "}
                  · Paga {participantName(trip, a.pagadoPor)}
                </p>
                {a.notas && <p className="mt-2 text-sm text-muted-foreground">{a.notas}</p>}
                {a.estado === "realizada" && a.costo > 0 && (
                  <p className="mt-2 text-xs text-emerald">
                    ✓ Gasto vinculado activo
                  </p>
                )}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setEditando(a)}>
                  Editar
                </button>
                <button type="button" className="btn-danger" onClick={() => setBorrar(a)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
      </div>

      {(creando || editando) && (
        <ActividadForm
          trip={trip}
          actividad={editando}
          onCancelar={() => {
            setCreando(false);
            setEditando(null);
          }}
          onGuardar={guardar}
        />
      )}

      <ConfirmDialog
        open={borrar !== null}
        titulo="Eliminar actividad"
        mensaje={`¿Eliminar "${borrar?.titulo ?? ""}"? También se quitará su gasto vinculado si existe.`}
        onCancelar={() => setBorrar(null)}
        onConfirmar={() => borrar && eliminar(borrar)}
      />
    </section>
  );
}

function EstadoBadge({ estado }: { estado: ActivityStatus }) {
  const map: Record<ActivityStatus, string> = {
    planificada: "bg-secondary text-secondary-foreground",
    realizada: "bg-emerald text-emerald-foreground",
    cancelada: "bg-destructive text-destructive-foreground",
  };
  return <span className={`badge-status ${map[estado]}`}>{estado}</span>;
}

function ActividadForm({
  trip,
  actividad,
  onCancelar,
  onGuardar,
}: {
  trip: Trip;
  actividad: Activity | null;
  onCancelar: () => void;
  onGuardar: (a: Activity) => void;
}) {
  const [titulo, setTitulo] = useState(actividad?.titulo ?? "");
  const [fecha, setFecha] = useState(actividad?.fecha ?? trip.fechaInicio);
  const [lugar, setLugar] = useState(actividad?.lugar ?? "");
  const [estado, setEstado] = useState<ActivityStatus>(actividad?.estado ?? "planificada");
  const [costo, setCosto] = useState<number>(actividad?.costo ?? 0);
  const [pagadoPor, setPagadoPor] = useState<UUID>(actividad?.pagadoPor ?? trip.participantes[0].id);
  const [notas, setNotas] = useState(actividad?.notas ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onGuardar({
      id: actividad?.id ?? newId(),
      titulo: titulo.trim(),
      fecha,
      lugar: lugar.trim(),
      estado,
      costo: Number(costo) || 0,
      pagadoPor,
      notas: notas.trim() || undefined,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="act-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancelar}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="act-form-title" className="text-lg font-semibold">
          {actividad ? "Editar actividad" : "Nueva actividad"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="af-tit" className="field-label">Título</label>
            <input id="af-tit" required className="field-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label htmlFor="af-fecha" className="field-label">Fecha</label>
            <input id="af-fecha" type="date" required className="field-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label htmlFor="af-lugar" className="field-label">Lugar</label>
            <input id="af-lugar" className="field-input" value={lugar} onChange={(e) => setLugar(e.target.value)} />
          </div>
          <div>
            <label htmlFor="af-est" className="field-label">Estado</label>
            <select id="af-est" className="field-input" value={estado} onChange={(e) => setEstado(e.target.value as ActivityStatus)}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="af-costo" className="field-label">Costo ({trip.moneda})</label>
            <input id="af-costo" type="number" min="0" step="0.01" className="field-input" value={costo} onChange={(e) => setCosto(Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="af-pag" className="field-label">Pagado por</label>
            <select id="af-pag" className="field-input" value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)}>
              {trip.participantes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="af-notas" className="field-label">Notas</label>
            <textarea id="af-notas" className="field-input" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Solo cuando el estado es <strong>realizada</strong> y el costo es mayor a cero se crea un gasto vinculado.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  );
}

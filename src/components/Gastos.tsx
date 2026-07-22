// CRUD de gastos con búsqueda y filtros. Los gastos vinculados a actividades
// o compras se muestran como solo lectura y se editan en su origen.
import { useMemo, useState } from "react";
import type { Expense, Trip, UUID } from "../lib/types";
import { newId } from "../lib/storage";
import { participantName } from "../lib/derive";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  trip: Trip;
  onUpdateTrip: (t: Trip) => void;
}

const CATEGORIAS = ["Transporte", "Alojamiento", "Comida", "Actividad", "Compra", "Otro"];

export function Gastos({ trip, onUpdateTrip }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroPagador, setFiltroPagador] = useState<UUID | "">("");
  const [editando, setEditando] = useState<Expense | null>(null);
  const [creando, setCreando] = useState(false);
  const [borrar, setBorrar] = useState<Expense | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return trip.gastos
      .filter((g) => (filtroCategoria ? g.categoria === filtroCategoria : true))
      .filter((g) => (filtroPagador ? g.pagadoPor === filtroPagador : true))
      .filter((g) =>
        q
          ? g.descripcion.toLowerCase().includes(q) ||
            g.categoria.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [trip.gastos, busqueda, filtroCategoria, filtroPagador]);

  function guardar(gasto: Expense) {
    const existente = trip.gastos.some((g) => g.id === gasto.id);
    const nuevos = existente
      ? trip.gastos.map((g) => (g.id === gasto.id ? gasto : g))
      : [...trip.gastos, gasto];
    onUpdateTrip({ ...trip, gastos: nuevos });
    setEditando(null);
    setCreando(false);
  }

  function eliminar(gasto: Expense) {
    onUpdateTrip({ ...trip, gastos: trip.gastos.filter((g) => g.id !== gasto.id) });
    setBorrar(null);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Gastos</h2>
        <button type="button" className="btn-primary" onClick={() => setCreando(true)}>
          + Nuevo gasto
        </button>
      </header>

      <div className="card-surface grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="g-busq" className="field-label">Buscar</label>
          <input
            id="g-busq"
            className="field-input"
            placeholder="Descripción o categoría"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="g-cat" className="field-label">Categoría</label>
          <select
            id="g-cat"
            className="field-input"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="g-pag" className="field-label">Pagador</label>
          <select
            id="g-pag"
            className="field-input"
            value={filtroPagador}
            onChange={(e) => setFiltroPagador(e.target.value as UUID | "")}
          >
            <option value="">Todos</option>
            {trip.participantes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-surface overflow-x-auto p-0">
        <table className="w-full text-sm">
          <caption className="sr-only">Lista de gastos del viaje</caption>
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Categoría</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-right">Monto</th>
              <th className="p-3 text-left">Pagó</th>
              <th className="p-3 text-left">Origen</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Sin gastos que coincidan.
                </td>
              </tr>
            )}
            {filtrados.map((g) => {
              const vinculado = g.source.type !== "manual";
              return (
                <tr key={g.id} className="border-t">
                  <td className="p-3">{g.fecha}</td>
                  <td className="p-3">{g.categoria}</td>
                  <td className="p-3">{g.descripcion}</td>
                  <td className="p-3 text-right font-medium">
                    {g.monto.toFixed(2)} {trip.moneda}
                  </td>
                  <td className="p-3">{participantName(trip, g.pagadoPor)}</td>
                  <td className="p-3">
                    {g.source.type === "manual" ? (
                      <span className="text-muted-foreground">Manual</span>
                    ) : (
                      <span className="badge-status bg-orange text-orange-foreground">
                        {g.source.type}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={vinculado}
                        onClick={() => setEditando(g)}
                        aria-label={`Editar gasto ${g.descripcion}`}
                        title={vinculado ? "Editar en la sección de origen" : "Editar"}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={vinculado}
                        onClick={() => setBorrar(g)}
                        aria-label={`Eliminar gasto ${g.descripcion}`}
                        title={vinculado ? "Eliminar en la sección de origen" : "Eliminar"}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(creando || editando) && (
        <GastoForm
          trip={trip}
          gasto={editando}
          onCancelar={() => {
            setCreando(false);
            setEditando(null);
          }}
          onGuardar={guardar}
        />
      )}

      <ConfirmDialog
        open={borrar !== null}
        titulo="Eliminar gasto"
        mensaje={`¿Eliminar el gasto "${borrar?.descripcion ?? ""}"?`}
        onCancelar={() => setBorrar(null)}
        onConfirmar={() => borrar && eliminar(borrar)}
      />
    </section>
  );
}

function GastoForm({
  trip,
  gasto,
  onCancelar,
  onGuardar,
}: {
  trip: Trip;
  gasto: Expense | null;
  onCancelar: () => void;
  onGuardar: (g: Expense) => void;
}) {
  const [fecha, setFecha] = useState(gasto?.fecha ?? new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState(gasto?.categoria ?? "Otro");
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? "");
  const [monto, setMonto] = useState<number>(gasto?.monto ?? 0);
  const [pagadoPor, setPagadoPor] = useState<UUID>(gasto?.pagadoPor ?? trip.participantes[0].id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onGuardar({
      id: gasto?.id ?? newId(),
      fecha,
      categoria,
      descripcion: descripcion.trim(),
      monto: Number(monto) || 0,
      pagadoPor,
      source: gasto?.source ?? { type: "manual" },
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gasto-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancelar}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="gasto-form-title" className="text-lg font-semibold">
          {gasto ? "Editar gasto" : "Nuevo gasto"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="gf-fecha" className="field-label">Fecha</label>
            <input id="gf-fecha" type="date" required className="field-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label htmlFor="gf-cat" className="field-label">Categoría</label>
            <select id="gf-cat" className="field-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="gf-desc" className="field-label">Descripción</label>
            <input id="gf-desc" required className="field-input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div>
            <label htmlFor="gf-monto" className="field-label">Monto ({trip.moneda})</label>
            <input id="gf-monto" type="number" min="0" step="0.01" required className="field-input" value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="gf-pag" className="field-label">Pagado por</label>
            <select id="gf-pag" className="field-input" value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)}>
              {trip.participantes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  );
}

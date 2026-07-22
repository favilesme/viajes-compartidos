// CRUD de compras. La inclusión como gasto vinculado es opcional y no duplica.
import { useState } from "react";
import type { Purchase, Trip, UUID } from "../lib/types";
import { newId } from "../lib/storage";
import {
  participantName,
  removeLinkedExpenses,
  syncPurchaseExpense,
} from "../lib/derive";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  trip: Trip;
  onUpdateTrip: (t: Trip) => void;
}

export function Compras({ trip, onUpdateTrip }: Props) {
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Purchase | null>(null);
  const [borrar, setBorrar] = useState<Purchase | null>(null);

  function guardar(c: Purchase) {
    const existente = trip.compras.some((p) => p.id === c.id);
    const nuevas = existente
      ? trip.compras.map((p) => (p.id === c.id ? c : p))
      : [...trip.compras, c];
    const nuevosGastos = syncPurchaseExpense(trip.gastos, c);
    onUpdateTrip({ ...trip, compras: nuevas, gastos: nuevosGastos });
    setCreando(false);
    setEditando(null);
  }

  function eliminar(c: Purchase) {
    onUpdateTrip({
      ...trip,
      compras: trip.compras.filter((p) => p.id !== c.id),
      gastos: removeLinkedExpenses(trip.gastos, "compra", c.id),
    });
    setBorrar(null);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Compras</h2>
        <button type="button" className="btn-primary" onClick={() => setCreando(true)}>
          + Nueva compra
        </button>
      </header>

      <div className="card-surface overflow-x-auto p-0">
        <table className="w-full text-sm">
          <caption className="sr-only">Lista de compras del viaje</caption>
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-right">Cant.</th>
              <th className="p-3 text-right">P. unit.</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Para</th>
              <th className="p-3 text-left">Pagó</th>
              <th className="p-3 text-left">Gasto</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {trip.compras.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  Sin compras registradas.
                </td>
              </tr>
            )}
            {trip.compras
              .slice()
              .sort((a, b) => b.fecha.localeCompare(a.fecha))
              .map((c) => {
                const total = c.cantidad * c.precioUnitario;
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.fecha}</td>
                    <td className="p-3">{c.producto}</td>
                    <td className="p-3 text-right">{c.cantidad}</td>
                    <td className="p-3 text-right">{c.precioUnitario.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">
                      {total.toFixed(2)} {trip.moneda}
                    </td>
                    <td className="p-3">{participantName(trip, c.destinatario)}</td>
                    <td className="p-3">{participantName(trip, c.pagadoPor)}</td>
                    <td className="p-3">
                      {c.incluirComoGasto ? (
                        <span className="badge-status bg-emerald text-emerald-foreground">Sí</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="btn-ghost" onClick={() => setEditando(c)}>
                          Editar
                        </button>
                        <button type="button" className="btn-danger" onClick={() => setBorrar(c)}>
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
        <CompraForm
          trip={trip}
          compra={editando}
          onCancelar={() => {
            setCreando(false);
            setEditando(null);
          }}
          onGuardar={guardar}
        />
      )}

      <ConfirmDialog
        open={borrar !== null}
        titulo="Eliminar compra"
        mensaje={`¿Eliminar "${borrar?.producto ?? ""}"? También se quitará su gasto vinculado si existe.`}
        onCancelar={() => setBorrar(null)}
        onConfirmar={() => borrar && eliminar(borrar)}
      />
    </section>
  );
}

function CompraForm({
  trip,
  compra,
  onCancelar,
  onGuardar,
}: {
  trip: Trip;
  compra: Purchase | null;
  onCancelar: () => void;
  onGuardar: (c: Purchase) => void;
}) {
  const [fecha, setFecha] = useState(compra?.fecha ?? trip.fechaInicio);
  const [producto, setProducto] = useState(compra?.producto ?? "");
  const [cantidad, setCantidad] = useState<number>(compra?.cantidad ?? 1);
  const [precioUnitario, setPrecioUnitario] = useState<number>(compra?.precioUnitario ?? 0);
  const [destinatario, setDestinatario] = useState<UUID>(compra?.destinatario ?? trip.participantes[0].id);
  const [pagadoPor, setPagadoPor] = useState<UUID>(compra?.pagadoPor ?? trip.participantes[0].id);
  const [incluir, setIncluir] = useState<boolean>(compra?.incluirComoGasto ?? true);
  const [notas, setNotas] = useState(compra?.notas ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onGuardar({
      id: compra?.id ?? newId(),
      fecha,
      producto: producto.trim(),
      cantidad: Number(cantidad) || 0,
      precioUnitario: Number(precioUnitario) || 0,
      destinatario,
      pagadoPor,
      incluirComoGasto: incluir,
      notas: notas.trim() || undefined,
    });
  }

  const total = (Number(cantidad) || 0) * (Number(precioUnitario) || 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cf-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancelar}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cf-title" className="text-lg font-semibold">
          {compra ? "Editar compra" : "Nueva compra"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cf-fecha" className="field-label">Fecha</label>
            <input id="cf-fecha" type="date" required className="field-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cf-prod" className="field-label">Producto</label>
            <input id="cf-prod" required className="field-input" value={producto} onChange={(e) => setProducto(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cf-cant" className="field-label">Cantidad</label>
            <input id="cf-cant" type="number" min="1" step="1" required className="field-input" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="cf-pu" className="field-label">Precio unitario ({trip.moneda})</label>
            <input id="cf-pu" type="number" min="0" step="0.01" required className="field-input" value={precioUnitario} onChange={(e) => setPrecioUnitario(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="cf-dest" className="field-label">Destinatario</label>
            <select id="cf-dest" className="field-input" value={destinatario} onChange={(e) => setDestinatario(e.target.value)}>
              {trip.participantes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cf-pag" className="field-label">Pagado por</label>
            <select id="cf-pag" className="field-input" value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)}>
              {trip.participantes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="cf-incl"
              type="checkbox"
              className="h-4 w-4"
              checked={incluir}
              onChange={(e) => setIncluir(e.target.checked)}
            />
            <label htmlFor="cf-incl" className="text-sm">
              Incluir como gasto vinculado (total {total.toFixed(2)} {trip.moneda})
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cf-notas" className="field-label">Notas</label>
            <textarea id="cf-notas" className="field-input" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
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

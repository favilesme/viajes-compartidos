// Lógica de derivación: sincroniza gastos vinculados a actividades/compras
// evitando duplicados al editar, y calcula la liquidación 50/50.
import type { Activity, Expense, Purchase, Trip, UUID } from "./types";
import { newId } from "./storage";

/**
 * Reconstruye los gastos vinculados de una actividad.
 * - Si la actividad está "realizada" y costo > 0 → asegura un único gasto vinculado.
 * - En cualquier otro estado → elimina cualquier gasto vinculado previo.
 * No duplica: reutiliza el gasto existente (mismo source.id) si ya está.
 */
export function syncActivityExpense(gastos: Expense[], act: Activity): Expense[] {
  const otros = gastos.filter(
    (g) => !(g.source.type === "actividad" && g.source.id === act.id),
  );
  const debeExistir = act.estado === "realizada" && act.costo > 0;
  if (!debeExistir) return otros;

  const existente = gastos.find(
    (g) => g.source.type === "actividad" && g.source.id === act.id,
  );
  const nuevo: Expense = {
    id: existente?.id ?? newId(),
    fecha: act.fecha,
    categoria: "Actividad",
    descripcion: act.titulo,
    monto: act.costo,
    pagadoPor: act.pagadoPor,
    source: { type: "actividad", id: act.id },
  };
  return [...otros, nuevo];
}

/**
 * Reconstruye el gasto vinculado a una compra.
 * - Si `incluirComoGasto` es true → asegura un único gasto por compra.
 * - Si es false → elimina cualquier gasto vinculado previo.
 */
export function syncPurchaseExpense(gastos: Expense[], compra: Purchase): Expense[] {
  const otros = gastos.filter(
    (g) => !(g.source.type === "compra" && g.source.id === compra.id),
  );
  if (!compra.incluirComoGasto) return otros;

  const existente = gastos.find(
    (g) => g.source.type === "compra" && g.source.id === compra.id,
  );
  const total = compra.cantidad * compra.precioUnitario;
  const nuevo: Expense = {
    id: existente?.id ?? newId(),
    fecha: compra.fecha,
    categoria: "Compra",
    descripcion: `${compra.producto} (x${compra.cantidad})`,
    monto: total,
    pagadoPor: compra.pagadoPor,
    source: { type: "compra", id: compra.id },
  };
  return [...otros, nuevo];
}

/**
 * Al borrar una actividad o compra, remover su gasto vinculado.
 */
export function removeLinkedExpenses(
  gastos: Expense[],
  sourceType: "actividad" | "compra",
  sourceId: UUID,
): Expense[] {
  return gastos.filter(
    (g) => !(g.source.type === sourceType && g.source.id === sourceId),
  );
}

export interface Liquidation {
  total: number;
  porPersona: number;
  aportes: Record<UUID, number>;
  balances: Record<UUID, number>; // positivo = a favor, negativo = debe
  transferencia: { deId: UUID; aId: UUID; monto: number } | null;
}

/**
 * Liquidación 50/50: cada participante debe cubrir la mitad del total.
 * Retorna el aporte real, el balance y la transferencia necesaria.
 */
export function computeLiquidation(trip: Trip): Liquidation {
  const [p1, p2] = trip.participantes;
  const aportes: Record<UUID, number> = { [p1.id]: 0, [p2.id]: 0 };
  for (const g of trip.gastos) {
    aportes[g.pagadoPor] = (aportes[g.pagadoPor] ?? 0) + g.monto;
  }
  const total = aportes[p1.id] + aportes[p2.id];
  const porPersona = total / 2;
  const balances: Record<UUID, number> = {
    [p1.id]: aportes[p1.id] - porPersona,
    [p2.id]: aportes[p2.id] - porPersona,
  };

  let transferencia: Liquidation["transferencia"] = null;
  const diff = Math.abs(balances[p1.id]);
  if (diff > 0.005) {
    if (balances[p1.id] < 0) {
      transferencia = { deId: p1.id, aId: p2.id, monto: diff };
    } else {
      transferencia = { deId: p2.id, aId: p1.id, monto: diff };
    }
  }

  return { total, porPersona, aportes, balances, transferencia };
}

export function participantName(trip: Trip, id: UUID): string {
  return trip.participantes.find((p) => p.id === id)?.nombre ?? "—";
}

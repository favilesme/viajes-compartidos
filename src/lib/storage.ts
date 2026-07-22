// Servicio de persistencia versionada en localStorage.
// La versión del esquema permite migraciones futuras sin perder datos.

import type { ActivityStatus, AppState, Trip } from "./types";
import { buildDemoState } from "./demo";

const STORAGE_KEY = "viajes-compartidos:state";
export const CURRENT_VERSION = 1;

type Migration = (state: any) => any;
const migrations: Record<number, Migration> = {};

function migrate(state: any): AppState {
  let current = state;
  while (current.version < CURRENT_VERSION) {
    const migration = migrations[current.version];
    if (!migration) return buildDemoState();
    current = migration(current);
  }
  return current as AppState;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return buildDemoState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDemoState();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return buildDemoState();
    if (typeof parsed.version !== "number") return buildDemoState();
    return migrate(parsed);
  } catch (err) {
    console.warn("Estado corrupto en localStorage, reiniciando con demo.", err);
    return buildDemoState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("No se pudo persistir el estado.", err);
  }
}

export function resetToDemoState(): AppState {
  const fresh = buildDemoState();
  saveState(fresh);
  return fresh;
}

export function emptyState(): AppState {
  return { version: CURRENT_VERSION, trips: [], activeTripId: null };
}

export function clearAllState(): AppState {
  const empty = emptyState();
  saveState(empty);
  return empty;
}

export function exportStateJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

// ---------- Validación estricta para importación ----------

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

const VALID_STATUS: ActivityStatus[] = ["planificada", "realizada", "cancelada"];

function validateTrip(t: any, index: number): Trip {
  const path = `trips[${index}]`;
  if (!t || typeof t !== "object") throw new Error(`${path} no es un objeto.`);
  if (!isNonEmptyString(t.id)) throw new Error(`${path}.id inválido.`);
  if (!isNonEmptyString(t.nombre)) throw new Error(`${path}.nombre inválido.`);
  if (!isString(t.destino)) throw new Error(`${path}.destino inválido.`);
  if (!isNonEmptyString(t.moneda)) throw new Error(`${path}.moneda inválido.`);
  if (!isString(t.fechaInicio)) throw new Error(`${path}.fechaInicio inválido.`);
  if (!isString(t.fechaFin)) throw new Error(`${path}.fechaFin inválido.`);
  if (!Array.isArray(t.participantes) || t.participantes.length !== 2) {
    throw new Error(`${path}.participantes debe tener exactamente 2 elementos.`);
  }
  const parts = t.participantes.map((p: any, i: number) => {
    if (!p || !isNonEmptyString(p.id) || !isNonEmptyString(p.nombre)) {
      throw new Error(`${path}.participantes[${i}] inválido.`);
    }
    return { id: p.id, nombre: p.nombre };
  }) as Trip["participantes"];
  const partIds = new Set(parts.map((p) => p.id));

  if (!Array.isArray(t.gastos)) throw new Error(`${path}.gastos debe ser lista.`);
  if (!Array.isArray(t.actividades)) throw new Error(`${path}.actividades debe ser lista.`);
  if (!Array.isArray(t.compras)) throw new Error(`${path}.compras debe ser lista.`);

  const gastos = t.gastos.map((g: any, i: number) => {
    const gp = `${path}.gastos[${i}]`;
    if (!g || !isNonEmptyString(g.id)) throw new Error(`${gp}.id inválido.`);
    if (!isString(g.fecha)) throw new Error(`${gp}.fecha inválido.`);
    if (!isString(g.categoria)) throw new Error(`${gp}.categoria inválido.`);
    if (!isString(g.descripcion)) throw new Error(`${gp}.descripcion inválido.`);
    if (!isNumber(g.monto) || g.monto < 0) throw new Error(`${gp}.monto inválido.`);
    if (!partIds.has(g.pagadoPor)) throw new Error(`${gp}.pagadoPor no coincide con un participante.`);
    const src = g.source;
    if (!src || !isString(src.type) || !["manual", "actividad", "compra"].includes(src.type)) {
      throw new Error(`${gp}.source.type inválido.`);
    }
    if (src.type !== "manual" && !isNonEmptyString(src.id)) {
      throw new Error(`${gp}.source.id requerido.`);
    }
    return {
      id: g.id,
      fecha: g.fecha,
      categoria: g.categoria,
      descripcion: g.descripcion,
      monto: g.monto,
      pagadoPor: g.pagadoPor,
      notas: isString(g.notas) ? g.notas : undefined,
      source: src,
    };
  });

  const actividades = t.actividades.map((a: any, i: number) => {
    const ap = `${path}.actividades[${i}]`;
    if (!a || !isNonEmptyString(a.id)) throw new Error(`${ap}.id inválido.`);
    if (!isString(a.titulo)) throw new Error(`${ap}.titulo inválido.`);
    if (!isString(a.fecha)) throw new Error(`${ap}.fecha inválido.`);
    if (!isString(a.lugar)) throw new Error(`${ap}.lugar inválido.`);
    if (!VALID_STATUS.includes(a.estado)) throw new Error(`${ap}.estado inválido.`);
    if (!isNumber(a.costo) || a.costo < 0) throw new Error(`${ap}.costo inválido.`);
    if (!partIds.has(a.pagadoPor)) throw new Error(`${ap}.pagadoPor no coincide.`);
    return {
      id: a.id,
      titulo: a.titulo,
      fecha: a.fecha,
      lugar: a.lugar,
      estado: a.estado,
      costo: a.costo,
      pagadoPor: a.pagadoPor,
      notas: isString(a.notas) ? a.notas : undefined,
    };
  });

  const compras = t.compras.map((c: any, i: number) => {
    const cp = `${path}.compras[${i}]`;
    if (!c || !isNonEmptyString(c.id)) throw new Error(`${cp}.id inválido.`);
    if (!isString(c.fecha)) throw new Error(`${cp}.fecha inválido.`);
    if (!isString(c.producto)) throw new Error(`${cp}.producto inválido.`);
    if (!isNumber(c.cantidad) || c.cantidad < 0) throw new Error(`${cp}.cantidad inválido.`);
    if (!isNumber(c.precioUnitario) || c.precioUnitario < 0) throw new Error(`${cp}.precioUnitario inválido.`);
    if (!partIds.has(c.destinatario)) throw new Error(`${cp}.destinatario no coincide.`);
    if (!partIds.has(c.pagadoPor)) throw new Error(`${cp}.pagadoPor no coincide.`);
    if (!isBool(c.incluirComoGasto)) throw new Error(`${cp}.incluirComoGasto inválido.`);
    return {
      id: c.id,
      fecha: c.fecha,
      producto: c.producto,
      categoria: isString(c.categoria) ? c.categoria : "Otro",
      cantidad: c.cantidad,
      precioUnitario: c.precioUnitario,
      destinatario: c.destinatario,
      pagadoPor: c.pagadoPor,
      incluirComoGasto: c.incluirComoGasto,
      notas: isString(c.notas) ? c.notas : undefined,
    };
  });

  return {
    id: t.id,
    nombre: t.nombre,
    destino: t.destino,
    moneda: t.moneda,
    fechaInicio: t.fechaInicio,
    fechaFin: t.fechaFin,
    participantes: parts,
    gastos,
    actividades,
    compras,
    createdAt: isString(t.createdAt) ? t.createdAt : new Date().toISOString(),
  };
}

/**
 * Valida y normaliza un JSON importado. Lanza Error con causa clara si algo
 * es inválido: en ese caso el llamante NO debe reemplazar el estado actual.
 */
export function importStateJSON(json: string): AppState {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Archivo JSON inválido: raíz no es un objeto.");
  }
  if (typeof parsed.version !== "number") {
    throw new Error("Archivo JSON inválido: falta 'version'.");
  }
  if (parsed.version > CURRENT_VERSION) {
    throw new Error(
      `Versión ${parsed.version} no compatible (esta app soporta hasta ${CURRENT_VERSION}).`,
    );
  }
  if (!Array.isArray(parsed.trips)) {
    throw new Error("Archivo JSON inválido: 'trips' debe ser una lista.");
  }
  const trips = parsed.trips.map((t: any, i: number) => validateTrip(t, i));

  // activeTripId debe existir en la lista, o repararse al primero disponible.
  let activeTripId: string | null = null;
  if (typeof parsed.activeTripId === "string" && trips.some((t: Trip) => t.id === parsed.activeTripId)) {
    activeTripId = parsed.activeTripId;
  } else if (trips.length > 0) {
    activeTripId = trips[0].id;
  }

  return migrate({ version: parsed.version, trips, activeTripId });
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

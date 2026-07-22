// Servicio de persistencia versionada en localStorage.
// La versión del esquema permite migraciones futuras sin perder datos.

import type { AppState } from "./types";
import { buildDemoState } from "./demo";

const STORAGE_KEY = "viajes-compartidos:state";
export const CURRENT_VERSION = 1;

type Migration = (state: any) => any;

// Registro de migraciones por versión origen -> destino.
// Ejemplo futuro: migrations[1] = (s) => ({ ...s, version: 2, nuevaProp: [] });
const migrations: Record<number, Migration> = {};

function migrate(state: any): AppState {
  let current = state;
  while (current.version < CURRENT_VERSION) {
    const migration = migrations[current.version];
    if (!migration) {
      // Sin migración disponible: reiniciar con demo para evitar estado corrupto.
      return buildDemoState();
    }
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

export function resetState(): AppState {
  const fresh = buildDemoState();
  saveState(fresh);
  return fresh;
}

export function exportStateJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importStateJSON(json: string): AppState {
  const parsed = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null || typeof parsed.version !== "number") {
    throw new Error("Archivo JSON inválido: falta 'version'.");
  }
  if (!Array.isArray(parsed.trips)) {
    throw new Error("Archivo JSON inválido: 'trips' debe ser una lista.");
  }
  return migrate(parsed);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

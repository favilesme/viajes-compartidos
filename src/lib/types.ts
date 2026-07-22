// Modelo de dominio de la aplicación Viajes Compartidos.
// Todos los tipos se persisten en localStorage con versionado (ver storage.ts).

export type UUID = string;

export type ActivityStatus = "planificada" | "realizada" | "cancelada";

export type ExpenseSource =
  | { type: "manual" }
  | { type: "actividad"; id: UUID }
  | { type: "compra"; id: UUID };

export interface Participant {
  id: UUID;
  nombre: string;
}

export interface Expense {
  id: UUID;
  fecha: string; // ISO yyyy-mm-dd
  categoria: string;
  descripcion: string;
  monto: number;
  pagadoPor: UUID; // participant id
  notas?: string;
  source: ExpenseSource;
}

export interface Activity {
  id: UUID;
  titulo: string;
  fecha: string;
  lugar: string;
  estado: ActivityStatus;
  costo: number;
  pagadoPor: UUID;
  notas?: string;
}

export interface Purchase {
  id: UUID;
  fecha: string;
  producto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  destinatario: UUID;
  pagadoPor: UUID;
  incluirComoGasto: boolean;
  notas?: string;
}

export interface Trip {
  id: UUID;
  nombre: string;
  destino: string;
  moneda: string;
  fechaInicio: string;
  fechaFin: string;
  participantes: [Participant, Participant];
  gastos: Expense[];
  actividades: Activity[];
  compras: Purchase[];
  createdAt: string;
}

export interface AppState {
  version: number;
  trips: Trip[];
  activeTripId: UUID | null;
}

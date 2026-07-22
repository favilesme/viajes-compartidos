// Datos demostrativos: un viaje a Cuenca (Ecuador) con dos participantes.
import type { AppState, Trip } from "./types";
import { CURRENT_VERSION } from "./storage";

function demoTrip(): Trip {
  const p1 = { id: "demo-participante-1", nombre: "María" };
  const p2 = { id: "demo-participante-2", nombre: "Andrés" };

  return {
    id: "demo-viaje-cuenca",
    nombre: "Escapada a Cuenca",
    destino: "Cuenca, Ecuador",
    moneda: "USD",
    fechaInicio: "2026-08-14",
    fechaFin: "2026-08-18",
    participantes: [p1, p2],
    createdAt: new Date().toISOString(),
    actividades: [
      {
        id: "demo-act-1",
        titulo: "Tour Centro Histórico",
        fecha: "2026-08-15",
        lugar: "Cuenca Centro",
        estado: "realizada",
        costo: 40,
        pagadoPor: p1.id,
        notas: "Guía local, 3 horas.",
      },
      {
        id: "demo-act-2",
        titulo: "Excursión Parque Cajas",
        fecha: "2026-08-16",
        lugar: "Parque Nacional Cajas",
        estado: "planificada",
        costo: 90,
        pagadoPor: p2.id,
      },
      {
        id: "demo-act-3",
        titulo: "Cena en El Sagrario",
        fecha: "2026-08-17",
        lugar: "Restaurante El Sagrario",
        estado: "cancelada",
        costo: 60,
        pagadoPor: p1.id,
      },
    ],
    compras: [
      {
        id: "demo-compra-1",
        fecha: "2026-08-15",
        producto: "Sombrero de paja toquilla",
        cantidad: 2,
        precioUnitario: 35,
        destinatario: p1.id,
        pagadoPor: p2.id,
        incluirComoGasto: true,
        notas: "Uno para cada uno, mercado artesanal.",
      },
      {
        id: "demo-compra-2",
        fecha: "2026-08-16",
        producto: "Chocolate artesanal",
        cantidad: 4,
        precioUnitario: 6,
        destinatario: p2.id,
        pagadoPor: p2.id,
        incluirComoGasto: false,
      },
    ],
    gastos: [
      {
        id: "demo-gasto-1",
        fecha: "2026-08-14",
        categoria: "Transporte",
        descripcion: "Vuelo Quito → Cuenca (ambos)",
        monto: 180,
        pagadoPor: p1.id,
        source: { type: "manual" },
      },
      {
        id: "demo-gasto-2",
        fecha: "2026-08-14",
        categoria: "Alojamiento",
        descripcion: "Hostal Posada del Ángel (4 noches)",
        monto: 240,
        pagadoPor: p2.id,
        source: { type: "manual" },
      },
      // Gasto vinculado a actividad realizada
      {
        id: "demo-gasto-act-1",
        fecha: "2026-08-15",
        categoria: "Actividad",
        descripcion: "Tour Centro Histórico",
        monto: 40,
        pagadoPor: p1.id,
        source: { type: "actividad", id: "demo-act-1" },
      },
      // Gasto vinculado a compra marcada como gasto
      {
        id: "demo-gasto-compra-1",
        fecha: "2026-08-15",
        categoria: "Compra",
        descripcion: "Sombrero de paja toquilla (x2)",
        monto: 70,
        pagadoPor: p2.id,
        source: { type: "compra", id: "demo-compra-1" },
      },
    ],
  };
}

export function buildDemoState(): AppState {
  return {
    version: CURRENT_VERSION,
    trips: [demoTrip()],
    activeTripId: "demo-viaje-cuenca",
  };
}

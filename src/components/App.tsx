// Shell principal: usa el estado sincronizado en la nube (useCloudState),
// gestiona la navegación por pestañas y el cierre de sesión.
import { useCallback, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Trip } from "../lib/types";
import { useCloudState } from "../lib/useCloudState";
import { lockWorkspace } from "../lib/workspace.functions";
import { TripSelector } from "./TripSelector";
import { Inicio } from "./Inicio";
import { Gastos } from "./Gastos";
import { Actividades } from "./Actividades";
import { Compras } from "./Compras";
import { Responsables } from "./Responsables";
import { ResumenInteligente } from "./ResumenInteligente";
import { ImportExport } from "./ImportExport";

type Tab =
  | "inicio"
  | "gastos"
  | "actividades"
  | "compras"
  | "responsables"
  | "resumen"
  | "datos";

const TABS: { id: Tab; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "gastos", label: "Gastos" },
  { id: "actividades", label: "Actividades" },
  { id: "compras", label: "Compras" },
  { id: "responsables", label: "Responsables" },
  { id: "resumen", label: "Resumen inteligente" },
  { id: "datos", label: "Datos" },
];

interface Props {
  onCerrarSesion: () => void;
}

export function App({ onCerrarSesion }: Props) {
  const { state, setState, isLoading, guardando } = useCloudState();
  const lockFn = useServerFn(lockWorkspace);
  const [tab, setTab] = useState<Tab>("inicio");

  const tripActivo = useMemo<Trip | null>(
    () => state.trips.find((t) => t.id === state.activeTripId) ?? null,
    [state],
  );

  const actualizarTrip = useCallback(
    (nuevo: Trip) => {
      setState((s) => ({
        ...s,
        trips: s.trips.map((t) => (t.id === nuevo.id ? nuevo : t)),
      }));
    },
    [setState],
  );

  async function logout() {
    try {
      await lockFn();
    } finally {
      onCerrarSesion();
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              Anima Praxis
            </p>
            <h1 className="text-base font-semibold leading-tight">
              Viajes Compartidos
            </h1>
            <p className="text-xs opacity-80">
              Gestión colaborativa sincronizada entre dispositivos
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-xs opacity-80"
              aria-live="polite"
              aria-atomic="true"
            >
              {guardando ? "Guardando…" : "Sincronizado"}
            </span>
            <TripSelector state={state} onChange={setState} />
            <button
              type="button"
              onClick={logout}
              className="btn-outline-onprimary"
              data-header-action="true"
              aria-label="Cerrar sesión"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <nav aria-label="Secciones principales" className="mx-auto max-w-6xl px-2">
          <ul role="tablist" className="flex flex-wrap gap-1 pb-2">
            {TABS.map((t) => {
              const activo = tab === t.id;
              return (
                <li key={t.id} role="presentation">
                  <button
                    role="tab"
                    aria-selected={activo}
                    aria-controls={`panel-${t.id}`}
                    id={`tab-${t.id}`}
                    onClick={() => setTab(t.id)}
                    className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
                      activo
                        ? "bg-background text-foreground"
                        : "text-primary-foreground/90 hover:bg-primary-foreground/15"
                    }`}
                  >
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mx-auto max-w-6xl px-4 py-6"
      >
        {isLoading ? (
          <div className="card-surface text-center text-muted-foreground">
            Cargando datos del viaje…
          </div>
        ) : !tripActivo ? (
          <div className="card-surface text-center">
            <p className="text-muted-foreground">
              No hay viaje activo. Crea uno desde la barra superior para empezar.
            </p>
          </div>
        ) : tab === "inicio" ? (
          <Inicio trip={tripActivo} />
        ) : tab === "gastos" ? (
          <Gastos trip={tripActivo} onUpdateTrip={actualizarTrip} />
        ) : tab === "actividades" ? (
          <Actividades trip={tripActivo} onUpdateTrip={actualizarTrip} />
        ) : tab === "compras" ? (
          <Compras trip={tripActivo} onUpdateTrip={actualizarTrip} />
        ) : tab === "responsables" ? (
          <Responsables trip={tripActivo} />
        ) : tab === "resumen" ? (
          <ResumenInteligente />
        ) : (
          <ImportExport state={state} onImportar={setState} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-muted-foreground">
        Anima Praxis · Viajes Compartidos — datos sincronizados en Lovable Cloud.
      </footer>
    </div>
  );
}

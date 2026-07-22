// Shell principal: gestiona el estado global, la navegación por pestañas,
// el cierre de sesión y renderiza la vista activa.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppState, Trip } from "../lib/types";
import { loadState, saveState } from "../lib/storage";
import { closeSession } from "../lib/auth";
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
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<Tab>("inicio");

  useEffect(() => {
    saveState(state);
  }, [state]);

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
    [],
  );

  function logout() {
    closeSession();
    onCerrarSesion();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange text-orange-foreground text-sm font-bold"
            >
              VC
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Viajes Compartidos</h1>
              <p className="text-xs opacity-80">Gestión colaborativa entre dos personas</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TripSelector state={state} onChange={setState} />
            <button
              type="button"
              onClick={logout}
              className="btn-ghost bg-transparent text-brand-foreground border-brand-foreground/40 hover:bg-brand-foreground/10"
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
                        : "text-brand-foreground/80 hover:bg-brand-foreground/10"
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
        {!tripActivo ? (
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
        Viajes Compartidos — datos guardados localmente en tu navegador.
      </footer>
    </div>
  );
}

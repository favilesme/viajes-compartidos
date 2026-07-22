// Pantalla preparada para una futura integración de resumen con OpenAI.
// IMPORTANTE: no se llama a ninguna API, no se envían datos y no hay costos.
// El botón permanece deshabilitado hasta que AI_FEATURE.enabled sea true.
import { AI_FEATURE } from "../lib/ai";

export function ResumenInteligente() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Resumen inteligente</h2>

      <div className="card-surface">
        <p className="text-sm">
          Esta sección está preparada para generar un resumen automático del
          viaje con inteligencia artificial en el futuro.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Por ahora la función está deshabilitada: <strong>no se envían datos</strong>,{" "}
          <strong>no se realizan llamadas a APIs externas</strong> y{" "}
          <strong>no hay costos asociados</strong>.
        </p>

        <div className="mt-4">
          <button
            type="button"
            className="btn-accent"
            disabled={!AI_FEATURE.enabled}
            aria-disabled={!AI_FEATURE.enabled}
            title="Función no disponible todavía"
          >
            Generar resumen (próximamente)
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-secondary p-3">
            <dt className="text-xs font-semibold uppercase text-muted-foreground">
              Habilitado
            </dt>
            <dd className="mt-1 font-medium">{String(AI_FEATURE.enabled)}</dd>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <dt className="text-xs font-semibold uppercase text-muted-foreground">
              Proveedor
            </dt>
            <dd className="mt-1 font-medium">{AI_FEATURE.provider}</dd>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <dt className="text-xs font-semibold uppercase text-muted-foreground">
              Endpoint
            </dt>
            <dd className="mt-1 font-medium">{AI_FEATURE.endpoint ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

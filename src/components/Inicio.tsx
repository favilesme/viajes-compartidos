// Resumen general del viaje activo.
import type { Trip } from "../lib/types";
import { computeLiquidation, participantName } from "../lib/derive";

interface Props {
  trip: Trip;
}

export function Inicio({ trip }: Props) {
  const liq = computeLiquidation(trip);
  const actRealizadas = trip.actividades.filter((a) => a.estado === "realizada").length;
  const actPlanificadas = trip.actividades.filter((a) => a.estado === "planificada").length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <section className="card-surface md:col-span-2 xl:col-span-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{trip.nombre}</h2>
            <p className="text-sm text-muted-foreground">
              {trip.destino} · {trip.fechaInicio} → {trip.fechaFin}
            </p>
          </div>
          <span className="badge-status bg-emerald text-emerald-foreground">
            {trip.moneda}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Participantes:</span>
          {trip.participantes.map((p) => (
            <span key={p.id} className="rounded-full bg-secondary px-3 py-0.5 text-secondary-foreground">
              {p.nombre}
            </span>
          ))}
        </div>
      </section>

      <StatCard titulo="Total gastado" valor={`${liq.total.toFixed(2)} ${trip.moneda}`} tono="brand" />
      <StatCard titulo="Por persona (50/50)" valor={`${liq.porPersona.toFixed(2)} ${trip.moneda}`} tono="emerald" />
      <StatCard
        titulo="Actividades"
        valor={`${actRealizadas} realizadas · ${actPlanificadas} planificadas`}
        tono="orange"
      />

      <section className="card-surface md:col-span-2 xl:col-span-3">
        <h3 className="text-base font-semibold text-foreground">Liquidación 50/50</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {trip.participantes.map((p) => {
            const balance = liq.balances[p.id] ?? 0;
            const positivo = balance >= 0;
            return (
              <div key={p.id} className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">{p.nombre}</p>
                <p className="mt-1 text-lg font-semibold">
                  Aportó {(liq.aportes[p.id] ?? 0).toFixed(2)} {trip.moneda}
                </p>
                <p
                  className={`text-sm font-medium ${
                    positivo ? "text-emerald" : "text-destructive"
                  }`}
                >
                  {positivo ? "A favor" : "Debe"} {Math.abs(balance).toFixed(2)} {trip.moneda}
                </p>
              </div>
            );
          })}
        </div>
        {liq.transferencia ? (
          <p className="mt-4 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
            Para saldar:{" "}
            <strong>{participantName(trip, liq.transferencia.deId)}</strong> transfiere{" "}
            <strong>
              {liq.transferencia.monto.toFixed(2)} {trip.moneda}
            </strong>{" "}
            a <strong>{participantName(trip, liq.transferencia.aId)}</strong>.
          </p>
        ) : (
          <p className="mt-4 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
            Las cuentas están equilibradas.
          </p>
        )}
      </section>
    </div>
  );
}

function StatCard({
  titulo,
  valor,
  tono,
}: {
  titulo: string;
  valor: string;
  tono: "brand" | "emerald" | "orange";
}) {
  const bg =
    tono === "brand"
      ? "bg-brand text-brand-foreground"
      : tono === "emerald"
        ? "bg-emerald text-emerald-foreground"
        : "bg-orange text-orange-foreground";
  return (
    <div className={`card-surface ${bg} border-transparent`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{titulo}</p>
      <p className="mt-2 text-2xl font-bold">{valor}</p>
    </div>
  );
}

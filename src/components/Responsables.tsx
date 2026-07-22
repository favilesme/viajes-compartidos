// Vista de aportes por participante y liquidación 50/50.
import type { Trip } from "../lib/types";
import { computeLiquidation, participantName } from "../lib/derive";

interface Props {
  trip: Trip;
}

export function Responsables({ trip }: Props) {
  const liq = computeLiquidation(trip);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Responsables</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {trip.participantes.map((p) => {
          const aporte = liq.aportes[p.id] ?? 0;
          const balance = liq.balances[p.id] ?? 0;
          const positivo = balance >= 0;
          const gastosDe = trip.gastos.filter((g) => g.pagadoPor === p.id).length;
          return (
            <article key={p.id} className="card-surface">
              <h3 className="text-lg font-semibold">{p.nombre}</h3>
              <p className="text-sm text-muted-foreground">{gastosDe} gastos registrados</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt>Aporte</dt>
                  <dd className="font-medium">
                    {aporte.toFixed(2)} {trip.moneda}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Cuota 50/50</dt>
                  <dd>
                    {liq.porPersona.toFixed(2)} {trip.moneda}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt>{positivo ? "A favor" : "Debe"}</dt>
                  <dd
                    className={`font-semibold ${
                      positivo ? "text-emerald" : "text-destructive"
                    }`}
                  >
                    {Math.abs(balance).toFixed(2)} {trip.moneda}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="card-surface">
        <h3 className="text-base font-semibold">Liquidación sugerida</h3>
        {liq.transferencia ? (
          <p className="mt-2 text-sm">
            <strong>{participantName(trip, liq.transferencia.deId)}</strong> debe
            transferir{" "}
            <strong>
              {liq.transferencia.monto.toFixed(2)} {trip.moneda}
            </strong>{" "}
            a <strong>{participantName(trip, liq.transferencia.aId)}</strong> para
            saldar el viaje.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No hay transferencias pendientes.
          </p>
        )}
      </div>
    </section>
  );
}

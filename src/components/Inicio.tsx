// Resumen del viaje activo con distribución por categoría, totales por día,
// liquidación 50/50 y las tres actividades y compras más recientes.
// Los gráficos son barras CSS accesibles (sin dependencias externas).
import { useMemo } from "react";
import type { Trip } from "../lib/types";
import { computeLiquidation, participantName } from "../lib/derive";

interface Props {
  trip: Trip;
}

export function Inicio({ trip }: Props) {
  const liq = computeLiquidation(trip);
  const actRealizadas = trip.actividades.filter((a) => a.estado === "realizada").length;
  const actPlanificadas = trip.actividades.filter((a) => a.estado === "planificada").length;

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of trip.gastos) {
      map.set(g.categoria, (map.get(g.categoria) ?? 0) + g.monto);
    }
    return Array.from(map.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [trip.gastos]);

  const porDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of trip.gastos) {
      map.set(g.fecha, (map.get(g.fecha) ?? 0) + g.monto);
    }
    return Array.from(map.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [trip.gastos]);

  const recientesAct = useMemo(
    () =>
      trip.actividades
        .slice()
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, 3),
    [trip.actividades],
  );

  const recientesCompras = useMemo(
    () =>
      trip.compras
        .slice()
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, 3),
    [trip.compras],
  );

  const maxCat = Math.max(1, ...porCategoria.map((c) => c.total));
  const maxDia = Math.max(1, ...porDia.map((d) => d.total));

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
          <span className="badge-status bg-emerald text-emerald-foreground">{trip.moneda}</span>
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
      <StatCard titulo="Actividades" valor={`${actRealizadas} realizadas · ${actPlanificadas} planificadas`} tono="orange" />

      {/* Distribución por categoría */}
      <section className="card-surface md:col-span-2 xl:col-span-2" aria-labelledby="cat-title">
        <h3 id="cat-title" className="text-base font-semibold">Gastos por categoría</h3>
        {porCategoria.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay gastos.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {porCategoria.map((c) => {
              const pct = Math.round((c.total / maxCat) * 100);
              return (
                <li key={c.categoria}>
                  <div className="flex justify-between text-sm">
                    <span>{c.categoria}</span>
                    <span className="font-medium">{c.total.toFixed(2)} {trip.moneda}</span>
                  </div>
                  <div
                    className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary"
                    role="img"
                    aria-label={`${c.categoria}: ${c.total.toFixed(2)} ${trip.moneda}`}
                  >
                    <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Totales por día */}
      <section className="card-surface xl:col-span-1" aria-labelledby="dia-title">
        <h3 id="dia-title" className="text-base font-semibold">Gastos por día</h3>
        {porDia.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay gastos.</p>
        ) : (
          <ul className="mt-3 flex items-end justify-between gap-2">
            {porDia.map((d) => {
              const pct = Math.max(6, Math.round((d.total / maxDia) * 100));
              return (
                <li key={d.fecha} className="flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t bg-orange"
                    style={{ height: `${pct}px` }}
                    role="img"
                    aria-label={`${d.fecha}: ${d.total.toFixed(2)} ${trip.moneda}`}
                  />
                  <span className="mt-1 text-[10px] text-muted-foreground">{d.fecha.slice(5)}</span>
                  <span className="text-[10px] font-medium">{d.total.toFixed(0)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Liquidación */}
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
                <p className={`text-sm font-medium ${positivo ? "text-emerald" : "text-destructive"}`}>
                  {positivo ? "A favor" : "Debe"} {Math.abs(balance).toFixed(2)} {trip.moneda}
                </p>
              </div>
            );
          })}
        </div>
        {liq.transferencia ? (
          <p className="mt-4 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
            Para saldar: <strong>{participantName(trip, liq.transferencia.deId)}</strong> transfiere{" "}
            <strong>{liq.transferencia.monto.toFixed(2)} {trip.moneda}</strong> a{" "}
            <strong>{participantName(trip, liq.transferencia.aId)}</strong>.
          </p>
        ) : (
          <p className="mt-4 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
            Las cuentas están equilibradas.
          </p>
        )}
      </section>

      {/* Recientes */}
      <section className="card-surface" aria-labelledby="rec-act-title">
        <h3 id="rec-act-title" className="text-base font-semibold">Actividades recientes</h3>
        {recientesAct.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin actividades.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recientesAct.map((a) => (
              <li key={a.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{a.titulo}</span>
                  <span className="text-xs text-muted-foreground">{a.fecha}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.estado} · {a.costo.toFixed(2)} {trip.moneda}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface md:col-span-2" aria-labelledby="rec-com-title">
        <h3 id="rec-com-title" className="text-base font-semibold">Compras recientes</h3>
        {recientesCompras.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin compras.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recientesCompras.map((c) => (
              <li key={c.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{c.producto}</span>
                  <span className="text-xs text-muted-foreground">{c.fecha}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.categoria} · x{c.cantidad} · {(c.cantidad * c.precioUnitario).toFixed(2)} {trip.moneda} · para {participantName(trip, c.destinatario)}
                </p>
              </li>
            ))}
          </ul>
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

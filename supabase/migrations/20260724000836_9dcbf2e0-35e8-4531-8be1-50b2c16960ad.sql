
-- workspaces holds one row per shared passcode. snapshot is the full AppState JSON.
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passcode_hash TEXT NOT NULL UNIQUE,
  snapshot JSONB NOT NULL DEFAULT '{"version":1,"trips":[],"activeTripId":null}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- workspace_sync surfaces only id + updated_at for realtime beacons (no secrets).
CREATE TABLE public.workspace_sync (
  workspace_id UUID NOT NULL PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.workspaces TO service_role;
GRANT SELECT ON public.workspace_sync TO anon, authenticated;
GRANT ALL ON public.workspace_sync TO service_role;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_sync ENABLE ROW LEVEL SECURITY;

-- workspaces: locked. Only service_role (server functions) may access.
CREATE POLICY "no direct access to workspaces"
  ON public.workspaces FOR SELECT
  USING (false);

-- workspace_sync: public read so browsers can subscribe to updated_at changes.
CREATE POLICY "anyone can read sync beacon"
  ON public.workspace_sync FOR SELECT
  USING (true);

-- Keep workspace_sync.updated_at in step with workspaces.updated_at.
CREATE OR REPLACE FUNCTION public.touch_workspace_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_sync(workspace_id, updated_at)
  VALUES (NEW.id, NEW.updated_at)
  ON CONFLICT (workspace_id)
  DO UPDATE SET updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER workspaces_touch_sync
AFTER INSERT OR UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.touch_workspace_sync();

-- Enable realtime on workspace_sync so both devices refetch on save.
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_sync;

-- Seed the shared workspace with the current SHA-256 passcode hash and demo data.
INSERT INTO public.workspaces (id, passcode_hash, snapshot)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '1b3affbe74447a9569dbdf36ae7002f630682fbb6094031cab5a714e3beca413',
  '{
    "version": 1,
    "activeTripId": "demo-viaje-cuenca",
    "trips": [
      {
        "id": "demo-viaje-cuenca",
        "nombre": "Escapada a Cuenca",
        "destino": "Cuenca, Ecuador",
        "moneda": "USD",
        "fechaInicio": "2026-08-14",
        "fechaFin": "2026-08-18",
        "createdAt": "2026-08-01T00:00:00.000Z",
        "participantes": [
          {"id":"demo-participante-1","nombre":"María"},
          {"id":"demo-participante-2","nombre":"Andrés"}
        ],
        "actividades": [
          {"id":"demo-act-1","titulo":"Tour Centro Histórico","fecha":"2026-08-15","lugar":"Cuenca Centro","estado":"realizada","costo":40,"pagadoPor":"demo-participante-1","notas":"Guía local, 3 horas."},
          {"id":"demo-act-2","titulo":"Excursión Parque Cajas","fecha":"2026-08-16","lugar":"Parque Nacional Cajas","estado":"planificada","costo":90,"pagadoPor":"demo-participante-2"},
          {"id":"demo-act-3","titulo":"Cena en El Sagrario","fecha":"2026-08-17","lugar":"Restaurante El Sagrario","estado":"cancelada","costo":60,"pagadoPor":"demo-participante-1"}
        ],
        "compras": [
          {"id":"demo-compra-1","fecha":"2026-08-15","producto":"Sombrero de paja toquilla","categoria":"Artesanía","cantidad":2,"precioUnitario":35,"destinatario":"demo-participante-1","pagadoPor":"demo-participante-2","incluirComoGasto":true,"notas":"Uno para cada uno, mercado artesanal."},
          {"id":"demo-compra-2","fecha":"2026-08-16","producto":"Chocolate artesanal","categoria":"Regalo","cantidad":4,"precioUnitario":6,"destinatario":"demo-participante-2","pagadoPor":"demo-participante-2","incluirComoGasto":false}
        ],
        "gastos": [
          {"id":"demo-gasto-1","fecha":"2026-08-14","categoria":"Transporte","descripcion":"Vuelo Quito → Cuenca (ambos)","monto":180,"pagadoPor":"demo-participante-1","notas":"Ida y vuelta.","source":{"type":"manual"}},
          {"id":"demo-gasto-2","fecha":"2026-08-14","categoria":"Alojamiento","descripcion":"Hostal Posada del Ángel (4 noches)","monto":240,"pagadoPor":"demo-participante-2","source":{"type":"manual"}},
          {"id":"demo-gasto-3","fecha":"2026-08-15","categoria":"Comida","descripcion":"Almuerzo Mercado 10 de Agosto","monto":18,"pagadoPor":"demo-participante-1","source":{"type":"manual"}},
          {"id":"demo-gasto-act-1","fecha":"2026-08-15","categoria":"Actividad","descripcion":"Tour Centro Histórico","monto":40,"pagadoPor":"demo-participante-1","source":{"type":"actividad","id":"demo-act-1"}},
          {"id":"demo-gasto-compra-1","fecha":"2026-08-15","categoria":"Compra","descripcion":"Sombrero de paja toquilla (x2)","monto":70,"pagadoPor":"demo-participante-2","source":{"type":"compra","id":"demo-compra-1"}}
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (passcode_hash) DO NOTHING;

INSERT INTO public.workspace_sync (workspace_id)
SELECT id FROM public.workspaces
ON CONFLICT DO NOTHING;

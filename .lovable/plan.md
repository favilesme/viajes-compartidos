
# Plan: Cloud + Anima Praxis rebrand

## 1. Habilitar Lovable Cloud

Activo Lovable Cloud (Supabase gestionado). No expondré el nombre Supabase en la UI.

## 2. Modelo de datos (migración SQL)

Un solo "workspace" compartido: cualquier dispositivo con el passcode ve los mismos viajes.

Tablas en `public`, con RLS + GRANTs explícitos:

- `workspaces` — `id`, `passcode_hash` (SHA-256), `created_at`. Semilla: un workspace inicial con el hash actual (`1b3affbe…`).
- `trips` — `id`, `workspace_id`, `nombre`, `destino`, `moneda`, `fecha_inicio`, `fecha_fin`, `created_at`.
- `participants` — `id`, `trip_id`, `nombre`, `orden` (0/1).
- `expenses` — `id`, `trip_id`, `fecha`, `categoria`, `descripcion`, `monto`, `pagado_por` (fk participants), `notas`, `source_type` ('manual'|'actividad'|'compra'), `source_id`, `created_at`.
- `activities` — `id`, `trip_id`, `titulo`, `fecha`, `lugar`, `estado`, `costo`, `pagado_por`, `notas`.
- `purchases` — `id`, `trip_id`, `producto`, `categoria`, `cantidad`, `precio_unitario`, `destinatario`, `pagado_por`, `incluir_como_gasto`, `notas`, `fecha`.

Restricciones: `participants` limitado a 2 por trip vía trigger; FKs con `ON DELETE CASCADE`.

### RLS (passcode compartido)

- No hay `auth.users`. El acceso lo controla una **sesión firmada** en cookie (server function la emite tras validar passcode).
- Todas las lecturas/escrituras van por **server functions** (`createServerFn`) que verifican la cookie de sesión y luego usan `supabaseAdmin` para operar sobre las filas del `workspace_id` correspondiente.
- RLS: `USING (false)` para `anon` y `authenticated` en todas las tablas (nadie accede al Data API directo). `service_role` opera vía server functions.
- GRANTs: `GRANT ALL … TO service_role` en cada tabla; nada para `anon`/`authenticated`.

Ventaja: el passcode nunca sale del servidor, y el hash SHA-256 se compara con `timingSafeEqual`.

## 3. Autenticación (passcode compartido)

- Nuevo endpoint `unlockWorkspace` (`createServerFn`): recibe passcode, calcula SHA-256, compara con `workspaces.passcode_hash`, firma cookie httpOnly (`iron-session` estilo `useSession`) con `workspace_id`.
- `lockWorkspace`: limpia la sesión.
- Middleware `requireWorkspace` para todas las server functions de datos: lee la cookie, adjunta `workspaceId` al contexto, o lanza 401.
- Secretos: `SESSION_SECRET` (generado con `generate_secret`), `SITE_PASSWORD_HASH` (ya sembrado en DB, no en env).
- Cliente: reemplazo `src/components/Login.tsx` para llamar a `unlockWorkspace` en vez de comparar hash local. Sigue siendo puerta básica, no auth empresarial (comentario).

## 4. Capa de datos con TanStack Query

- Nuevo `src/lib/trips.functions.ts` con server functions: `listTrips`, `upsertTrip`, `deleteTrip`, `upsertExpense`, `deleteExpense`, `upsertActivity`, `deleteActivity`, `upsertPurchase`, `deletePurchase`.
- Cada mutación de actividad/compra que produce gasto vinculado hace el `upsert` del `expenses` con `source_type` correspondiente dentro de la misma transacción (RPC PL/pgSQL) para conservar la lógica actual sin duplicados.
- `queryOptions(['trips', workspaceId])` cacheados; invalidación tras cada mutación.
- Realtime: suscripción a canales `postgres_changes` de `trips/expenses/activities/purchases` filtrados por `workspace_id` → `queryClient.invalidateQueries` (sincroniza dispositivos casi en vivo tras auth).
- `localStorage` deja de ser fuente de verdad; queda solo `activeTripId` local por dispositivo.

## 5. Migración de datos existentes

- `storage.ts` conserva un helper único `migrateLocalToCloud()` que empuja el snapshot local al workspace la primera vez que el usuario entra (opt-in con confirmación) y luego marca `migrated=true` en localStorage.
- Datos demo de Cuenca: sembrados vía migración SQL en el workspace inicial si está vacío.

## 6. Paleta Anima Praxis (sin logo)

Reemplazo tokens en `src/styles.css` (`@theme inline` + `:root`) con oklch equivalente:

- `--background`: crema muy claro (fondos)
- `--foreground` / `--primary`: **#192538** azul profundo
- `--secondary` / `--muted`: **#5A626F** gris pizarra (y variantes claras)
- `--accent`: **#D6A871** dorado suave (uso puntual, no dominante)
- `--card`: blanco puro
- `--destructive`: rojo con contraste AA sobre blanco
- Se retiran tokens `emerald/cream/orange`; sustituyo referencias en componentes por `primary/secondary/accent`.

Header: bloque tipográfico "Anima Praxis · Viajes Compartidos" (wordmark) en azul profundo, sin imagen.

## 7. Auditoría de contraste (WCAG AA)

Reviso y ajusto:

- Botones `.btn-primary`, `.btn-accent`, `.btn-danger`, `.btn-ghost`: garantizo ratio ≥4.5:1 texto/fondo en estados normal, hover, disabled (disabled con borde visible, no solo opacity).
- Badges `badge-status` (usadas para estado de actividad, origen de gasto): fondos con foreground contrastado; el naranja actual sobre blanco falla → sustituyo por dorado/azul según semántica.
- `field-input` placeholder: `text-muted-foreground` sobre `card`.
- `focus-visible`: outline dorado 2px, offset 2px (ya existe, verifico visibilidad sobre todos los fondos).
- Enlaces y labels: `text-muted-foreground` recalibrado a oklch con L≤0.45 sobre crema para pasar AA.
- Verifico con contraste manual (fórmula APCA/relativa) los pares clave y ajusto valores oklch.

## 8. Accesibilidad general

- Un solo `<main>` en la shell.
- Botones icon-only con `aria-label` (revisar `TripSelector`, `ConfirmDialog`).
- Diálogos ya son `role="dialog" aria-modal`; añado trap de foco con `useEffect` mínimo.
- Sin errores en consola tras cambios.

## 9. IA (sin cambios)

`ResumenInteligente` sigue deshabilitado con `AI_FEATURE.enabled=false`.

## 10. Verificación

- Typecheck limpio.
- Preview: unlock con passcode, crear gasto en un navegador, ver que aparece al recargar en otro contexto (realtime).
- Auditoría visual de las 8 secciones con la nueva paleta.
- Consola sin warnings.

## Detalles técnicos

- Server functions bajo `src/lib/*.functions.ts`; `supabaseAdmin` cargado con `await import` dentro del handler.
- Cookie de sesión: `useSession` de `@tanstack/react-start/server`, cookie httpOnly + secure + sameSite lax, 7 días.
- `functionMiddleware` no requiere `attachSupabaseAuth` (no usamos JWT Supabase); la cookie viaja sola.
- Realtime: cliente browser `supabase` con publishable key; canal filtrado por `workspace_id` que el server function le entrega tras unlock (no es secreto, solo un uuid).
- Sin nuevas dependencias npm (uso `crypto` de Node, `@tanstack/react-start/server`, cliente Supabase generado).

## Fuera de alcance

- Logo (por decisión del usuario).
- Cuentas por usuario / roles.
- IA generativa.
- Nueva funcionalidad de dominio (mantengo secciones actuales tal cual).

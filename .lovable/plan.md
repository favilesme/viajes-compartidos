# Viajes Compartidos — Plan de proyecto

Aplicación web para publicar y buscar viajes compartidos entre conductores y pasajeros, con reserva de asientos y contacto directo.

## Supuestos (confírmame si algo cambia)

- Público: personas en LATAM que quieren compartir trayectos urbanos e interurbanos.
- Idioma: español, tratamiento "tú".
- Alcance inicial: MVP funcional, no marketplace con pagos.
- Backend: Lovable Cloud (auth + base de datos + storage para foto de perfil).
- Sin pagos en línea en el MVP; el pago se acuerda entre partes.
- Sin app móvil nativa; web responsiva mobile-first.

## Funcionalidades del MVP

1. **Autenticación**
   - Registro e inicio de sesión con email + contraseña.
   - Perfil de usuario: nombre, teléfono (WhatsApp), foto, breve bio, rol preferido (conductor/pasajero/ambos).

2. **Publicar viaje (conductor)**
   - Origen, destino, fecha y hora de salida.
   - Asientos disponibles, precio por asiento, modelo/color del auto, notas (equipaje, mascotas, música).
   - Punto de encuentro y punto de bajada.

3. **Buscar viajes (pasajero)**
   - Filtros: origen, destino, fecha, asientos requeridos, rango de precio.
   - Listado con tarjetas: conductor, hora, precio, asientos libres.
   - Detalle del viaje con mapa estático opcional (fase 2).

4. **Reserva de asientos**
   - Solicitud de reserva (1+ asientos) sujeta a aprobación del conductor.
   - Estados: pendiente, aceptada, rechazada, cancelada.
   - Descuento automático de asientos disponibles al aceptar.

5. **Panel del usuario**
   - Mis viajes publicados (como conductor).
   - Mis reservas (como pasajero).
   - Historial de viajes pasados.

6. **Contacto**
   - Botón para abrir WhatsApp con el conductor una vez aceptada la reserva.

7. **Confianza básica**
   - Calificación 1–5 estrellas + comentario tras finalizar un viaje (fase 2 si el tiempo aprieta).

## Estructura de rutas (TanStack Start)

```text
src/routes/
  __root.tsx              layout, header, footer
  index.tsx               landing: hero + buscador + cómo funciona
  buscar.tsx              resultados de búsqueda
  viajes.$id.tsx          detalle del viaje + solicitar reserva
  publicar.tsx            formulario para conductor (protegida)
  mis-viajes.tsx          panel del conductor (protegida)
  mis-reservas.tsx        panel del pasajero (protegida)
  perfil.tsx              editar perfil (protegida)
  auth.tsx                login / registro
  como-funciona.tsx       explicación en 3 pasos
  seguridad.tsx           recomendaciones de uso seguro
  contacto.tsx            formulario de contacto y soporte
```

Cada ruta con su propio `head()` (title, description, og:title, og:description).

## Modelo de datos (Lovable Cloud)

- `profiles` — id (fk auth.users), nombre, teléfono, foto_url, bio, rol_preferido.
- `trips` — id, driver_id, origen, destino, fecha_salida, asientos_totales, asientos_disponibles, precio, auto_modelo, notas, estado (activo, completo, cancelado).
- `bookings` — id, trip_id, passenger_id, asientos, estado (pendiente/aceptada/rechazada/cancelada), created_at.
- `user_roles` — separado, con enum (`user`, `admin`) y función `has_role` (por seguridad).
- `ratings` (fase 2) — trip_id, rater_id, rated_id, estrellas, comentario.

RLS activo en todas las tablas; grants explícitos a `authenticated` y `service_role`.

## Diseño visual

Estilo limpio, confiable, moderno, orientado a movilidad:

- Paleta: verde profundo `#0F5132` (confianza/movilidad), acento arena `#E8DFD1`, fondo blanco cálido, texto grafito.
- Tipografía: sans-serif geométrica (Manrope/Inter) — títulos con peso 700, cuerpo 400–500.
- Tarjetas de viaje con jerarquía clara: ruta grande, hora y precio destacados, avatar del conductor.
- Mobile-first, mucho aire, CTA único por pantalla.
- Todos los colores como tokens semánticos en `src/styles.css` (formato oklch).

## Fuera de alcance (MVP)

- Pagos en línea, comisiones, facturación.
- Mapas interactivos y ruta en tiempo real.
- Verificación de identidad con documento oficial.
- Chat interno (se resuelve con WhatsApp).
- App móvil nativa.

## Plan de implementación por fases

1. Activar Lovable Cloud, crear tablas, RLS, roles.
2. Sistema de diseño en `styles.css` + layout raíz con header/footer y navegación.
3. Auth (registro, login, perfil).
4. Publicar viaje + listado "Mis viajes".
5. Buscar viajes + detalle + solicitar reserva.
6. Panel de reservas (conductor acepta/rechaza; pasajero ve estado).
7. Páginas informativas (cómo funciona, seguridad, contacto) + SEO por ruta.
8. Sitemap.xml y robots.txt.

## Preguntas antes de construir

1. ¿Es correcto el alcance MVP (sin pagos, contacto vía WhatsApp)?
2. ¿Prefieres la paleta verde propuesta u otra (azul, naranja, negro)?
3. ¿Necesitas login social (Google) además de email + contraseña?
4. ¿Nombre público exacto de la marca? (¿"Viajes Compartidos" o algo propio?)

Cuando apruebes (y respondas lo anterior si quieres ajustar), paso a construir.

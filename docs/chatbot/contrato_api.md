# Contrato API — Turnero del chatbot de licencia

## Endpoint upstream (backend de turnos)

```
GET http://72.60.156.83/api/appointments/chatbot/turns?procedure_id=2
Header: X-Api-Key: <API_KEY>
```

- `procedure_id=2` → Examen teórico-práctico. `procedure_id=3` → Examen psico-físico.
  El chatbot elige: `S.tipo==="renovacion_simple"` → 3, resto → 2.
- Sin/`X-Api-Key` inválida → `401 {"error":"API key inválida o ausente."}`.

### Respuesta (200)

Array plano de cupos:

```json
[
  {
    "id": 56,
    "datetime": "2026-07-03T08:00:00Z",
    "procedure_id": 2,
    "procedure_name": "Licencia de conducir",
    "place_id": 2,
    "place": { "id": 2, "name": "Municipalidad (Edificio 2)" },
    "appointment_id": null,
    "appointment": null,
    "is_available": true
  }
]
```

- `id` — identificador del cupo (para reservar).
- `datetime` — **sufijo `Z` pero es hora local** (horario de atención municipal). Se toma `HH:MM` literal del string; **no** convertir zona horaria (convertir mostraría 05:00 en vez de 08:00).
- `is_available` — filtrar `false`.

## Reservar turno (booking)

```
POST http://72.60.156.83/api/appointments/chatbot
Header: X-Api-Key: <API_KEY>
Body:  { "Dni": "38123456", "Firstname": "María", "Lastname": "Gómez", "phone_number": "2224123456", "turn_id": 91 }
```

- Campos requeridos: `Dni`, `Firstname`, `Lastname` (400 con `errors` si faltan).
- `phone_number` — string, opcional en el backend; el chatbot lo pide (10 dígitos) y lo envía siempre.
- `turn_id` — `id` del cupo (de `/turns`). Si no existe/ya tomado → `404 Entity "Turn" (N) was not found.`
- Respuesta 200: `{ "appointment_id": 3, "appointment_code": "TRN-XXXXXXX" }`.
  `appointment_code` es el código legible que se muestra al vecino (reemplaza al id mock).

## Cancelar turno (cancel) — ⚠ no disponible para la key del chatbot

```
DELETE http://72.60.156.83/api/appointments/chatbot
```

Existe (OPTIONS → `Allow: DELETE, POST`) pero con la API key del chatbot devuelve **401**.
La cancelación parece restringida a otra credencial (admin). El chatbot **no** cancela turnos.

## Proxy interno (este repo)

El chatbot es HTML estático servido por HTTPS; el upstream es HTTP + IP y usa API key secreta. Fetch directo desde el navegador falla por mixed-content, CORS y expondría la key. Por eso todo pasa por:

```
GET  /api/chatbot/turns?procedure_id=2  → src/pages/api/chatbot/turns.ts        (lista cupos)
POST /api/chatbot/appointments          → src/pages/api/chatbot/appointments.ts (reserva)
```

Reenvía al upstream con la `X-Api-Key`, cachea 60s. Env vars (solo servidor, sin prefijo `PUBLIC_`):

- `TURNS_API_URL` — base del upstream.
- `TURNS_API_KEY` — API key.

> Configurar ambas en el proyecto de Vercel (Production/Preview) además de `.env` local.

## Contrato interno usado por el chatbot (`turneroApi`)

- `getDias(fromIso, toIso)` → `string[]` de `YYYY-MM-DD` con cupo.
- `getHorarios(fechaIso)` → `string[]` de `HH:MM` disponibles.
- `slotId(fechaIso, hora)` → `id` del cupo (= `turn_id` para reservar).
- `confirmar(fechaIso, hora, {dni, firstname, lastname})` → `{ok, id?, appointmentId?, error?}`.
  POST real a `/api/chatbot/appointments`; `id` = `appointment_code`. Invalida la cache al reservar.

El chatbot pide **nombre → apellido → DNI → teléfono** al inicio (`S.nombre`, `S.apellido`, `S.dni`, `S.telefono`) y esos datos van en la reserva.

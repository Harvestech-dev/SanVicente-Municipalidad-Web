# API Integration — Chatbot de Turnos

Documentación para el equipo del chatbot sobre cómo interactuar con la API de VecinoDigital para crear citas de turnos.

---

## Índice

1. [Autenticación](#1-autenticación)
2. [Rate limiting](#2-rate-limiting)
3. [Flujo general](#3-flujo-general)
4. [Consultar trámites activos](#4-consultar-trámites-activos-get-apiappointmentschatbotprocedures)
5. [Consultar turnos disponibles](#5-consultar-turnos-disponibles-get-apiappointmentschatbotturns)
6. [Crear cita](#6-crear-cita-post-apiappointmentschatbot)
7. [Códigos de error](#7-códigos-de-error)
8. [Entornos](#8-entornos)

---

## 1. Autenticación

El endpoint del chatbot usa autenticación por **API Key** via header HTTP. No requiere JWT.

```
X-Api-Key: <api-key-provista-por-el-equipo-backend>
```

> La API Key debe mantenerse en el servidor del chatbot. **Nunca exponerla al cliente.**

---

## 2. Rate limiting

El endpoint de creación de cita tiene un límite de **60 requests por minuto** (ventana fija).

Si se supera el límite, la API responde con:

```
HTTP 429 Too Many Requests
```

---

## 3. Flujo general

Ambos endpoints usan **solo la API Key** — no se necesita JWT en ningún paso.

```
Chatbot                                    VecinoDigital API
   │                                              │
   │  GET /api/appointments/chatbot/procedures    │
   │  X-Api-Key: <key>                            │
   │ ───────────────────────────────────────────► │
   │  ◄─────────────────────────────────────────  │
   │  Lista de trámites activos (id + name)       │
   │                                              │
   │  (chatbot presenta opciones al ciudadano     │
   │   y el ciudadano elige el trámite)           │
   │                                              │
   │  GET /api/appointments/chatbot/turns         │
   │  X-Api-Key: <key>                            │
   │  ?procedure_id=X&place_id=X&year=X&month=X   │
   │ ───────────────────────────────────────────► │
   │  ◄─────────────────────────────────────────  │
   │  Lista de turnos disponibles                 │
   │                                              │
   │  (chatbot guía al usuario y                  │
   │   obtiene todos los datos del trámite)       │
   │                                              │
   │  POST /api/appointments/chatbot              │
   │  X-Api-Key: <key>                            │
   │  { turn_id, datos del ciudadano,             │
   │    details del trámite }                     │
   │ ───────────────────────────────────────────► │
   │  ◄─────────────────────────────────────────  │
   │  { appointment_id, appointment_code }        │
```

---

## 4. Consultar trámites activos — `GET /api/appointments/chatbot/procedures`

Devuelve la lista de trámites disponibles en el sistema. Usar para que el ciudadano elija qué trámite quiere gestionar antes de consultar turnos.

### Request

```
GET /api/appointments/chatbot/procedures
X-Api-Key: <api-key>
```

Sin query params.

### Response `200 OK`

```json
[
  {
    "id": 1,
    "name": "Licencia de Conducir",
    "procedurable_id": null,
    "procedurable_type": null,
    "start_stage_id": 2,
    "start_stage_name": "Iniciado",
    "finish_stage_id": 5,
    "finish_stage_name": "Otorgado",
    "stages_count": 4,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Habilitación Comercial",
    "procedurable_id": null,
    "procedurable_type": null,
    "start_stage_id": 1,
    "start_stage_name": "Presentación",
    "finish_stage_id": 4,
    "finish_stage_name": "Aprobado",
    "stages_count": 4,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
]
```

> Los campos más relevantes para el chatbot son `id` y `name`. El `id` es el `procedure_id` que se usa en la consulta de turnos.

---

## 5. Consultar turnos disponibles — `GET /api/appointments/chatbot/turns`

Este endpoint devuelve los turnos disponibles para un trámite.

**Autenticación:** solo la API Key — igual que el resto de los endpoints del chatbot.

### Request

```
GET /api/appointments/chatbot/turns?procedure_id={id}&place_id={id}&year={yyyy}&month={m}
X-Api-Key: <api-key>
```

#### Query params

| Parámetro      | Tipo   | Requerido | Descripción                                              |
|----------------|--------|-----------|----------------------------------------------------------|
| `procedure_id` | int    | Sí        | ID del trámite (ej. licencia de conducir)                |
| `place_id`     | int    | No        | Filtrar por sede. Si se omite, devuelve todas las sedes  |
| `year`         | int    | No        | Año (default: año actual)                                |
| `month`        | int    | No        | Mes 1–12 (default: mes actual)                           |

### Response `200 OK`

```json
[
  {
    "id": 142,
    "datetime": "2026-07-10T09:00:00Z",
    "procedure_id": 3,
    "procedure_name": "Licencia de Conducir",
    "place_id": 1,
    "place": {
      "id": 1,
      "name": "Municipalidad Central"
    },
    "appointment_id": null,
    "is_available": true
  },
  {
    "id": 143,
    "datetime": "2026-07-10T09:30:00Z",
    "procedure_id": 3,
    "procedure_name": "Licencia de Conducir",
    "place_id": 1,
    "place": {
      "id": 1,
      "name": "Municipalidad Central"
    },
    "appointment_id": null,
    "is_available": true
  }
]
```

> Solo se devuelven turnos disponibles (`is_available: true`) y futuros. Los turnos ya reservados se excluyen automáticamente.

El campo **`id`** de cada turno es el `turn_id` que debe enviarse al crear la cita.

---

## 6. Crear cita — `POST /api/appointments/chatbot`

### Request

```
POST /api/appointments/chatbot
Content-Type: application/json
X-Api-Key: <api-key>
```

#### Body

```json
{
  "turn_id": 142,
  "firstname": "Juan",
  "lastname": "Pérez",
  "dni": "12345678",
  "date_of_birth": "1990-05-15",
  "phone_number": "351-555-1234",
  "city": "Córdoba",
  "address": "Av. Colón 1234",
  "details": {
    "category": "Licencia B",
    "subclasses": "B1",
    "jurisdiction": "Nacional",
    "validity": "5 años",
    "estimated_cost": "$1.500",
    "exam_type": "Psicofísico",
    "required_documents": [
      "DNI original y fotocopia",
      "Foto carnet 4x4 fondo blanco",
      "Certificado médico psicofísico"
    ]
  }
}
```

#### Descripción de campos

| Campo            | Tipo          | Requerido | Descripción                                                                 |
|------------------|---------------|-----------|-----------------------------------------------------------------------------|
| `turn_id`        | int           | **Sí**    | ID del turno seleccionado (obtenido de `GET /api/turns`)                    |
| `firstname`      | string        | **Sí**    | Nombre del ciudadano                                                        |
| `lastname`       | string        | **Sí**    | Apellido del ciudadano                                                      |
| `dni`            | string        | **Sí**    | DNI como string (sin puntos ni guiones)                                     |
| `date_of_birth`  | string (date) | No        | Fecha de nacimiento en formato `YYYY-MM-DD`                                 |
| `phone_number`   | string        | No        | Teléfono de contacto                                                        |
| `city`           | string        | No        | Ciudad                                                                      |
| `address`        | string        | No        | Dirección                                                                   |
| `details`        | object        | No        | Datos específicos del trámite (ver abajo)                                   |

#### Campos de `details`

| Campo                | Tipo            | Descripción                                                       |
|----------------------|-----------------|-------------------------------------------------------------------|
| `category`           | string          | Categoría de la licencia (ej. "Licencia B")                       |
| `subclasses`         | string          | Subclases (ej. "B1", "B2")                                        |
| `jurisdiction`       | string          | Jurisdicción (ej. "Nacional", "Provincial")                       |
| `validity`           | string          | Vigencia calculada por el chatbot (ej. "5 años")                  |
| `estimated_cost`     | string          | Costo estimado (ej. "$1.500")                                     |
| `exam_type`          | string          | Tipo de examen (ej. "Psicofísico", "Teórico-Práctico")            |
| `required_documents` | array of string | Lista de documentos requeridos                                    |

Todos los campos de `details` son texto libre — no hay enumerados ni validaciones de formato.  
El objeto completo es opcional: si el chatbot no recolecta datos del trámite, omitir `details` o enviarlo como `null`.

---

### Response `200 OK`

```json
{
  "appointment_id": 456,
  "appointment_code": "TRN-A3KP7BX"
}
```

| Campo              | Descripción                                                              |
|--------------------|--------------------------------------------------------------------------|
| `appointment_id`   | ID interno de la cita creada                                             |
| `appointment_code` | Código único de la cita para mostrar al ciudadano (formato `TRN-XXXXXXX`) |

El `appointment_code` está compuesto por el prefijo `TRN-` seguido de 7 caracteres alfanuméricos en mayúsculas (sin las letras I y O para evitar confusión visual). Ejemplo: `TRN-A3KP7BX`.

Este código debe incluirse en el comprobante / PDF que genera el chatbot.

---

## 7. Códigos de error

| Código | Causa                                                                   | Respuesta body                                    |
|--------|-------------------------------------------------------------------------|---------------------------------------------------|
| `400`  | Body malformado o campos requeridos ausentes                            | Detalle de validación                             |
| `401`  | API Key ausente o inválida                                              | `{ "error": "API key inválida o ausente." }`      |
| `404`  | El `turn_id` no existe o fue eliminado                                  | `{ "title": "Turn ... not found" }`               |
| `422`  | El turno ya tiene una cita asignada                                     | `{ "title": "Este turno ya tiene una cita asignada." }` |
| `429`  | Se superó el límite de 60 requests/minuto                               | Sin body                                          |
| `500`  | Error interno del servidor                                              | Detalle de error                                  |

> **Manejo recomendado del `422`:** significa que el turno fue reservado por otro usuario entre el momento en que el ciudadano lo seleccionó y el momento en que el chatbot intentó crearlo. El chatbot debe pedirle al ciudadano que elija otro turno.

---

## 8. Entornos

| Entorno     | Base URL                                  |
|-------------|-------------------------------------------|
| Desarrollo  | `http://localhost:5238`                   |
| Producción  | `https://<DOMAIN>`                        |

La URL de producción se define en `.env.prod` como `DOMAIN`. Reemplazar `<DOMAIN>` con el dominio real del servidor.

### Capas de seguridad en producción

Las requests al chatbot pasan por dos niveles de control antes de ejecutarse:

```
Bot externo
    │
    ▼ HTTPS (TLS 1.2/1.3)
    │
    ▼ nginx — rate limit: 5 req/s por IP, burst de 20
    │         solo métodos GET y POST aceptados
    │         (allowlist de IP disponible si el bot tiene IP fija)
    │
    ▼ API .NET — valida X-Api-Key
                 rate limit adicional: 60 req/min (ventana fija)
```

Si la IP del servidor del bot es fija, pedirle al equipo backend que habilite el allowlist en `nginx/app.conf.template` para agregar una capa más de protección.

### Header de ejemplo completo

```http
POST /api/appointments/chatbot HTTP/1.1
Host: <DOMAIN>
Content-Type: application/json
X-Api-Key: <api-key-provista-por-el-equipo-backend>

{
  "turn_id": 142,
  "firstname": "Juan",
  "lastname": "Pérez",
  "dni": "12345678",
  "date_of_birth": "1990-05-15",
  "phone_number": "351-555-1234",
  "city": "Córdoba",
  "address": "Av. Colón 1234",
  "details": {
    "category": "Licencia B",
    "subclasses": "B1",
    "jurisdiction": "Nacional",
    "validity": "5 años",
    "estimated_cost": "$1.500",
    "exam_type": "Psicofísico",
    "required_documents": [
      "DNI original y fotocopia",
      "Foto carnet 4x4 fondo blanco",
      "Certificado médico psicofísico"
    ]
  }
}
```

---

## Notas adicionales

### Vinculación automática con ciudadano registrado

Si el DNI enviado corresponde a un ciudadano registrado en el sistema, la cita queda automáticamente vinculada a su cuenta (el campo interno `citizen_id` se completa solo). El chatbot no necesita hacer nada especial para esto.

Si el ciudadano registrado no tiene fecha de nacimiento en el sistema y se envía `date_of_birth`, el sistema actualiza su perfil automáticamente.

### Campos que persisten en el sistema

Todos los datos enviados (nombre, apellido, DNI, teléfono, dirección, ciudad, detalles del trámite) quedan registrados en la base de datos y son visibles para el equipo municipal en el portal de administración.

### Contacto backend

Para obtener la API Key de producción e IDs de procedimientos (`procedure_id`), contactar al equipo backend de VecinoDigital.
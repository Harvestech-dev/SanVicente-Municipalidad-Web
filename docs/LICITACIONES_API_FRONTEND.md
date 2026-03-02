# 📡 Referencia de API para Licitaciones (Frontend)

Esta guía resume los endpoints y formatos de datos para que el frontend pueda mostrar licitaciones públicas en el sitio.

> Nota: el modelo se basa en `docs/references/Licitaciones_model/*`, adaptado al ecosistema del CMS.

---

## 🔐 Contexto de multi‑cliente

El backend es multi‑cliente.  
Los endpoints **públicos** identifican al cliente por **dominio** (vía `identifyClientByDomain`) y solo devuelven licitaciones de ese cliente.

Los endpoints **privados** bajo `/api/admin/...` requieren autenticación (Clerk) y se usan solo desde el CMS.

Esta guía se centra en lo que necesita el **frontend del sitio público**.

---

## 1. Endpoints públicos propuestos

### 1.1 Listado de licitaciones

`GET /api/public/v1/biddings`

**Parámetros de query:**

- `page`, `limit` (opcional): paginación. Por defecto `page=1`, `limit=10`.
- `search` (opcional): búsqueda por título, número de licitación o expediente.
- **Nota:** no hay filtro por estado en el servidor. Cada ítem incluye `effective_status`; el frontend puede filtrar por estado en cliente si lo necesita (p. ej. solo “abiertas” o “próximas”).

**Respuesta (ejemplo simplificado):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "663f9a4c1a2b3c4d5e6f7a8b",
        "title": "Licitación Pública N° 05/2026",
        "subtitle": "Adquisición de maquinaria vial",
        "bidding_number": "05/2026",
        "expediente_number": "EXP-2026-000145",
        "procedure_type": "licitacion_publica",
        "object_of_contract": "Adquisición de una motoniveladora...",
        "area": "Subsecretaría de Obras y Servicios Públicos",
        "budget_official": 185000000,
        "currency": "ARS",
        "location": "San Vicente, Santa Fe",
        "dates": {
          "publication_date": "2026-03-01T10:00:00.000Z",
          "bidding_start_date": "2026-03-05T08:00:00.000Z",
          "bidding_end_date": "2026-03-20T10:00:00.000Z",
          "opening_date": "2026-03-20T10:30:00.000Z",
          "award_date": null
        },
        "opening_location": "Sala de Reuniones Municipalidad de San Vicente",
        "consultation_contact": "licitaciones@municipalidad.gob.ar, 0342-1234567",
        "winner": null,
        "attachments": [
          {
            "type": "pliego",
            "title": "Pliego de Bases y Condiciones",
            "file_url": "https://micms.website/media/pliego-05-2026.pdf",
            "external_url": null
          }
        ],
        "bidding_status": "auto",
        "effective_status": "open"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Notas importantes para el frontend:**

- **Estado a mostrar**: el backend expone dos campos relacionados con el estado:
  - **`bidding_status`**: valor guardado en CMS. Puede ser `"auto"` (cálculo por fechas) o un estado fijo (`cancelled`, `awarded`, `deserted`, `suspended`, `closed`).
  - **`effective_status`**: estado **ya calculado** para mostrar en la UI. Cuando `bidding_status` es `"auto"` (o un valor legacy automático), el backend lo calcula según las fechas de inicio y cierre; en caso contrario coincide con `bidding_status`.
- **En el frontend del sitio público** debes usar **`effective_status`** para etiquetas, badges, filtros y colores. No uses `bidding_status` para pintar el estado mostrado al usuario.
- Solo se devolverán licitaciones con `publication_status = 'published'` y `isDeleted != true`.
- Los IDs de Mongo se exponen como strings (`id` o `_id` según el contrato final).

### 1.2 Detalle de licitación

`GET /api/public/v1/biddings/:id`

Implementado. Devuelve una licitación por ID (solo si pertenece al cliente identificado por dominio y está publicada). Incluye `effective_status`. Respuesta: `{ success: true, data: { ... } }`.  
Se puede usar para:

- Página de detalle con URL propia (`/licitaciones/:id` o `/:slug` si se agrega slug).
- Modales de detalle desde un listado.

---

## 2. Estados y uso en UI

### 2.1 Estado mostrado: usar `effective_status`

El backend devuelve **`effective_status`** como el estado ya resuelto para mostrar. **Usa siempre este campo** en la UI del sitio público (badges, filtros, colores).

**Valores de `effective_status` y significado:**

| Valor           | Significado |
|-----------------|-------------|
| `upcoming`      | Próxima (aún no abrió). |
| `open`          | Abierta (recepción de ofertas en curso). |
| `in_evaluation` | Cerrada, en evaluación (aún sin adjudicado). |
| `closed`        | Cerrada (con adjudicado o cierre manual). |
| `awarded`       | Adjudicada. |
| `deserted`      | Desierta. |
| `cancelled`     | Cancelada. |
| `suspended`     | Suspendida. |

**Comportamiento automático vs manual:**

- Si en el CMS la licitación está en **“Auto (según fechas)”**, `bidding_status` será `"auto"` y el backend calculará `effective_status` según la fecha actual y las fechas de inicio/cierre (próxima → abierta → en evaluación → cerrada). No hace falta que el frontend calcule nada.
- Si en el CMS se eligió un estado fijo (cancelada, adjudicada, desierta, suspendida, cerrada), `bidding_status` y `effective_status` coincidirán con ese valor.

**Sugerencias de UI:**

- Mostrar un **badge/etiqueta** con color según **`effective_status`** (verde = abierta, azul = próxima, naranja = en evaluación, gris = cerrada, rojo = cancelada/suspendida).
- Filtrar por **`effective_status`** en el cliente (el listado devuelve todos los publicados con `effective_status`; el frontend filtra por estado si lo necesita).

**Campos adicionales útiles para la UI:**

- **`consultation_contact`**: texto libre (email, teléfono o ambos) para consultas; mostrarlo en la ficha o detalle de la licitación.
- **`winner`**: si existe, objeto con `company_name`, `cuit`, `award_amount` para licitaciones adjudicadas; mostrar en el detalle cuando `effective_status === 'awarded'`.

### 2.2 `publication_status`

Este campo es principalmente de CMS (editorial).  
En el lado público solo interesa que venga ya filtrado a `published`.

---

## 3. Adjuntos

Cada adjunto puede tener una de estas formas (el backend puede normalizar a un formato común para el público):

- **`label`**: texto libre para mostrar (ej. “Planos”, “Pliego de Bases”, “Referencias”).
- **`attachment_type`**: `"url"` | `"image"` | `"file"`.
- **`external_url`**: cuando `attachment_type === "url"`, enlace externo al documento.
- **`media_id`**: cuando `attachment_type` es `"image"` o `"file"`, ID del recurso en Media; el frontend debe resolverlo a URL (p. ej. con el endpoint de media o URLs públicas del CMS).
- **`is_pliego`**: si es el Pliego de Bases y Condiciones (para destacar o validar).

*(Compatibilidad: si el backend expone formato legacy con `type`, `title`, `file_url`, `external_url`, el frontend puede seguir la estrategia anterior.)*

**Estrategia en el frontend:**

- Si hay `external_url` → usarla como `href` principal.
- Si hay `media_id` → obtener la URL del recurso desde el API de media o la URL pública que proporcione el backend.
- Usar `label` (o `title` en formato legacy) como texto del enlace o del botón de descarga.
- Si `attachment_type` es `"image"` (o `type` es imagen), se puede mostrar como thumbnail o en galería.

---

## 4. Ejemplos de uso en el frontend

### 4.1 Listado simple de licitaciones

- Página `/licitaciones`:
  - Llama a `GET /api/public/v1/biddings?limit=20` y opcionalmente filtra en cliente por `effective_status === 'open'` (o el estado que quieras).
  - Muestra tarjetas o filas con:
    - Título, objeto, área, fechas principales (apertura/cierre), badge de estado.
    - Botón “Ver más” que navega a `/licitaciones/:id`.

### 4.2 Bloque “Próximas licitaciones” en el home

- Componente que llama a `GET /api/public/v1/biddings?limit=10` y filtra en cliente por `effective_status === 'upcoming'`, mostrando hasta 3.
- Muestra solo título + fecha de apertura.

---

## 5. Consideraciones futuras

- Se puede agregar un `slug` para URLs más amigables.
- Se puede exponer un filtro adicional por `procedure_type` o `area`.
- Para SEO, el detalle de licitación puede generar metadatos (title/description) a partir de `title` y `object_of_contract`.

Cuando el backend implemente oficialmente estos endpoints, la estructura debería alinearse con esta referencia, o bien se actualizará este documento para reflejar el contrato final.


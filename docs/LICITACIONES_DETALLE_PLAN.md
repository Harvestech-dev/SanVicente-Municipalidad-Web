# Plan: Vista de detalle de licitación

Objetivo: mostrar una página de detalle por licitación usando `GET /api/public/v1/biddings/:id`.

---

## 1. Endpoint

- **URL:** `GET /api/public/v1/biddings/:id`
- **Frontend:** ya existe `fetchBiddingById(id)` en `src/lib/api-licitaciones` (retorna `BiddingItem | null`).

---

## 2. Rutas propuestas

| Opción | Ruta ejemplo | Cuándo usar |
|--------|--------------|-------------|
| A | `/Transparencia/licitaciones/[id]` | Detalle bajo la misma sección Transparencia. |
| B | `/licitaciones/[id]` | URL más corta si licitaciones es sección principal. |

**Recomendación:** Opción A para mantener coherencia con el listado (`/Transparencia/licitaciones` → `/Transparencia/licitaciones/:id`).

---

## 3. Generación de la página (Astro)

Dos enfoques posibles:

### 3.1 Estático (getStaticPaths)

- En build se llama a `fetchBiddings({ limit: 100 })` y se generan paths con cada `item.id`.
- **Pros:** Página rápida, sin llamada en cada visita.
- **Contras:** Licitaciones nuevas o IDs nuevos requieren rebuild (o redeploy que vuelva a hacer build).

### 3.2 Dinámico en el servidor (output: 'server')

- La página tiene `export const prerender = false` (o equivalente en Astro 4).
- En cada request se llama a `fetchBiddingById(Astro.params.id)`.
- **Pros:** Siempre datos al día, sin rebuild por licitaciones nuevas.
- **Contras:** Necesita entorno con SSR (Node, Vercel/Netlify con SSR, etc.).

**Recomendación:** Si el deploy soporta SSR, usar **3.2**. Si es solo estático (ej. GitHub Pages), usar **3.1** y acordar rebuilds o un cron que redepliegue.

---

## 4. Contenido de la vista de detalle

Campos del `BiddingItem` útiles para la UI:

| Campo | Uso en detalle |
|-------|-----------------|
| `title`, `subtitle` | Título y bajada. |
| `bidding_number`, `expediente_number` | Número de licitación y expediente. |
| `procedure_type` | Tipo de procedimiento. |
| `object_of_contract` | Objeto del contrato (descripción). |
| `area` | Área responsable. |
| `budget_official`, `currency` | Presupuesto oficial. |
| `dates` | Publicación, inicio/cierre, apertura, adjudicación. |
| `opening_location` | Lugar de apertura. |
| `consultation_contact` | Contacto para consultas. |
| `effective_status` | Badge de estado (misma lógica que el listado). |
| `attachments` | Lista de adjuntos (pliego + otros); enlaces para descargar/abrir. |
| `winner` | Si `effective_status === 'awarded'`: empresa, CUIT, monto adjudicado. |

Estructura sugerida de la página:

1. **Hero:** título, número, badge de estado.
2. **Bloque datos:** fechas, área, presupuesto, lugar de apertura, contacto.
3. **Objeto del contrato:** texto completo.
4. **Adjudicación:** solo si hay `winner`; mostrar company_name, cuit, award_amount.
5. **Adjuntos:** botones/links para pliego y resto de adjuntos.
6. **Navegación:** link “Volver a Licitaciones y Concursos” → `/Transparencia/licitaciones`.

---

## 5. Enlaces desde el listado

En cada card del listado, agregar un enlace al detalle, por ejemplo:

- En el título: `<a href={`/Transparencia/licitaciones/${lic.id}`}>{lic.title}</a>`
- O un botón “Ver detalle” que apunte a la misma URL.

Así el usuario puede ir del listado a la página de detalle y volver.

---

## 6. Manejo de 404

Si `fetchBiddingById(id)` retorna `null` (API no configurada, 404 o error):

- Redirigir a `/Transparencia/licitaciones` con mensaje “Licitación no encontrada”, o
- Mostrar en la misma URL un estado “No encontrada” con link para volver al listado.

---

## 7. Próximos pasos

1. Definir si la ruta es `/Transparencia/licitaciones/[id]` o `/licitaciones/[id]`.
2. Decidir estrategia: estático (getStaticPaths) vs SSR (prerender = false).
3. Crear la página `src/pages/Transparencia/licitaciones/[id].astro` (o la ruta elegida).
4. Implementar la vista con los bloques de la sección 4.
5. Añadir en el listado el enlace al detalle por cada licitación.
6. Definir y aplicar el manejo de 404/no encontrada.

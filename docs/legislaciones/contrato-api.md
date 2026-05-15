● Contrato API pública — Legislaciones

  Tenant resuelto por Host header (match client.domains[]). CORS dinámico habilitado. Sin auth. Solo retorna status ∈ {vigente, 
  modificada, derogada, vetada} (drafts ocultos).

  1. Listado

  GET /api/public/v1/legislations

  Query params

  ┌───────────┬───────────────────────────────────────────┬───────────────┬───────────────────────────────────────────────────┐   
  │   param   │                   tipo                    │    default    │                       notas                       │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ type      │ ordinance | decree | boletin              │ —             │ filtra tipo                                       │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ status    │ vigente | modificada | derogada | vetada  │ todos         │                                                   │   
  │           │                                           │ públicos      │                                                   │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ year      │ int                                       │ —             │ año exacto                                        │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ yearFrom  │ int                                       │ —             │ rango inicio                                      │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ yearTo    │ int                                       │ —             │ rango fin                                         │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ area      │ string                                    │ —             │ match exacto                                      │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ tags      │ CSV string                                │ —             │ ej: presupuesto,urbanismo (OR)                    │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ search    │ string                                    │ —             │ regex case-insensitive sobre title, summary,      │   
  │           │                                           │               │ body, slug                                        │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ page      │ int ≥1                                    │ 1             │                                                   │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ limit     │ int 1–100                                 │ 20            │ clamp server-side                                 │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ sortBy    │ year | number | publishedAt | createdAt | │ year          │ otros → fallback year                             │   
  │           │  title                                    │               │                                                   │   
  ├───────────┼───────────────────────────────────────────┼───────────────┼───────────────────────────────────────────────────┤   
  │ sortOrder │ asc | desc                                │ desc          │                                                   │   
  └───────────┴───────────────────────────────────────────┴───────────────┴───────────────────────────────────────────────────┘   

  Tie-breaker secundario siempre number mismo sortOrder.

  Response 200

  {
    "success": true,
    "data": [
      {
        "_id": "65a...",
        "type": "ordinance",
        "number": 5234,
        "numberPadded": "05234",
        "year": 2025,
        "slug": "ordenanza-05234-2025",
        "title": "Ordenanza tributaria 2025",
        "summary": "Resumen breve...",
        "tags": ["presupuesto", "tributos"],
        "area": "Hacienda",
        "status": "vigente",
        "signedAt": "2025-03-12T00:00:00.000Z",
        "publishedAt": "2025-03-15T00:00:00.000Z",
        "file": {
          "url": "https://blob.vercel-storage.com/.../doc.pdf",
          "size": 184320,
          "mimeType": "application/pdf",
          "originalFilename": "ORD_5234_2025.pdf",
          "pages": 12
        },
        "createdAt": "2025-03-15T10:00:00.000Z",
        "updatedAt": "2025-03-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pages": 12,
      "limit": 20,
      "total": 234,
      "hasNext": true,
      "hasPrev": false
    }
  }

  Cache-Control: public, max-age=300, stale-while-revalidate=86400

  Nota: listado NO trae body (texto completo PDF). Pedir detalle si lo necesitás.

  2. Detalle por slug

  GET /api/public/v1/legislations/{slug}

  Response 200

  {
    "success": true,
    "data": {
      "_id": "65a...",
      "type": "decree",
      "number": 64,
      "numberPadded": "00064",
      "year": 2025,
      "slug": "decreto-00064-2025",
      "title": "...",
      "summary": "...",
      "body": "Texto completo extraído del PDF...",
      "tags": [],
      "area": null,
      "status": "vigente",
      "signedAt": "2025-...",
      "publishedAt": "2025-...",
      "relatedLegislations": [
        { "id": "65b...", "relation": "modifica" }
      ],
      "file": { "url": "...", "size": 12345, "mimeType": "application/pdf", "originalFilename": "...", "pages": 4 },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }

  relation ∈ {modifica, deroga, complementa, referencia}.

  Cache-Control: public, max-age=600, stale-while-revalidate=86400

  404

  { "success": false, "message": "Legislación no encontrada" }

  3. Errores estándar

  ┌────────┬───────────────────────────────────────────────────────────────────┐
  │ status │                               shape                               │
  ├────────┼───────────────────────────────────────────────────────────────────┤
  │ 400    │ { "success": false, "message": "Slug requerido" }                 │
  ├────────┼───────────────────────────────────────────────────────────────────┤
  │ 404    │ { "success": false, "message": "..." }                            │
  ├────────┼───────────────────────────────────────────────────────────────────┤
  │ 500    │ { "success": false, "message": "Error al obtener legislaciones" } │
  └────────┴───────────────────────────────────────────────────────────────────┘

  Tenant no identificable (host no matchea ningún cliente) → 404/403 desde identifyClientByDomain.

  4. Tipos TS (drop-in para front)

  export type LegislationType = 'ordinance' | 'decree' | 'boletin';
  export type LegislationStatus = 'vigente' | 'modificada' | 'derogada' | 'vetada';

  export interface LegislationFile {
    url: string;
    size: number;
    mimeType: string;
    originalFilename: string;
    pages?: number;
  }

  export interface LegislationRelation {
    id: string;
    relation: 'modifica' | 'deroga' | 'complementa' | 'referencia';
  }

  export interface LegislationListItem {
    _id: string;
    type: LegislationType;
    number: number;
    numberPadded: string;
    year: number;
    slug: string;
    title: string;
    summary?: string;
    tags: string[];
    area?: string;
    status: LegislationStatus;
    signedAt?: string;
    publishedAt?: string;
    file: LegislationFile;
    createdAt: string;
    updatedAt: string;
  }

  export interface LegislationDetail extends LegislationListItem {
    body?: string;
    relatedLegislations?: LegislationRelation[];
  }

  export interface Pagination {
    page: number;
    pages: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  }

  export interface ListResponse {
    success: true;
    data: LegislationListItem[];
    pagination: Pagination;
  }

  export interface DetailResponse {
    success: true;
    data: LegislationDetail;
  }

  export interface ErrorResponse {
    success: false;
    message: string;
  }

  5. Ejemplos

  # Decretos vigentes 2025, página 2
  curl "https://sitio.com/api/public/v1/legislations?type=decree&year=2025&page=2&limit=20"

  # Búsqueda full-text
  curl "https://sitio.com/api/public/v1/legislations?search=presupuesto&sortBy=publishedAt"

  # Detalle
  curl "https://sitio.com/api/public/v1/legislations/decreto-00064-2025"

    data: LegislationDetail;
  }

  export interface ErrorResponse {
    success: false;
    message: string;
  }

  5. Ejemplos

  # Decretos vigentes 2025, página 2
  curl "https://sitio.com/api/public/v1/legislations?type=decree&year=2025&page=2&limit=20"

  # Búsqueda full-text
  curl "https://sitio.com/api/public/v1/legislations?search=presupuesto&sortBy=publishedAt"

  # Detalle
  curl "https://sitio.com/api/public/v1/legislations/decreto-00064-2025"
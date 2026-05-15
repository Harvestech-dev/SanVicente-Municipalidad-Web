/**
 * Mock local de legislaciones para desarrollo.
 * Se activa cuando PUBLIC_USE_MOCK_LEGISLATIONS === "true".
 * No afecta staging/producción si la env var queda en false/undefined.
 */

import type {
  LegislationDetail,
  LegislationListItem,
  LegislationStatus,
  LegislationType,
  Pagination,
} from "./types";
import type { FetchLegislationsParams } from "./fetch-browser";

const MOCK_ITEMS: LegislationDetail[] = [
  {
    _id: "6a0660fc874c3d5a0d31287b",
    type: "boletin",
    number: 6,
    numberPadded: "0006",
    year: 2026,
    slug: "boletin-0006-2026",
    title: "Boletín Oficial N° 6/2026",
    tags: [],
    status: "vigente",
    signedAt: "2026-03-31T00:00:00.000Z",
    file: {
      url: "https://yi4v6kde7clqp3do.public.blob.vercel-storage.com/legislations/697d0b45ba73ac8c154c8203/boletin/2026/1778802937741-bol_7_1776853461_BOLETIN_OFICIAL_NUMERO_00006.pdf",
      size: 1574029,
      mimeType: "application/pdf",
      originalFilename: "bol_7_1776853461_BOLETIN_OFICIAL_NUMERO_00006.pdf",
      pages: 0,
    },
    createdAt: "2026-05-14T23:55:40.928Z",
    updatedAt: "2026-05-14T23:55:43.602Z",
  },
  {
    _id: "6a0660f9874c3d5a0d31287a",
    type: "boletin",
    number: 5,
    numberPadded: "0005",
    year: 2025,
    slug: "boletin-0005-2025",
    title: "Boletín Oficial N° 5/2026",
    tags: [],
    status: "vigente",
    signedAt: "2025-12-31T00:00:00.000Z",
    file: {
      url: "https://yi4v6kde7clqp3do.public.blob.vercel-storage.com/legislations/697d0b45ba73ac8c154c8203/boletin/2026/1778802932826-bol_6_1776375596_BOLETIN_OFICIAL_NUMERO_00005_V1.pdf",
      size: 3274891,
      mimeType: "application/pdf",
      originalFilename: "bol_6_1776375596_BOLETIN_OFICIAL_NUMERO_00005_V1.pdf",
      pages: 0,
    },
    createdAt: "2026-05-14T23:55:37.635Z",
    updatedAt: "2026-05-14T23:57:27.921Z",
  },
  {
    _id: "6a0660f4874c3d5a0d312879",
    type: "boletin",
    number: 4,
    numberPadded: "0004",
    year: 2025,
    slug: "boletin-0004-2025",
    title: "Boletín Oficial N° 4/2026",
    tags: [],
    status: "vigente",
    signedAt: "2025-08-11T00:00:00.000Z",
    file: {
      url: "https://yi4v6kde7clqp3do.public.blob.vercel-storage.com/legislations/697d0b45ba73ac8c154c8203/boletin/2026/1778802926693-boletin-0004.pdf",
      size: 3338629,
      mimeType: "application/pdf",
      originalFilename: "boletin-0004.pdf",
      pages: 0,
    },
    createdAt: "2026-05-14T23:55:32.620Z",
    updatedAt: "2026-05-14T23:57:27.149Z",
  },
  {
    _id: "6a0660ee874c3d5a0d312878",
    type: "boletin",
    number: 3,
    numberPadded: "0003",
    year: 2024,
    slug: "boletin-0003-2024",
    title: "Boletín Oficial N° 3/2026",
    tags: [],
    status: "vigente",
    signedAt: "2024-11-25T00:00:00.000Z",
    file: {
      url: "https://yi4v6kde7clqp3do.public.blob.vercel-storage.com/legislations/697d0b45ba73ac8c154c8203/boletin/2026/1778802922068-boletin-0003.pdf",
      size: 2151094,
      mimeType: "application/pdf",
      originalFilename: "boletin-0003.pdf",
      pages: 0,
    },
    createdAt: "2026-05-14T23:55:26.436Z",
    updatedAt: "2026-05-14T23:57:27.357Z",
  },
  {
    _id: "6a0660e9874c3d5a0d312877",
    type: "boletin",
    number: 2,
    numberPadded: "0002",
    year: 2024,
    slug: "boletin-0002-2024",
    title: "Boletín Oficial N° 2/2026",
    tags: [],
    status: "vigente",
    signedAt: "2024-07-08T00:00:00.000Z",
    file: {
      url: "https://yi4v6kde7clqp3do.public.blob.vercel-storage.com/legislations/697d0b45ba73ac8c154c8203/boletin/2026/1778802918228-boletin-0002.pdf",
      size: 2131195,
      mimeType: "application/pdf",
      originalFilename: "boletin-0002.pdf",
      pages: 0,
    },
    createdAt: "2026-05-14T23:55:21.825Z",
    updatedAt: "2026-05-14T23:57:27.558Z",
  },
  {
    _id: "6a0660e6874c3d5a0d312876",
    type: "boletin",
    number: 1,
    numberPadded: "0001",
    year: 2024,
    slug: "boletin-0001-2024",
    title: "Boletín Oficial N° 1/2026",
    tags: [],
    status: "vigente",
    signedAt: "2024-03-11T00:00:00.000Z",
    file: {
      url: "https://yi4v6kde7clqp3do.public.blob.vercel-storage.com/legislations/697d0b45ba73ac8c154c8203/boletin/2026/1778802916057-boletin-0001.pdf",
      size: 270873,
      mimeType: "application/pdf",
      originalFilename: "boletin-0001.pdf",
      pages: 0,
    },
    createdAt: "2026-05-14T23:55:18.113Z",
    updatedAt: "2026-05-14T23:57:27.756Z",
  },
];

export function isMockEnabled(): boolean {
  const flag = import.meta.env.PUBLIC_USE_MOCK_LEGISLATIONS;
  return String(flag ?? "").toLowerCase() === "true";
}

function applyFilters(
  items: LegislationDetail[],
  params?: FetchLegislationsParams
): LegislationDetail[] {
  if (!params) return items;
  return items.filter((it) => {
    if (params.type && it.type !== params.type) return false;
    if (params.status && it.status !== (params.status as LegislationStatus))
      return false;
    if (params.year != null && it.year !== params.year) return false;
    if (params.yearFrom != null && it.year < params.yearFrom) return false;
    if (params.yearTo != null && it.year > params.yearTo) return false;
    if (params.area && it.area !== params.area) return false;
    if (params.search) {
      const q = params.search.toLowerCase();
      const hay = `${it.title} ${it.summary ?? ""} ${it.slug}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function toListItem(it: LegislationDetail): LegislationListItem {
  const { body: _body, relatedLegislations: _rel, ...rest } = it;
  return rest;
}

export function getMockList(params?: FetchLegislationsParams): {
  items: LegislationListItem[];
  pagination: Pagination;
} {
  const filtered = applyFilters(MOCK_ITEMS, params);
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const slice = filtered.slice(start, start + limit).map(toListItem);
  return {
    items: slice,
    pagination: {
      page,
      pages,
      limit,
      total,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

export function getMockBySlug(slug: string): LegislationDetail | null {
  return MOCK_ITEMS.find((it) => it.slug === slug) ?? null;
}

export const MOCK_TYPES_AVAILABLE: LegislationType[] = Array.from(
  new Set(MOCK_ITEMS.map((it) => it.type))
);

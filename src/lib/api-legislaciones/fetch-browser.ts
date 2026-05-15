/**
 * Fetch de legislaciones desde el navegador (usa PUBLIC_API_URL en cliente).
 * Ref: docs/legislaciones/contrato-api.md
 */

import type {
  LegislationListItem,
  LegislationDetail,
  LegislationType,
  LegislationStatus,
  Pagination,
  ListResponse,
  DetailResponse,
  SortBy,
  SortOrder,
} from "./types";
import { getMockBySlug, getMockList, isMockEnabled } from "./mock";

const FETCH_TIMEOUT = 10000;
const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  pages: 0,
  limit: 20,
  total: 0,
  hasNext: false,
  hasPrev: false,
};

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export interface FetchLegislationsParams {
  type?: LegislationType;
  status?: LegislationStatus;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  area?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

function buildUrl(apiBase: string, params?: FetchLegislationsParams): string {
  const base = apiBase.replace(/\/$/, "");
  const url = new URL(`${base}/legislations`);
  if (!params) return url.toString();
  if (params.type) url.searchParams.set("type", params.type);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.year != null) url.searchParams.set("year", String(params.year));
  if (params.yearFrom != null)
    url.searchParams.set("yearFrom", String(params.yearFrom));
  if (params.yearTo != null)
    url.searchParams.set("yearTo", String(params.yearTo));
  if (params.area) url.searchParams.set("area", params.area);
  if (params.tags && params.tags.length > 0)
    url.searchParams.set("tags", params.tags.join(","));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.page != null) url.searchParams.set("page", String(params.page));
  if (params.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) url.searchParams.set("sortOrder", params.sortOrder);
  return url.toString();
}

export async function fetchLegislationsInBrowser(
  apiBase: string,
  params?: FetchLegislationsParams
): Promise<{ items: LegislationListItem[]; pagination: Pagination }> {
  if (isMockEnabled()) {
    console.log("[legislaciones:MOCK] params", params);
    const result = getMockList(params);
    console.log("[legislaciones:MOCK] result", result);
    return result;
  }
  const base = (apiBase ?? "").trim();
  if (!base) {
    console.warn("[legislaciones] apiBase vacío");
    return { items: [], pagination: { ...DEFAULT_PAGINATION } };
  }

  const url = buildUrl(base, params);
  console.log("[legislaciones] GET", url, params);
  try {
    const res = await fetchWithTimeout(url);
    console.log("[legislaciones] status", res.status, res.statusText);
    if (!res.ok) {
      console.warn("[legislaciones] respuesta no-ok", res.status);
      return { items: [], pagination: { ...DEFAULT_PAGINATION } };
    }
    const json = (await res.json()) as ListResponse;
    console.log("[legislaciones] response", json);
    if (!json.success || !Array.isArray(json.data)) {
      console.warn("[legislaciones] payload inválido", json);
      return { items: [], pagination: { ...DEFAULT_PAGINATION } };
    }
    return {
      items: json.data,
      pagination: json.pagination ?? { ...DEFAULT_PAGINATION },
    };
  } catch (err) {
    console.error("[legislaciones] fetch error", err);
    return { items: [], pagination: { ...DEFAULT_PAGINATION } };
  }
}

export async function fetchLegislationBySlugInBrowser(
  apiBase: string,
  slug: string
): Promise<LegislationDetail | null> {
  if (isMockEnabled()) {
    console.log("[legislaciones:detalle:MOCK] slug", slug);
    const item = getMockBySlug(slug);
    console.log("[legislaciones:detalle:MOCK] result", item);
    return item;
  }
  const base = (apiBase ?? "").trim().replace(/\/$/, "");
  if (!base || !slug) {
    console.warn("[legislaciones:detalle] apiBase o slug vacío", { base, slug });
    return null;
  }
  const url = `${base}/legislations/${encodeURIComponent(slug)}`;
  console.log("[legislaciones:detalle] GET", url);
  try {
    const res = await fetchWithTimeout(url);
    console.log("[legislaciones:detalle] status", res.status, res.statusText);
    if (!res.ok) {
      console.warn("[legislaciones:detalle] respuesta no-ok", res.status);
      return null;
    }
    const json = (await res.json()) as DetailResponse;
    console.log("[legislaciones:detalle] response", json);
    return json.success && json.data ? json.data : null;
  } catch (err) {
    console.error("[legislaciones:detalle] fetch error", err);
    return null;
  }
}

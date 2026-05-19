/**
 * Fetch de legislaciones desde server (build/SSR).
 * Ref: docs/legislaciones/contrato-api.md
 */

import { API_LEGISLACIONES_CONFIG } from "./config";
import type {
  LegislationListItem,
  LegislationDetail,
  Pagination,
  ListResponse,
  DetailResponse,
} from "./types";
import type { FetchLegislationsParams } from "./fetch-browser";

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

function buildUrl(base: string, params?: FetchLegislationsParams): string {
  const url = new URL(`${base.replace(/\/$/, "")}${API_LEGISLACIONES_CONFIG.ENDPOINTS.LEGISLATIONS}`);
  if (!params) return url.toString();
  if (params.type) url.searchParams.set("type", params.type);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.year != null) url.searchParams.set("year", String(params.year));
  if (params.yearFrom != null) url.searchParams.set("yearFrom", String(params.yearFrom));
  if (params.yearTo != null) url.searchParams.set("yearTo", String(params.yearTo));
  if (params.area) url.searchParams.set("area", params.area);
  if (params.tags && params.tags.length > 0) url.searchParams.set("tags", params.tags.join(","));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.page != null) url.searchParams.set("page", String(params.page));
  if (params.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) url.searchParams.set("sortOrder", params.sortOrder);
  return url.toString();
}

export async function fetchLegislations(
  params?: FetchLegislationsParams
): Promise<{ items: LegislationListItem[]; pagination: Pagination }> {
  const base = API_LEGISLACIONES_CONFIG.BASE_URL;
  if (!base) return { items: [], pagination: { ...DEFAULT_PAGINATION } };

  try {
    const res = await fetchWithTimeout(buildUrl(base, params));
    if (!res.ok) return { items: [], pagination: { ...DEFAULT_PAGINATION } };
    const json = (await res.json()) as ListResponse;
    if (!json.success || !Array.isArray(json.data)) {
      return { items: [], pagination: { ...DEFAULT_PAGINATION } };
    }
    return {
      items: json.data,
      pagination: json.pagination ?? { ...DEFAULT_PAGINATION },
    };
  } catch {
    return { items: [], pagination: { ...DEFAULT_PAGINATION } };
  }
}

export async function fetchLegislationBySlug(
  slug: string
): Promise<LegislationDetail | null> {
  const base = API_LEGISLACIONES_CONFIG.BASE_URL;
  if (!base || !slug) return null;

  const url = `${base.replace(/\/$/, "")}${API_LEGISLACIONES_CONFIG.ENDPOINTS.LEGISLATION_DETAIL(encodeURIComponent(slug))}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = (await res.json()) as DetailResponse;
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

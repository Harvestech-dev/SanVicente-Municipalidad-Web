/**
 * Fetch de licitaciones desde el navegador (usa PUBLIC_API_URL en cliente).
 * Ref: docs/LICITACIONES_API_FRONTEND.md
 */

import type {
  BiddingItem,
  BiddingsPagination,
  BiddingsResponse,
  BiddingDetailResponse,
  EffectiveStatus,
} from "./types";

const FETCH_TIMEOUT = 10000;

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

export interface FetchBiddingsParams {
  status?: EffectiveStatus;
  page?: number;
  limit?: number;
}

/**
 * Obtiene licitaciones desde la API en el navegador.
 * apiBase: URL base (ej. import.meta.env.PUBLIC_API_URL).
 */
export async function fetchBiddingsInBrowser(
  apiBase: string,
  params?: FetchBiddingsParams
): Promise<{ items: BiddingItem[]; pagination: BiddingsPagination }> {
  const base = (apiBase ?? "").trim().replace(/\/$/, "");
  if (!base) {
    return {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  const endpoint = "/biddings";
  const url = new URL(`${base}${endpoint}`);

  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.page != null) url.searchParams.set("page", String(params.page));
  if (params?.limit != null) url.searchParams.set("limit", String(params.limit));

  try {
    const res = await fetchWithTimeout(url.toString());
    if (!res.ok) {
      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }

    const json = (await res.json()) as BiddingsResponse;
    if (!json.success || !json.data) {
      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }

    return {
      items: json.data.items,
      pagination:
        json.data.pagination ?? {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
    };
  } catch {
    return {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
}

/**
 * Obtiene el detalle de una licitación por ID en el navegador.
 * GET {apiBase}/biddings/:id
 */
export async function fetchBiddingByIdInBrowser(
  apiBase: string,
  id: string
): Promise<BiddingItem | null> {
  const base = (apiBase ?? "").trim().replace(/\/$/, "");
  if (!base || !id) return null;

  const url = `${base}/biddings/${encodeURIComponent(id)}`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = (await res.json()) as BiddingDetailResponse;
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Fetch de licitaciones desde API pública.
 * Ref: docs/LICITACIONES_API_FRONTEND.md
 */

import { API_LICITACIONES_CONFIG } from "./config";
import type { BiddingsResponse, BiddingDetailResponse, BiddingItem, BiddingsPagination, EffectiveStatus } from "./types";

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
 * Obtiene licitaciones desde la API pública.
 * Retorna { items: [], pagination } si no hay API o falla.
 */
export async function fetchBiddings(
  params?: FetchBiddingsParams
): Promise<{ items: BiddingItem[]; pagination: BiddingsPagination }> {
  const base = API_LICITACIONES_CONFIG.BASE_URL;
  if (!base) {
    if (import.meta.env.DEV) {
      console.log("[api-licitaciones] PUBLIC_API_URL no configurada, no se realiza la petición.");
    }
    return { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  const endpoint = API_LICITACIONES_CONFIG.ENDPOINTS.BIDDINGS;
  const url = new URL(`${base.replace(/\/$/, "")}${endpoint}`);

  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.page != null) url.searchParams.set("page", String(params.page));
  if (params?.limit != null) url.searchParams.set("limit", String(params.limit));

  const urlString = url.toString();
  if (import.meta.env.DEV) {
    console.log("[api-licitaciones] URL:", urlString);
  }

  try {
    const res = await fetchWithTimeout(urlString);
    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.log("[api-licitaciones] Respuesta:", res.status, res.statusText);
      }
      return { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const json = (await res.json()) as BiddingsResponse;
    if (import.meta.env.DEV) {
      console.log("[api-licitaciones] Respuesta:", {
        success: json.success,
        hasData: !!json.data,
        itemsCount: json.data?.items?.length ?? 0,
        pagination: json.data?.pagination,
      });
    }
    if (!json.success || !json.data) {
      return { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    return {
      items: json.data.items,
      pagination: json.data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.log("[api-licitaciones] Error:", err);
    }
    return { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }
}

/**
 * Obtiene el detalle de una licitación por ID.
 * GET /api/public/v1/biddings/:id
 * Retorna null si no hay API, 404 o error.
 */
export async function fetchBiddingById(id: string): Promise<BiddingItem | null> {
  const base = API_LICITACIONES_CONFIG.BASE_URL;
  if (!base || !id) return null;

  const urlString = `${base.replace(/\/$/, "")}${API_LICITACIONES_CONFIG.ENDPOINTS.BIDDING_DETAIL(id)}`;
  if (import.meta.env.DEV) {
    console.log("[api-licitaciones] Detalle URL:", urlString);
  }

  try {
    const res = await fetchWithTimeout(urlString);
    if (!res.ok) return null;
    const json = (await res.json()) as BiddingDetailResponse;
    if (import.meta.env.DEV) {
      console.log("[api-licitaciones] Detalle respuesta:", { success: json.success, hasData: !!json.data });
    }
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

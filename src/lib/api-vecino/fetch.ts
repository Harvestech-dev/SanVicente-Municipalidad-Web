/**
 * Fetch de noticias y eventos desde API Vecino Digital.
 */

import { API_VECINO_CONFIG } from "./config";
import type { VecinoNewsItem, VecinoEventItem, VecinoNeighborhood } from "./types";
import { adaptVecinoNewsToNoticia } from "./adapters";
import { adaptVecinoEventToEvento } from "./adapters";

const FETCH_TIMEOUT = 8000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Obtiene noticias desde API Vecino.
 * Retorna [] si no hay API configurada o falla.
 */
export async function fetchVecinoNews(): Promise<VecinoNewsItem[]> {
  const base = API_VECINO_CONFIG.BASE_URL;
  if (!base) return [];

  const url = `${base}${API_VECINO_CONFIG.ENDPOINTS.NEWS}`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.filter((n: VecinoNewsItem) => !n.deleted_at);
  } catch {
    return [];
  }
}

/**
 * Obtiene eventos desde API Vecino.
 * Retorna [] si no hay API configurada o falla.
 */
export async function fetchVecinoEvents(): Promise<VecinoEventItem[]> {
  const base = API_VECINO_CONFIG.BASE_URL;
  if (!base) return [];

  const url = `${base}${API_VECINO_CONFIG.ENDPOINTS.EVENTS}`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.filter((e: VecinoEventItem) => !e.deleted_at);
  } catch {
    return [];
  }
}

/**
 * Noticias adaptadas al formato interno (lista_noticias).
 */
export async function fetchNoticiasAdaptadas() {
  const raw = await fetchVecinoNews();
  return raw.map(adaptVecinoNewsToNoticia);
}

/**
 * Eventos adaptados al formato interno (lista_eventos).
 */
export async function fetchEventosAdaptados() {
  const raw = await fetchVecinoEvents();
  return raw
    .map(adaptVecinoEventToEvento)
    .sort((a, b) => new Date(a._fechaISO).getTime() - new Date(b._fechaISO).getTime());
}

/**
 * Obtiene barrios/sectores con horarios de recolección desde API Vecino.
 * Retorna [] si no hay API configurada o falla.
 */
export async function fetchVecinoNeighborhoods(): Promise<VecinoNeighborhood[]> {
  const base = API_VECINO_CONFIG.BASE_URL;
  if (!base) return [];

  const url = `${base}${API_VECINO_CONFIG.ENDPOINTS.NEIGHBORHOODS}`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data;
  } catch {
    return [];
  }
}

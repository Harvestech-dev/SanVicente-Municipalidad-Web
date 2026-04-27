/**
 * Fetch de noticias y eventos desde API Vecino Digital.
 */

import { API_VECINO_CONFIG } from "./config";
import type { VecinoNewsItem, VecinoEventItem, VecinoNeighborhood } from "./types";
import { adaptVecinoNewsToNoticia } from "./adapters";
import { adaptVecinoEventToEvento } from "./adapters";
import { CACHE_TTLS, getCache, setCache } from "../cache/client-cache";

const FETCH_TIMEOUT = 8000;
const NOTICIAS_ADAPTADAS_CACHE_KEY = "noticias:list";
const AGENDA_ADAPTADA_CACHE_KEY = "agenda:list";
const vecinoPending = new Map<string, Promise<void>>();

/** Inyectado en build desde ENVIRONMENT=development (ver astro.config). */
declare const __VECINO_USE_LOCAL_JSON__: boolean;

function isVecinoDevLocalMode(): boolean {
  return __VECINO_USE_LOCAL_JSON__;
}

function baseUrlForPublicData(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const site = import.meta.env.SITE;
  if (site && String(site).trim() !== "") {
    return String(site).replace(/\/$/, "");
  }
  return "http://localhost:4321";
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Obtiene noticias desde API Vecino.
 * Retorna [] si no hay API configurada o falla.
 * En build (p. ej. Netlify): definir PUBLIC_API_VECINO_URL para que las noticias se incluyan.
 */
export async function fetchVecinoNews(): Promise<VecinoNewsItem[]> {
  if (isVecinoDevLocalMode()) {
    try {
      const localUrl = `${baseUrlForPublicData()}/data/noticiasLocal.json`;
      const res = await fetchWithTimeout(localUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (typeof console !== "undefined") {
            console.info(
              "[API Vecino] Development: noticias desde /data/noticiasLocal.json"
            );
          }
          return data.filter((n: VecinoNewsItem) => !n.deleted_at);
        }
      }
    } catch {
      /* seguir a API */
    }
    if (typeof console !== "undefined") {
      console.warn(
        "[API Vecino] Development: noticiasLocal.json no usable; se intenta la API"
      );
    }
  }

  const base = API_VECINO_CONFIG.BASE_URL;
  if (!base) {
    if (typeof console !== "undefined") {
      console.warn(
        "[API Vecino] PUBLIC_API_VECINO_URL no definida: noticias no se cargarán en este build. Definir en Netlify: Site settings > Environment variables."
      );
    }
    return [];
  }

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
  if (isVecinoDevLocalMode()) {
    try {
      const localUrl = `${baseUrlForPublicData()}/data/agendaLocal.json`;
      const res = await fetchWithTimeout(localUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (typeof console !== "undefined") {
            console.info(
              "[API Vecino] Development: eventos desde /data/agendaLocal.json"
            );
          }
          return data.filter((e: VecinoEventItem) => !e.deleted_at);
        }
      }
    } catch {
      /* seguir a API */
    }
    if (typeof console !== "undefined") {
      console.warn(
        "[API Vecino] Development: agendaLocal.json no usable; se intenta la API"
      );
    }
  }

  const base = API_VECINO_CONFIG.BASE_URL;
  if (!base) {
    if (typeof console !== "undefined") {
      console.warn(
        "[API Vecino] PUBLIC_API_VECINO_URL no definida: eventos no se cargarán en este build."
      );
    }
    return [];
  }

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
 * Obtiene una noticia por ID desde API Vecino.
 * Retorna null si no existe o falla.
 */
export async function fetchVecinoNewsById(id: number): Promise<VecinoNewsItem | null> {
  if (isVecinoDevLocalMode()) {
    const items = await fetchVecinoNews();
    return items.find((n) => n.id === id) ?? null;
  }

  const base = API_VECINO_CONFIG.BASE_URL;
  if (!base) return null;

  const url = `${base}${API_VECINO_CONFIG.ENDPOINTS.NEWS_DETAIL(id)}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object" || !("id" in data)) return null;
    return data as VecinoNewsItem;
  } catch {
    return null;
  }
}

/**
 * Noticia individual adaptada al formato interno.
 * Extrae el ID del slug (formato: {nombre-slugificado}-{id}).
 */
export async function fetchNoticiaBySlug(slug: string) {
  const parts = slug.split("-");
  const id = parseInt(parts[parts.length - 1] ?? "", 10);
  if (!id || isNaN(id)) return null;
  const raw = await fetchVecinoNewsById(id);
  if (!raw) return null;
  return adaptVecinoNewsToNoticia(raw);
}

/**
 * Noticias adaptadas al formato interno (lista_noticias).
 */
export async function fetchNoticiasAdaptadas() {
  if (typeof window !== "undefined") {
    const context = { isDevelopment: isVecinoDevLocalMode() };
    const cached = getCache<ReturnType<typeof adaptVecinoNewsToNoticia>[]>(
      NOTICIAS_ADAPTADAS_CACHE_KEY,
      context
    );
    if (cached && cached.length > 0) {
      void revalidateNoticiasAdaptadasInBackground();
      return cached;
    }
  }
  const raw = await fetchVecinoNews();
  const adapted = raw.map(adaptVecinoNewsToNoticia);
  if (typeof window !== "undefined") {
    const context = { isDevelopment: isVecinoDevLocalMode() };
    setCache(
      NOTICIAS_ADAPTADAS_CACHE_KEY,
      adapted,
      context,
      CACHE_TTLS.noticiasListMs
    );
  }
  return adapted;
}

/**
 * Eventos adaptados al formato interno (lista_eventos).
 */
export async function fetchEventosAdaptados() {
  if (typeof window !== "undefined") {
    const context = { isDevelopment: isVecinoDevLocalMode() };
    const cached = getCache<ReturnType<typeof adaptVecinoEventToEvento>[]>(
      AGENDA_ADAPTADA_CACHE_KEY,
      context
    );
    if (cached && cached.length > 0) {
      void revalidateEventosAdaptadosInBackground();
      return cached;
    }
  }
  const raw = await fetchVecinoEvents();
  const adapted = raw
    .map(adaptVecinoEventToEvento)
    .sort((a, b) => new Date(a._fechaISO).getTime() - new Date(b._fechaISO).getTime());
  if (typeof window !== "undefined") {
    const context = { isDevelopment: isVecinoDevLocalMode() };
    setCache(
      AGENDA_ADAPTADA_CACHE_KEY,
      adapted,
      context,
      CACHE_TTLS.agendaListMs
    );
  }
  return adapted;
}

async function revalidateNoticiasAdaptadasInBackground(): Promise<void> {
  const key = "revalidate:noticias";
  if (vecinoPending.has(key)) return;
  const work = (async () => {
    const raw = await fetchVecinoNews();
    const adapted = raw.map(adaptVecinoNewsToNoticia);
    const context = { isDevelopment: isVecinoDevLocalMode() };
    setCache(
      NOTICIAS_ADAPTADAS_CACHE_KEY,
      adapted,
      context,
      CACHE_TTLS.noticiasListMs
    );
  })()
    .catch(() => {
      /* noop */
    })
    .finally(() => {
      vecinoPending.delete(key);
    });
  vecinoPending.set(key, work);
}

async function revalidateEventosAdaptadosInBackground(): Promise<void> {
  const key = "revalidate:agenda";
  if (vecinoPending.has(key)) return;
  const work = (async () => {
    const raw = await fetchVecinoEvents();
    const adapted = raw
      .map(adaptVecinoEventToEvento)
      .sort((a, b) => new Date(a._fechaISO).getTime() - new Date(b._fechaISO).getTime());
    const context = { isDevelopment: isVecinoDevLocalMode() };
    setCache(AGENDA_ADAPTADA_CACHE_KEY, adapted, context, CACHE_TTLS.agendaListMs);
  })()
    .catch(() => {
      /* noop */
    })
    .finally(() => {
      vecinoPending.delete(key);
    });
  vecinoPending.set(key, work);
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

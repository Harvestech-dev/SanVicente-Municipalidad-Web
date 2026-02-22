/**
 * Fetch de datos CMS para Astro (build time o SSR).
 */

import { buildApiUrl, API_CONFIG } from "./api-config";
import type { CMSComponent, CMSComponentsResponse, CMSComponentFilters } from "./types";
import { safeValidateClientConfig, type ClientConfig } from "./client-config";

const FETCH_TIMEOUT = 8000;

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

/**
 * Obtiene la configuración del cliente desde la API.
 * Retorna null si no hay API configurada o falla.
 */
export async function fetchClientConfig(hostname: string): Promise<ClientConfig | null> {
  const base = API_CONFIG.BASE_URL;
  if (!base) return null;

  const url = buildApiUrl(API_CONFIG.ENDPOINTS.CLIENT_CONFIG, {
    host: hostname.split(":")[0],
  });

  try {
    const res = await fetchWithTimeout(url, {
      headers: { "X-Original-Host": hostname },
    });
    if (!res.ok) return null;

    const raw = await res.json();
    const data = raw?.data ?? raw;
    const validation = safeValidateClientConfig(data);
    return validation.success ? validation.data ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Obtiene los componentes CMS desde la API.
 * Filtra por isActive e isVisible.
 * Retorna [] si no hay API o falla.
 */
export async function fetchCMSComponents(
  filters?: CMSComponentFilters
): Promise<CMSComponent[]> {
  const base = API_CONFIG.BASE_URL;
  if (!base) return [];

  const params: Record<string, string> = {};
  if (filters?.type) params.type = filters.type;
  if (filters?.page_filter) params.page_filter = filters.page_filter;
  if (filters?.status) params.status = filters.status;

  const url = buildApiUrl(API_CONFIG.ENDPOINTS.CMS_COMPONENTS, params);

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];

    const json: CMSComponentsResponse = await res.json();
    if (!json.success || !json.data?.components) return [];

    return json.data.components.filter((c) => c.isActive && c.isVisible);
  } catch {
    return [];
  }
}

/**
 * Obtiene componentes filtrados por página y ordenados por _orden.
 */
export function getComponentsByPage(
  components: CMSComponent[],
  page: string
): CMSComponent[] {
  const filtered = components.filter((c) => c.page === page);
  return filtered.sort((a, b) => {
    const orderA = (a.data?._orden ?? a.data?.order) as number | null | undefined;
    const orderB = (b.data?._orden ?? b.data?.order) as number | null | undefined;
    if (orderA != null && orderB != null) return orderA - orderB;
    if (orderA != null) return -1;
    if (orderB != null) return 1;
    return 0;
  });
}

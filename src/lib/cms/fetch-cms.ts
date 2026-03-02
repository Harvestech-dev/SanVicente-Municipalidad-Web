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

  const url = buildApiUrl(API_CONFIG.ENDPOINTS.CMS_COMPONENTS);

  try {
    const res = await fetchWithTimeout(url);
    const json = await res.json();

    if (!res.ok) return [];

    const parsed = json as CMSComponentsResponse;
    if (!parsed.success || !parsed.data?.components) return [];

    return parsed.data.components.filter((c) => c.isActive && c.isVisible);
  } catch {
    return [];
  }
}

/**
 * Extrae lista_oficinas del componente contact_areas.
 * Busca en todos los componentes. Retorna [] si no hay.
 */
export function getContactAreasFromComponents(
  components: CMSComponent[]
): Array<Record<string, unknown>> {
  const comp = components.find((c) => c.type === "contact_areas");
  const lista = (comp?.data?.lista_oficinas ?? []) as Array<Record<string, unknown>>;
  return Array.isArray(lista) ? lista : [];
}

/**
 * Extrae lista_contacto del componente redes_sociales.
 * Busca en todos los componentes. Retorna [] si no hay.
 */
export function getRedesFromComponents(
  components: CMSComponent[]
): Array<{ icon_contacto?: string; link_destino?: string; txt_label?: string; txt_valor?: string }> {
  const comp = components.find((c) => c.type === "redes_sociales");
  const lista = (comp?.data?.lista_contacto ?? []) as Array<{
    icon_contacto?: string;
    link_destino?: string;
    txt_label?: string;
    txt_valor?: string;
  }>;
  return Array.isArray(lista) ? lista : [];
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

/**
 * Configuración de API para CMS (Astro).
 * Usa import.meta.env.PUBLIC_API_URL
 */

function getBaseUrl(): string {
  const url = import.meta.env.PUBLIC_API_URL;
  if (url && typeof url === "string" && url.trim() !== "") {
    return url.replace(/\/$/, "");
  }
  return "";
}

function getClientSlug(): string {
  const slug = import.meta.env.CLIENT_SLUG ?? import.meta.env.PUBLIC_CLIENT_SLUG;
  return (slug && String(slug).trim()) || "";
}

function isDevelopment(): boolean {
  const env = import.meta.env.ENVIRONMENT ?? import.meta.env.ENVIROMENT ?? "";
  return String(env).toLowerCase() === "development";
}

export const API_CONFIG = {
  get BASE_URL(): string {
    return getBaseUrl();
  },

  get CLIENT_SLUG(): string {
    return getClientSlug();
  },

  get IS_DEVELOPMENT(): boolean {
    return isDevelopment();
  },

  ENDPOINTS: {
    CLIENT_CONFIG: "/client-config",
    CMS_COMPONENTS: "/cms-components",
  },
} as const;

/**
 * Parámetros de query para desarrollo (?clientSlug=slug).
 */
function getDevParams(): Record<string, string> {
  if (!API_CONFIG.IS_DEVELOPMENT || !API_CONFIG.CLIENT_SLUG) return {};
  return { clientSlug: API_CONFIG.CLIENT_SLUG };
}

/**
 * Construye URL completa para un endpoint.
 * En development agrega ?clientSlug=CLIENT_SLUG.
 */
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string>
): string {
  const base = API_CONFIG.BASE_URL;
  if (!base) return "";

  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
  const fullUrl = `${baseClean}${path}`;

  try {
    const parsed = new URL(fullUrl);
    const devParams = getDevParams();
    const allParams = { ...devParams, ...params };
    Object.entries(allParams).forEach(([key, value]) => {
      if (value != null && String(value).trim() !== "") {
        parsed.searchParams.append(key, String(value));
      }
    });
    return parsed.toString();
  } catch {
    return fullUrl;
  }
}

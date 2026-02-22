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

export const API_CONFIG = {
  get BASE_URL(): string {
    return getBaseUrl();
  },

  ENDPOINTS: {
    CLIENT_CONFIG: "/client-config",
    CMS_COMPONENTS: "/cms-components",
  },
} as const;

/**
 * Construye URL completa para un endpoint.
 * Si BASE_URL es "https://api.com/api/public/v1", el endpoint se concatena.
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
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value != null && String(value).trim() !== "") {
          parsed.searchParams.append(key, String(value));
        }
      });
    }
    return parsed.toString();
  } catch {
    return fullUrl;
  }
}

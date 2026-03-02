/**
 * Configuración API Licitaciones (biddings).
 * Usa PUBLIC_API_URL (ej: https://api.miwebcms.com/api/public/v1) + /biddings
 */

function getBaseUrl(): string {
  const url = import.meta.env.PUBLIC_API_URL;
  if (url && typeof url === "string" && url.trim() !== "") {
    return url.replace(/\/$/, "");
  }
  return "";
}

export const API_LICITACIONES_CONFIG = {
  get BASE_URL(): string {
    return getBaseUrl();
  },

  ENDPOINTS: {
    BIDDINGS: "/biddings",
    BIDDING_DETAIL: (id: string) => `/biddings/${id}`,
  },
} as const;

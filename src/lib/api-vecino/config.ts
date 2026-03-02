/**
 * Configuración API Vecino Digital.
 * Base: https://api-sanvicente.vecino.digital
 */

function getBaseUrl(): string {
  const url = import.meta.env.PUBLIC_API_VECINO_URL;
  if (url && typeof url === "string" && url.trim() !== "") {
    return url.replace(/\/$/, "");
  }
  return "";
}

export const API_VECINO_CONFIG = {
  get BASE_URL(): string {
    return getBaseUrl();
  },

  ENDPOINTS: {
    NEWS: "/citizen/news",
    EVENTS: "/citizen/events",
    EVENT_DETAIL: (id: number) => `/citizen/events/${id}`,
    NEIGHBORHOODS: "/citizen/neighborhoods",
  },
} as const;

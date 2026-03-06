/**
 * Configuración API Vecino Digital.
 * Base: https://api-sanvicente.vecino.digital
 *
 * IMPORTANTE (Netlify/build): Las noticias y eventos se obtienen en tiempo de BUILD,
 * no en el navegador. En Netlify hay que definir la variable de entorno
 * PUBLIC_API_VECINO_URL (Site settings > Environment variables) con la misma URL
 * que en local. Si no está definida, la API no se llama y las noticias/eventos quedan vacíos.
 * La API debe ser accesible desde los servidores de Netlify (sin restricción por IP).
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

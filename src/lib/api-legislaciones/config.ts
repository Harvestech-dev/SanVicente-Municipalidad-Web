/**
 * Configuración API Legislaciones.
 * Usa PUBLIC_API_URL (ej: https://api.miwebcms.com/api/public/v1) + /legislations
 * Ref: docs/legislaciones/contrato-api.md
 */

function getBaseUrl(): string {
  const url = import.meta.env.PUBLIC_API_URL;
  if (url && typeof url === "string" && url.trim() !== "") {
    return url.replace(/\/$/, "");
  }
  return "";
}

export const API_LEGISLACIONES_CONFIG = {
  get BASE_URL(): string {
    return getBaseUrl();
  },

  ENDPOINTS: {
    LEGISLATIONS: "/legislations",
    LEGISLATION_DETAIL: (slug: string) => `/legislations/${slug}`,
  },
} as const;

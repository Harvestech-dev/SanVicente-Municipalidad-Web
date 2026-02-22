/**
 * Módulo CMS - Layout dinámico y fetch desde API.
 * Ruta B: Implementación Astro nativa.
 */

export { API_CONFIG, buildApiUrl } from "./api-config";
export type { CMSComponent, CMSComponentsResponse, CMSComponentFilters } from "./types";
export type { ClientConfig } from "./client-config";
export { safeValidateClientConfig } from "./client-config";
export {
  fetchClientConfig,
  fetchCMSComponents,
  getComponentsByPage,
} from "./fetch-cms";
export { getLocalComponentsAsCMS } from "./fallback-local";

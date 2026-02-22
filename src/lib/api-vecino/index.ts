/**
 * Módulo API Vecino Digital.
 * Endpoints: /citizen/news, /citizen/events
 */

export type { VecinoNewsItem, VecinoEventItem, VecinoCategory, VecinoImage } from "./types";
export { API_VECINO_CONFIG } from "./config";
export { adaptVecinoNewsToNoticia, adaptVecinoEventToEvento } from "./adapters";
export {
  fetchVecinoNews,
  fetchVecinoEvents,
  fetchNoticiasAdaptadas,
  fetchEventosAdaptados,
} from "./fetch";

/**
 * Módulo API Vecino Digital.
 * Endpoints: /citizen/news, /citizen/events
 */

export type { VecinoNewsItem, VecinoEventItem, VecinoNeighborhood, VecinoWaste, VecinoCategory, VecinoImage } from "./types";
export { API_VECINO_CONFIG } from "./config";
export { adaptVecinoNewsToNoticia, adaptVecinoEventToEvento } from "./adapters";
export {
  fetchVecinoNews,
  fetchVecinoEvents,
  fetchNoticiasAdaptadas,
  fetchEventosAdaptados,
  fetchVecinoNeighborhoods,
} from "./fetch";

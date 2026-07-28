/**
 * Módulo API Vecino Digital.
 * Endpoints: /public/news, /public/events
 */

export type { VecinoNewsItem, VecinoEventItem, VecinoNeighborhood, VecinoWaste, VecinoCategory, VecinoImage } from "./types";
export { API_VECINO_CONFIG } from "./config";
export { adaptVecinoNewsToNoticia, adaptVecinoEventToEvento } from "./adapters";
export {
  fetchVecinoNews,
  fetchVecinoNewsById,
  fetchNoticiaBySlug,
  fetchVecinoEvents,
  fetchNoticiasAdaptadas,
  fetchEventosAdaptados,
  fetchVecinoNeighborhoods,
} from "./fetch";

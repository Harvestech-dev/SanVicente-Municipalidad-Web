/**
 * Tipos para la API Vecino Digital.
 * Endpoints: /public/news, /public/events
 */

export interface VecinoCategory {
  id: number;
  name: string;
}

export interface VecinoImage {
  id: number;
  name: string;
  url: string;
  order: number;
}

export interface VecinoNewsItem {
  id: number;
  name: string;
  extract: string;
  body: string;
  more_info: string | null;
  landmark_id: number | null;
  landmark_name: string | null;
  event_id: number | null;
  event_name: string | null;
  published_from: string;
  published_to: string | null;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  images: VecinoImage[];
  categories: VecinoCategory[];
}

export interface VecinoEventItem {
  id: number;
  name: string;
  body: string;
  landmark_id: number | null;
  landmark_name: string | null;
  inscription_event_id: number | null;
  inscription_event_name: string | null;
  published_from: string;
  published_to: string | null;
  active_from: string;
  active_to: string;
  is_important: boolean;
  created_at: string;
  updated_at: string | null;
  images: VecinoImage[];
  categories: VecinoCategory[];
}

export interface VecinoWaste {
  id: number;
  type: string;
  date: string | null;
  day_of_week: number;
  time_gap_start: string;
  time_gap_finish: string;
  neighborhood_id: number;
  created_at: string;
  updated_at: string;
}

export interface VecinoNeighborhood {
  id: number;
  name: string;
  landmark_id: number;
  area: unknown;
  wastes: VecinoWaste[];
}

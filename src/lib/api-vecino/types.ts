/**
 * Tipos para la API Vecino Digital.
 * Endpoints: /citizen/news, /citizen/events
 */

export interface VecinoCategory {
  id: number;
  name: string;
  category_id: number | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  pivot?: { categorizable_id: number; category_id: number; categorizable_type: string };
}

export interface VecinoImage {
  id: number;
  name: string;
  url: string;
  path: string;
  type: string;
  order: number;
  mediable_type: string;
  mediable_id: number;
  created_at: string;
  updated_at: string;
}

export interface VecinoNewsItem {
  id: number;
  name: string;
  extract: string;
  body: string;
  more_info: string | null;
  landmark_id: number | null;
  event_id: number | null;
  published_from: string;
  published_to: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  categories: VecinoCategory[];
  landmark: unknown;
  images: VecinoImage[];
  links: unknown[];
  sounds: unknown[];
  videos: unknown[];
  event: unknown;
}

export interface VecinoEventItem {
  id: number;
  name: string;
  body: string;
  landmark_id: number | null;
  published_from: string;
  published_to: string;
  active_from: string;
  active_to: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  categories: VecinoCategory[];
  landmark: unknown;
  images: VecinoImage[];
  links: unknown[];
  sounds: unknown[];
  videos: unknown[];
}

/**
 * Adaptadores: API Vecino → formato interno (manual CMS).
 */

import { API_VECINO_CONFIG } from "./config";
import type { VecinoNewsItem, VecinoEventItem } from "./types";

function toAbsoluteImageUrl(url: string | null): string {
  if (!url || url.trim() === "") return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_VECINO_CONFIG.BASE_URL;
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return d.toLocaleDateString("es-AR", options);
  } catch {
    return iso.slice(0, 10);
  }
}

/** Última línea con marcador de lugar (p. ej. "📍 Salón Sarmiento") desde el cuerpo del evento. */
function extractUbicacionHintFromBody(body: string): string {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/[📍📌]|ubicaci[oó]n/i.test(line)) {
      return line.replace(/^[📍📌]\s*/u, "").trim();
    }
  }
  return "";
}

function slugify(text: string, id: number): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base ? `${base}-${id}` : `item-${id}`;
}

/**
 * Convierte noticia API Vecino → formato lista_noticias.
 */
export function adaptVecinoNewsToNoticia(item: VecinoNewsItem) {
  const categoria = item.categories?.[0]?.name ?? "General";
  const imagen = toAbsoluteImageUrl(item.images?.[0]?.url ?? null);
  const gallery = (item.images ?? [])
    .map((img) => toAbsoluteImageUrl(img.url ?? null))
    .filter((url) => url.trim() !== "");

  return {
    _orden: item.id,
    _slug: slugify(item.name, item.id),
    txt_titulo: item.name,
    txt_extracto: item.extract ?? "",
    txt_cuerpo: item.body ? `<p>${item.body.replace(/\n/g, "</p><p>")}</p>` : "",
    txt_fecha: formatDate(item.published_from),
    txt_categoria: categoria,
    img_principal: imagen,
    gallery_imagenes: gallery,
    boolean_destacada: item.is_important ?? false,
    link_mas_info: item.more_info ?? null,
  };
}

/**
 * Convierte evento API Vecino → formato lista_eventos.
 */
export function adaptVecinoEventToEvento(item: VecinoEventItem) {
  const categoria = item.categories?.[0]?.name ?? "Evento";
  const imagen = toAbsoluteImageUrl(item.images?.[0]?.url ?? null);
  const body = item.body ?? "";
  const ubicacionHint = extractUbicacionHintFromBody(body);

  return {
    _orden: item.id,
    txt_titulo: item.name,
    txt_fecha: formatDate(item.active_from ?? item.published_from),
    _fechaISO: (item.active_from ?? item.published_from).slice(0, 10),
    txt_horario: "", // API no provee horario dedicado; el detalle está en txt_descripcion
    txt_ubicacion: ubicacionHint,
    txt_categoria: categoria,
    img_principal: imagen,
    txt_descripcion: body,
    boolean_destacada: item.is_important ?? false,
  };
}

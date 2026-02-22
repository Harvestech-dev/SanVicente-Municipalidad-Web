/**
 * Adaptadores: API Vecino → formato interno (manual CMS).
 */

import type { VecinoNewsItem, VecinoEventItem } from "./types";

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
  const imagen = item.images?.[0]?.url ?? null;

  return {
    _orden: item.id,
    _slug: slugify(item.name, item.id),
    txt_titulo: item.name,
    txt_extracto: item.extract ?? "",
    txt_cuerpo: item.body ? `<p>${item.body.replace(/\n/g, "</p><p>")}</p>` : "",
    txt_fecha: formatDate(item.published_from),
    txt_categoria: categoria,
    img_principal: imagen ?? "",
    boolean_destacada: item.is_important ?? false,
    link_mas_info: item.more_info ?? null,
  };
}

/**
 * Convierte evento API Vecino → formato lista_eventos.
 */
export function adaptVecinoEventToEvento(item: VecinoEventItem) {
  const categoria = item.categories?.[0]?.name ?? "Evento";
  const imagen = item.images?.[0]?.url ?? null;

  return {
    _orden: item.id,
    txt_titulo: item.name,
    txt_fecha: formatDate(item.active_from ?? item.published_from),
    _fechaISO: (item.active_from ?? item.published_from).slice(0, 10),
    txt_horario: "", // API no provee horario
    txt_ubicacion: item.body || "Consultar",
    txt_categoria: categoria,
    img_principal: imagen ?? "",
    txt_descripcion: item.body ?? "",
  };
}

/**
 * Convierte los JSON locales a formato CMSComponent[] para fallback
 * cuando la API no está disponible.
 */

import type { CMSComponent } from "./types";
import bannerData from "../../data/banner.json";
import accesosData from "../../data/accesos-rapidos.json";
import programasData from "../../data/programas.json";
import agendaData from "../../data/agenda-cultural.json";
import noticiasData from "../../data/noticias.json";

const PAGE_INICIO = "Inicio";

function makeComponent(
  type: string,
  name: string,
  data: Record<string, unknown>,
  order: number
): CMSComponent {
  const dataWithOrder = { ...data, _orden: order };
  return {
    _id: `local-${type}`,
    name,
    type,
    page: PAGE_INICIO,
    data: dataWithOrder,
    status: "published",
    isActive: true,
    isVisible: true,
    clientName: "san-vicente",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Devuelve componentes en formato CMS usando JSON locales.
 * Orden: HeroCarousel, Banner, AccesosRapidos, Programas, AgendaCultural, Noticias, TelefonosUtiles
 */
export function getLocalComponentsAsCMS(): CMSComponent[] {
  return [
    makeComponent("banner_hero", "Banner", bannerData as Record<string, unknown>, 2),
    makeComponent("accesos_rapidos", "Accesos Rápidos", accesosData as Record<string, unknown>, 3),
    makeComponent("programas_section", "Programas", programasData as Record<string, unknown>, 4),
    makeComponent("agenda_cultural", "Agenda Cultural", agendaData as Record<string, unknown>, 5),
    makeComponent("noticias", "Noticias", noticiasData as Record<string, unknown>, 6),
  ];
}

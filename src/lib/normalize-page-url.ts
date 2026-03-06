/**
 * Normaliza URLs de páginas internas: quita el sufijo "Page" para que
 * /agendaPage, /contactoPage, etc. apunten a /agenda, /contacto, etc.
 */
const PAGE_SUFFIX = "Page";
const PAGE_MAP: Record<string, string> = {
  "/agendaPage": "/agenda",
  "/contactoPage": "/contacto",
  "/noticiasPage": "/noticias",
  "/gobiernoPage": "/gobierno",
  "/programasPage": "/programas",
  "/recoleccionesPage": "/recolecciones",
  "/licitacionesPage": "/Transparencia/licitaciones",
  "/ordenanzasPage": "/Transparencia/ordenanzas",
  "/licenciaPage": "/Tramites/licencia",
  "/tramitesPage": "/tramites",
};

export function normalizePageUrl(url: string | null | undefined | unknown): string {
  if (url == null || typeof url !== "string") return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return PAGE_MAP[path] ?? path.replace(new RegExp(`${PAGE_SUFFIX}$`), "");
}

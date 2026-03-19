/**
 * Extrae lista de programas y metadatos de la página Programas desde componentes CMS.
 */

import type { CMSComponent } from "./types";

const PAGE_PROGRAMAS = "Programas";
const PROGRAMAS_TYPES = ["programas", "programas_section", "programas_home"];

export interface ProgramasPageData {
  txt_titulo: string;
  txt_subtitulo: string;
  lista_programas: unknown[];
}

/**
 * Busca el componente de página Programas y devuelve titulo, subtitulo y lista_programas.
 */
export function getProgramasPageData(
  components: CMSComponent[]
): ProgramasPageData {
  const comp = components.find(
    (c) =>
      c.page === PAGE_PROGRAMAS && PROGRAMAS_TYPES.includes(c.type)
  );
  const data = (comp?.data ?? {}) as Record<string, unknown>;
  const lista = data.lista_programas;
  return {
    txt_titulo: (data.txt_titulo as string) ?? "Programas Municipales",
    txt_subtitulo: (data.txt_subtitulo as string) ?? "",
    lista_programas: Array.isArray(lista) ? lista : [],
  };
}

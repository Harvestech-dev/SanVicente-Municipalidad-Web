/**
 * Fusiona componentes CMS de página Inicio con datos de Vecino y programas (misma lógica que index.astro).
 */

import type { CMSComponent } from "./types";
import { getComponentsByPage } from "./fetch-cms";

const PAGE_INICIO = "Inicio";

export interface MergeInicioOptions {
  noticiasApi: unknown[];
  eventosApi: unknown[];
}

export function mergeInicioPageComponents(
  components: CMSComponent[],
  opts: MergeInicioOptions
): CMSComponent[] {
  let pageComponents = getComponentsByPage(components, PAGE_INICIO);

  pageComponents = pageComponents.map((comp: CMSComponent) => {
    let outType = comp.type;
    const data = { ...comp.data };

    if (comp.type === "agenda_cultural") {
      const btn = comp.data?.btn_boton as
        | { txt_label?: string; label_texto?: string; link_url?: string; src_destino?: string }
        | undefined;
      if (btn) {
        (data as Record<string, unknown>).txt_ver_todo = btn.txt_label ?? btn.label_texto;
        (data as Record<string, unknown>).link_ver_todo = btn.link_url ?? btn.src_destino;
      }
      (data as Record<string, unknown>).lista_eventos = opts.eventosApi.slice(0, 10);
      (data as Record<string, unknown>).lista_categorias = [
        "Todas",
        ...Array.from(
          new Set(
            (opts.eventosApi as { txt_categoria?: string }[])
              .map((e) => e.txt_categoria)
              .filter(Boolean)
          )
        ),
      ];
    }

    const isTelefonosUtilesInicio =
      comp.type === "telefonos_utiles" ||
      comp.type === "telfonos_tiles" ||
      comp.type === "telfonos_utiles";
    if (isTelefonosUtilesInicio) {
      const btn = comp.data?.btn_boton as
        | {
            txt_label?: string;
            label_texto?: string;
            link_destino?: string;
            link_url?: string;
            src_destino?: string;
          }
        | undefined;
      if (btn) {
        (data as Record<string, unknown>).txt_ver_todo = btn.txt_label ?? btn.label_texto;
        (data as Record<string, unknown>).link_ver_todo =
          btn.link_destino ?? btn.link_url ?? btn.src_destino;
      }
      const compContacto = components.find(
        (c) =>
          (c.type === "telefonos_utiles" ||
            c.type === "telfonos_utiles_contacto" ||
            c.type === "telfonos_tiles") &&
          c.page === "Contacto"
      );
      const contactData = (compContacto?.data ?? {}) as Record<string, unknown>;
      const listaContacto = contactData.lista_telefonos ?? contactData.lista_contacto;
      if (Array.isArray(listaContacto) && listaContacto.length > 0) {
        (data as Record<string, unknown>).lista_telefonos = listaContacto;
        (data as Record<string, unknown>).lista_contacto = listaContacto;
      }
      outType = "telefonos_utiles";
    }

    if (outType === "noticias_section" || outType === "noticias") {
      const btn = comp.data?.btn_boton as
        | { txt_label?: string; label_texto?: string; link_url?: string; src_destino?: string }
        | undefined;
      if (btn) {
        (data as Record<string, unknown>).txt_ver_todo = btn.txt_label ?? btn.label_texto;
        (data as Record<string, unknown>).link_ver_todo = btn.link_url ?? btn.src_destino;
      }
      (data as Record<string, unknown>).lista_noticias = opts.noticiasApi;
      (data as Record<string, unknown>).lista_categorias = [
        "Todas",
        ...Array.from(
          new Set(
            (opts.noticiasApi as { txt_categoria?: string }[])
              .map((n) => n.txt_categoria)
              .filter(Boolean)
          )
        ),
      ];
    }

    if (outType === "programas_home") {
      const compProgramas = components.find(
        (c) =>
          c.page === "Programas" &&
          (c.type === "programas" || c.type === "programas_section" || c.type === "programas_home")
      );
      const programasPageData = (compProgramas?.data ?? {}) as Record<string, unknown>;
      const listaFromCms = programasPageData.lista_programas ?? comp.data?.lista_programas;
      (data as Record<string, unknown>).lista_programas =
        Array.isArray(listaFromCms) ? listaFromCms : [];
    }

    return { ...comp, type: outType, data };
  });

  return pageComponents;
}

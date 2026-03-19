export type AreaItem = string | { txt_nombre?: string };
export type OrganigramaItemRaw = {
  txt_nombre: string;
  lista_areas?: AreaItem[];
  Lista_areas?: AreaItem[];
  lista_subsecretarias?: OrganigramaSubRaw[];
  lista_departamentos?: OrganigramaDeptoRaw[];
  lista_depertamentos?: OrganigramaDeptoRaw[];
};
export type OrganigramaSubRaw = {
  txt_nombre: string;
  lista_areas?: AreaItem[];
  Lista_areas?: AreaItem[];
  lista_departamentos?: OrganigramaDeptoRaw[];
  lista_depertamentos?: OrganigramaDeptoRaw[];
};
export type OrganigramaDeptoRaw = {
  txt_nombre: string;
  lista_areas?: AreaItem[];
  Lista_areas?: AreaItem[];
};

export type OrganigramaDepto = { txt_nombre: string; lista_areas?: string[] };
export type OrganigramaSub = {
  txt_nombre: string;
  lista_areas?: string[];
  lista_departamentos?: OrganigramaDepto[];
};
export type OrganigramaItem = {
  txt_nombre: string;
  lista_areas?: string[];
  lista_subsecretarias?: OrganigramaSub[];
  lista_departamentos?: OrganigramaDepto[];
};

export function normalizeAreas(arr: AreaItem[] | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => (typeof item === "string" ? item : item?.txt_nombre ?? "")).filter(Boolean);
}

function getAreasRaw(node: Record<string, unknown>): string[] {
  const arr = (node.lista_areas ?? node.Lista_areas) as AreaItem[] | undefined;
  return normalizeAreas(Array.isArray(arr) ? arr : []);
}

export function normalizeOrganigrama(raw: OrganigramaItemRaw[]): OrganigramaItem[] {
  return raw.map((sec) => {
    const secR = sec as Record<string, unknown>;
    const subsecretarias = (secR.lista_subsecretarias ?? []) as OrganigramaSubRaw[];
    const deptosTop = (secR.lista_departamentos ?? secR.lista_depertamentos ?? []) as OrganigramaDeptoRaw[];
    return {
      txt_nombre: sec.txt_nombre,
      lista_areas: getAreasRaw(secR),
      lista_subsecretarias: subsecretarias.map((sub) => {
        const subR = sub as Record<string, unknown>;
        const deptos = (subR.lista_departamentos ?? subR.lista_depertamentos ?? []) as OrganigramaDeptoRaw[];
        return {
          txt_nombre: sub.txt_nombre,
          lista_areas: getAreasRaw(subR),
          lista_departamentos: deptos.map((d) => ({
            txt_nombre: d.txt_nombre,
            lista_areas: getAreasRaw(d as Record<string, unknown>),
          })),
        };
      }),
      lista_departamentos: deptosTop.map((d) => ({
        txt_nombre: d.txt_nombre,
        lista_areas: getAreasRaw(d as Record<string, unknown>),
      })),
    };
  });
}

export function getAreas(node: { lista_areas?: string[] }): string[] {
  return node.lista_areas ?? [];
}
export function getDepartamentos(node: { lista_departamentos?: OrganigramaDepto[] }): OrganigramaDepto[] {
  return node.lista_departamentos ?? [];
}
export function getSubsecretarias(sec: OrganigramaItem): OrganigramaSub[] {
  return sec.lista_subsecretarias ?? [];
}

/**
 * Genera un slug estable para un programa (para URL /programas/[id]).
 * Usa _id si existe (CMS), si no: slug del título + _orden para unicidad.
 */
import { CACHE_TTLS, getCache, setCache, type CacheContext } from "./cache/client-cache";

export type ProgramaLike = {
  _id?: string;
  _orden?: number;
  txt_titulo?: string;
  boolean_featured?: boolean;
};

export const PROGRAMAS_CACHE_KEY = "programas:list";

type ProgramCacheContext = {
  clientSlug?: string;
  isDevelopment?: boolean;
};

export function slugify(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProgramSlug(
  prog: { _id?: string; txt_titulo?: string; _orden?: number },
  index: number
): string {
  if (prog._id && String(prog._id).trim() !== "") return String(prog._id).trim();
  const base = slugify(prog.txt_titulo ?? "programa");
  const orden = prog._orden ?? index + 1;
  return base ? `${base}-${orden}` : `programa-${orden}`;
}

/** Orden único para home/listado/detalle, evitando slugs inconsistentes. */
export function sortProgramList<T extends ProgramaLike>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const aF = a.boolean_featured ? 1 : 0;
    const bF = b.boolean_featured ? 1 : 0;
    if (bF !== aF) return bF - aF;
    return (a._orden ?? 0) - (b._orden ?? 0);
  });
}

export function saveProgramListCache<T extends ProgramaLike>(
  list: T[],
  context?: ProgramCacheContext
): void {
  const cacheContext: CacheContext = {
    clientSlug: context?.clientSlug,
    isDevelopment: context?.isDevelopment,
  };
  setCache<T[]>(PROGRAMAS_CACHE_KEY, list, cacheContext, CACHE_TTLS.programasListMs);
}

export function readProgramListCache<T extends ProgramaLike>(
  context?: ProgramCacheContext
): T[] {
  const cacheContext: CacheContext = {
    clientSlug: context?.clientSlug,
    isDevelopment: context?.isDevelopment,
  };
  return getCache<T[]>(PROGRAMAS_CACHE_KEY, cacheContext) ?? [];
}

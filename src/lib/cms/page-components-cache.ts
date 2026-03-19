import type { CMSComponent } from "./types";
import {
  CACHE_TTLS,
  getCache,
  setCache,
  type CacheContext,
} from "../cache/client-cache";

export const GOBIERNO_PAGE_CACHE_KEY = "gobierno:page";
export const CONTACTO_PAGE_CACHE_KEY = "contacto:page";

export function readGobiernoPageCache(context: CacheContext): CMSComponent[] {
  return getCache<CMSComponent[]>(GOBIERNO_PAGE_CACHE_KEY, context) ?? [];
}

export function saveGobiernoPageCache(
  components: CMSComponent[],
  context: CacheContext
): void {
  setCache(
    GOBIERNO_PAGE_CACHE_KEY,
    components,
    context,
    CACHE_TTLS.gobiernoPageMs
  );
}

export function readContactoPageCache(context: CacheContext): CMSComponent[] {
  return getCache<CMSComponent[]>(CONTACTO_PAGE_CACHE_KEY, context) ?? [];
}

export function saveContactoPageCache(
  components: CMSComponent[],
  context: CacheContext
): void {
  setCache(
    CONTACTO_PAGE_CACHE_KEY,
    components,
    context,
    CACHE_TTLS.contactoPageMs
  );
}

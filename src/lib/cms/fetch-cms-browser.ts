/**
 * Obtiene componentes CMS desde el navegador (requiere CORS en la API hacia el origen del sitio).
 */

import type { CMSComponent } from "./types";
import type { CMSComponentsResponse } from "./types";
import {
  CACHE_TTLS,
  getCache,
  setCache,
  buildScopedCacheKey,
  type CacheContext,
} from "../cache/client-cache";

const FETCH_TIMEOUT = 12000;
const CMS_BROWSER_CACHE_KEY = "cms:components";
type CacheEntry = { data: CMSComponent[]; ts: number };

const cmsDataCache = new Map<string, CacheEntry>();
const cmsPendingRequests = new Map<string, Promise<CMSComponent[]>>();
const cmsBackgroundRevalidate = new Map<string, Promise<void>>();

function buildCmsComponentsUrl(
  baseUrl: string,
  clientSlug: string,
  isDevelopment: boolean
): string {
  const base = baseUrl.replace(/\/$/, "");
  if (!base) return "";
  const path = "/cms-components";
  const fullUrl = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const parsed = new URL(fullUrl);
    if (isDevelopment && clientSlug.trim()) {
      parsed.searchParams.set("clientSlug", clientSlug.trim());
    }
    return parsed.toString();
  } catch {
    return fullUrl;
  }
}

export async function fetchCMSComponentsInBrowser(
  baseUrl: string,
  options: { clientSlug: string; isDevelopment: boolean }
): Promise<CMSComponent[]> {
  const url = buildCmsComponentsUrl(baseUrl, options.clientSlug, options.isDevelopment);
  if (!url) return [];
  const context: CacheContext = {
    clientSlug: options.clientSlug,
    isDevelopment: options.isDevelopment,
  };
  const scopedKey = buildScopedCacheKey(CMS_BROWSER_CACHE_KEY, context);
  const cacheKey = `${scopedKey}:${url}`;

  const cached = cmsDataCache.get(cacheKey);
  if (cached) {
    maybeRevalidateInBackground(cacheKey, url, context);
    return cached.data;
  }

  const fromStorage = getCache<CMSComponent[]>(CMS_BROWSER_CACHE_KEY, context);
  if (fromStorage && fromStorage.length > 0) {
    cmsDataCache.set(cacheKey, { data: fromStorage, ts: Date.now() });
    maybeRevalidateInBackground(cacheKey, url, context);
    return fromStorage;
  }

  const pending = cmsPendingRequests.get(cacheKey);
  if (pending) return pending;

  const request = fetchAndPersistCMS(cacheKey, url, context);
  cmsPendingRequests.set(cacheKey, request);
  return request;
}

function maybeRevalidateInBackground(
  cacheKey: string,
  url: string,
  context: CacheContext
): void {
  if (cmsBackgroundRevalidate.has(cacheKey)) return;
  const run = (async () => {
    await fetchAndPersistCMS(cacheKey, url, context);
  })().finally(() => {
    cmsBackgroundRevalidate.delete(cacheKey);
  });
  cmsBackgroundRevalidate.set(cacheKey, run);
}

async function fetchAndPersistCMS(
  cacheKey: string,
  url: string,
  context: CacheContext
): Promise<CMSComponent[]> {
  const currentPending = cmsPendingRequests.get(cacheKey);
  if (currentPending) return currentPending;
  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
      });
      const json = (await res.json()) as CMSComponentsResponse;
      if (!res.ok || !json.success || !json.data?.components) return [];
      const data = json.data.components.filter((c) => c.isActive && c.isVisible);
      if (typeof console !== "undefined") {
        console.log("[CMS] Componentes obtenidos:", {
          url,
          total: data.length,
          components: data,
        });
      }
      cmsDataCache.set(cacheKey, { data, ts: Date.now() });
      setCache(CMS_BROWSER_CACHE_KEY, data, context, CACHE_TTLS.cmsComponentsMs);
      return data;
    } catch {
      const fallback = cmsDataCache.get(cacheKey)?.data ?? getCache<CMSComponent[]>(CMS_BROWSER_CACHE_KEY, context);
      if (fallback && fallback.length > 0) return fallback;
      return [];
    } finally {
      clearTimeout(timeout);
      cmsPendingRequests.delete(cacheKey);
    }
  })();
  cmsPendingRequests.set(cacheKey, request);
  return request;
}

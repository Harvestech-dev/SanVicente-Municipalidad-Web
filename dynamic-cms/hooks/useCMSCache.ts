"use client";

import { useState, useEffect, useCallback } from "react";
import type { CMSComponent } from "../types/cms-components";

interface CMSCacheEntry {
  data: CMSComponent[];
  timestamp: number;
  expiresAt: number;
}

interface CMSCache {
  [key: string]: CMSCacheEntry;
}

const CACHE_TTL = 5 * 60 * 1000;
const CACHE_KEY = "cms_components_cache";

export function useCMSCache() {
  const [cache, setCache] = useState<CMSCache>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const valid: CMSCache = {};
        Object.entries(parsed).forEach(([key, entry]: [string, unknown]) => {
          const e = entry as CMSCacheEntry;
          if (e.expiresAt > now) valid[key] = e;
        });
        setCache(valid);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCache = useCallback((newCache: CMSCache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } catch {
      // ignore
    }
  }, []);

  const getFromCache = useCallback(
    (key: string): CMSComponent[] | null => {
      const entry = cache[key];
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        const next = { ...cache };
        delete next[key];
        setCache(next);
        saveCache(next);
        return null;
      }
      return entry.data;
    },
    [cache, saveCache]
  );

  const setCacheData = useCallback(
    (key: string, data: CMSComponent[]) => {
      const now = Date.now();
      const newCache = {
        ...cache,
        [key]: {
          data,
          timestamp: now,
          expiresAt: now + CACHE_TTL,
        },
      };
      setCache(newCache);
      saveCache(newCache);
    },
    [cache, saveCache]
  );

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const total = Object.keys(cache).length;
    const expired = Object.values(cache).filter((e) => e.expiresAt <= now).length;
    return {
      total,
      valid: total - expired,
      expired,
      hitRate: (total - expired) / Math.max(total, 1),
    };
  }, [cache]);

  return {
    getFromCache,
    setCacheData,
    getCacheStats,
    clearCache: useCallback(() => {
      setCache({});
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {
        // ignore
      }
    }, []),
  };
}

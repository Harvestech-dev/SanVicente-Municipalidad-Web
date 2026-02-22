"use client";

import { useState, useEffect, useCallback } from "react";
import { API_CONFIG, buildApiUrl } from "../config/api-config";
import type {
  CMSComponent,
  CMSComponentsResponse,
  CMSComponentFilters,
  UseCMSComponentsReturn,
} from "../types/cms-components";
import { useCMSCache } from "./useCMSCache";

declare global {
  interface Window {
    __cms_fetching?: Record<string, boolean>;
    __cms_components_data?: Record<string, CMSComponent[]>;
  }
}

export function useCMSComponents(
  filters?: CMSComponentFilters
): UseCMSComponentsReturn {
  const [components, setComponents] = useState<CMSComponent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getFromCache, setCacheData, getCacheStats } = useCMSCache();

  const fetchComponents = useCallback(async () => {
    const cacheKey = `cms_${JSON.stringify(filters ?? {})}`;

    try {
      setLoading(true);
      setError(null);

      const cached = getFromCache(cacheKey);
      if (cached) {
        setComponents(cached);
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined" && window.__cms_fetching?.[cacheKey]) {
        let attempts = 0;
        const maxAttempts = 50;
        const id = setInterval(() => {
          attempts++;
          const data =
            window.__cms_components_data?.[cacheKey] ?? getFromCache(cacheKey);
          if (data) {
            setComponents(data);
            setLoading(false);
            clearInterval(id);
            return;
          }
          if (!window.__cms_fetching?.[cacheKey] || attempts >= maxAttempts) {
            setLoading(false);
            clearInterval(id);
          }
        }, 100);
        return;
      }

      if (typeof window !== "undefined") {
        if (!window.__cms_fetching) window.__cms_fetching = {};
        window.__cms_fetching[cacheKey] = true;
      }

      const params: Record<string, string> = {};
      if (filters?.type) params.type = filters.type;
      if (filters?.page_filter) params.page_filter = filters.page_filter;
      if (filters?.status) params.status = filters.status;

      const url = buildApiUrl(API_CONFIG.ENDPOINTS.CMS_COMPONENTS, params);
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: CMSComponentsResponse = await response.json();

      if (data.success && data.data?.components) {
        const valid = data.data.components.filter(
          (c) => c.isActive && c.isVisible
        );
        if (typeof window !== "undefined") {
          if (!window.__cms_components_data) window.__cms_components_data = {};
          window.__cms_components_data[cacheKey] = valid;
        }
        setCacheData(cacheKey, valid);
        setComponents(valid);
      } else {
        throw new Error(data.message ?? "Error al cargar componentes CMS");
      }

      if (typeof window !== "undefined" && window.__cms_fetching) {
        delete window.__cms_fetching[cacheKey];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [filters, getFromCache, setCacheData]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const getComponentByType = useCallback(
    (type: string) => {
      if (!components) return null;
      return components.find((c) => c.type === type) ?? null;
    },
    [components]
  );

  const getComponentsByPage = useCallback(
    (page: string) => {
      if (!components) return [];
      return components.filter((c) => c.page === page);
    },
    [components]
  );

  return {
    components,
    loading,
    error,
    refetch: fetchComponents,
    getComponentByType,
    getComponentsByPage,
    cacheStats: getCacheStats(),
  };
}

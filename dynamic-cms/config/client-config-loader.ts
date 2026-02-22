import { cache } from "react";
import type { ClientConfig } from "./client-config";
import { safeValidateClientConfig } from "./client-config";
import { getDefaultConfig } from "./default-config";

async function _getClientConfigInternal(hostname: string): Promise<ClientConfig> {
  const cleanHostname = hostname.split(":")[0];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDev = process.env.NODE_ENV === "development";

  if (apiUrl) {
    let baseUrl: string;
    if (apiUrl.includes("/api/public/v1")) {
      baseUrl = `${apiUrl.replace(/\/$/, "")}/client-config`;
    } else {
      baseUrl = `${apiUrl.replace(/\/$/, "")}/api/public/v1/client-config`;
    }
    const fullUrl = `${baseUrl}?host=${encodeURIComponent(cleanHostname)}`;

    try {
      const response = await fetch(fullUrl, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(5000),
        headers: { "X-Original-Host": cleanHostname },
      });

      if (response.ok) {
        const rawData = await response.json();
        let data = rawData;
        if (
          rawData &&
          typeof rawData === "object" &&
          "data" in rawData &&
          rawData.data
        ) {
          data = rawData.data;
        }
        const validation = safeValidateClientConfig(data);
        if (validation.success && validation.data) return validation.data;
      }
    } catch (error) {
      if (isDev) {
        console.warn(
          "[ClientConfig] Error loading from API:",
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  // Opcional: en desarrollo, cargar desde JSON local. Ajustar ruta en el proyecto de destino.
  if (process.env.NODE_ENV === "development") {
    const clientSlug = process.env.NEXT_PUBLIC_CLIENT_SLUG;
    if (clientSlug) {
      try {
        const localConfig = await import(
          `@/public/data/client-configs/${clientSlug}.json`
        );
        const validation = safeValidateClientConfig(localConfig.default);
        if (validation.success && validation.data) return validation.data;
      } catch {
        // Archivo no existe o ruta distinta; usar getDefaultConfig()
      }
    }
  }

  return getDefaultConfig();
}

/**
 * Carga configuración de cliente (servidor). Usar en layout.tsx / generateMetadata.
 * Cache por request con React cache().
 */
export const getClientConfig = cache(_getClientConfigInternal);

/**
 * Carga configuración desde API (cliente). Fallback cuando el Server Component no pudo cargar.
 */
export async function loadClientConfigFromAPI(
  hostname: string
): Promise<ClientConfig | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return null;

    let baseUrl: string;
    if (apiUrl.includes("/api/public/v1")) {
      baseUrl = `${apiUrl.replace(/\/$/, "")}/client-config`;
    } else {
      baseUrl = `${apiUrl.replace(/\/$/, "")}/api/public/v1/client-config`;
    }
    const fullUrl = `${baseUrl}?host=${encodeURIComponent(hostname)}`;

    const response = await fetch(fullUrl, {
      cache: "no-store",
      headers: { "X-Original-Host": hostname },
    });

    if (response.ok) {
      const data = await response.json();
      const validation = safeValidateClientConfig(data);
      if (validation.success && validation.data) return validation.data;
    }
  } catch (error) {
    console.error("[ClientConfig] Failed to load from API (client):", error);
  }
  return null;
}

/**
 * Configuración de API para CMS y client-config.
 * El backend detecta el dominio por header Host o query ?host=.
 */

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

export const API_CONFIG = {
  BASE_URL: (() => {
    if (isProduction) {
      const prodApiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!prodApiUrl || prodApiUrl.includes("localhost")) {
        console.warn(
          "⚠️ NEXT_PUBLIC_API_URL con localhost en producción, usando fallback"
        );
        return "https://micms.website/api/public/v1";
      }
      return prodApiUrl;
    }
    if (isDevelopment) {
      return process.env.NEXT_PUBLIC_API_DEV ?? process.env.NEXT_PUBLIC_API_URL ?? "";
    }
    if (process.env.NEXT_PUBLIC_USE_PROXY === "true") {
      return "/api/public/v1";
    }
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  })(),

  ENDPOINTS: {
    FEATURED_PROPERTIES: "/properties/featured",
    PROPERTIES: "/properties",
    PROPERTY_DETAIL: "/properties",
    CMS_COMPONENTS: "/cms-components",
    CMS_COMPONENT_DETAIL: "/cms-components",
  },
} as const;

export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string>
): string {
  let baseUrl: string;
  if (typeof window !== "undefined") {
    if (API_CONFIG.BASE_URL.startsWith("/")) {
      baseUrl = `${window.location.origin}${API_CONFIG.BASE_URL}${endpoint}`;
    } else {
      baseUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
    }
  } else {
    const serverBase =
      process.env.NEXT_PUBLIC_API_URL ?? API_CONFIG.BASE_URL;
    if (API_CONFIG.BASE_URL.startsWith("/")) {
      baseUrl = `${serverBase}${API_CONFIG.BASE_URL}${endpoint}`;
    } else {
      baseUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
    }
  }
  const url = new URL(baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && String(value).trim() !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

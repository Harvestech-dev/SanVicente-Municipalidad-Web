import type { ClientConfig } from "./client-config";

export function getDefaultConfig(): ClientConfig {
  return {
    client: {
      slug: "default",
      name: "Cliente",
      plan: "basic",
      isActive: true,
    },
    branding: {
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b",
      accentColor: "#f59e0b",
    },
    features: {
      mapSearch: false,
      advancedFilters: false,
      favorites: false,
      savedSearches: false,
      propertyComparison: false,
      propertySharing: true,
      whatsappIntegration: true,
      contactForm: false,
      clientsSection: false,
      testimonials: false,
      blog: false,
      analytics: true,
      cookieConsent: true,
    },
    services: {
      enabled: true,
      ctaMode: "whatsapp",
      showPrices: false,
      showIcons: true,
    },
    seo: {
      titleTemplate: "%s | Sitio",
      defaultTitle: "Sitio",
      defaultDescription: "Descripción por defecto.",
      ogType: "website",
      robots: "index, follow",
      sitemapEnabled: true,
      twitterCard: "summary_large_image",
    },
  };
}

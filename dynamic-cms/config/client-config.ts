import { z } from "zod";

/**
 * Schema de configuración por cliente.
 * Fuente: API (client-config) o JSON local en desarrollo.
 */

export const ClientConfigSchema = z.object({
  client: z.object({
    slug: z.string().min(3).max(50),
    name: z.string().min(1),
    plan: z.enum(["basic", "custom", "premium", "enterprise"]).default("basic"),
    domains: z
      .array(
        z.object({
          domain: z.string(),
          subdomain: z.string().optional(),
          isPrimary: z.boolean().default(false),
        })
      )
      .optional(),
    isActive: z.boolean().default(true),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }),

  branding: z.object({
    logo: z.string().nullable().optional(),
    logoAlt: z.string().optional(),
    logoWidth: z.number().optional(),
    logoHeight: z.number().optional(),
    favicon: z.string().nullable().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    fontFamily: z.string().optional(),
    heroBackground: z.string().optional(),
    defaultBackground: z.string().optional(),
  }),

  features: z.object({
    mapSearch: z.boolean().default(false),
    advancedFilters: z.boolean().default(false),
    favorites: z.boolean().default(false),
    savedSearches: z.boolean().default(false),
    propertyComparison: z.boolean().default(false),
    propertySharing: z.boolean().default(true),
    whatsappIntegration: z.boolean().default(true),
    contactForm: z.boolean().default(false),
    clientsSection: z.boolean().default(false),
    testimonials: z.boolean().default(false),
    blog: z.boolean().default(false),
    analytics: z.boolean().default(true),
    cookieConsent: z.boolean().default(true),
  }),

  services: z.object({
    enabled: z.boolean().default(true),
    ctaMode: z.enum(["whatsapp", "form", "email"]).default("whatsapp"),
    showPrices: z.boolean().default(false),
    showIcons: z.boolean().default(true),
  }),

  seo: z.object({
    titleTemplate: z.string().optional(),
    defaultTitle: z.string().optional(),
    defaultDescription: z.string().optional(),
    defaultKeywords: z.array(z.string()).optional(),
    ogImage: z.string().nullable().optional(),
    ogType: z.enum(["website", "article", "business"]).default("website"),
    ogSiteName: z.string().optional(),
    ogUrl: z.string().url().optional(),
    twitterCard: z
      .enum(["summary", "summary_large_image", "app", "player"])
      .default("summary_large_image"),
    twitterSite: z.string().nullable().optional(),
    twitterCreator: z.string().nullable().optional(),
    canonicalUrl: z.string().url().optional(),
    robots: z.string().default("index, follow"),
    sitemapEnabled: z.boolean().default(true),
    analytics: z
      .object({
        googleAnalytics: z.string().nullable().optional(),
        googleTagManager: z.string().nullable().optional(),
        facebookPixel: z.string().nullable().optional(),
      })
      .optional(),
  }),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

export function validateClientConfig(data: unknown): ClientConfig {
  return ClientConfigSchema.parse(data);
}

export function safeValidateClientConfig(data: unknown): {
  success: boolean;
  data?: ClientConfig;
  error?: z.ZodError;
} {
  const result = ClientConfigSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}

import { z } from "zod";

/**
 * Schema de configuración por cliente (opcional).
 * Si la API no está disponible, se usa sitio.json como fallback.
 */

export const ClientConfigSchema = z.object({
  client: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    plan: z.enum(["basic", "custom", "premium", "enterprise"]).optional().default("basic"),
    isActive: z.boolean().optional().default(true),
  }),

  branding: z.object({
    logo: z.string().nullable().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }).optional(),

  seo: z.object({
    defaultTitle: z.string().optional(),
    defaultDescription: z.string().optional(),
  }).optional(),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

export function safeValidateClientConfig(data: unknown): {
  success: boolean;
  data?: ClientConfig;
  error?: z.ZodError;
} {
  const result = ClientConfigSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}

/**
 * Defaults de _configuracion por tipo de componente.
 * Compatible con el manual y con lo que devuelve la API.
 */

export interface ComponentConfiguration {
  variant?: string;
  layout?: string;
  parallax?: boolean;
  [key: string]: unknown;
}

const DEFAULTS: Record<string, ComponentConfiguration> = {
  home_hero: { variant: 'default', layout: 'default' },
  home_carousel_lineas: { variant: 'default' },
  home_banner: { variant: 'default', parallax: false },
  home_productos_destacados: { variant: 'default' },
  custom: { variant: 'default', layout: 'default' },
};

export function getDefaultConfiguration(type: string): ComponentConfiguration {
  return { ...(DEFAULTS[type] ?? DEFAULTS.custom) };
}

/**
 * Asegura que data tenga _configuracion con valores por defecto según el tipo.
 */
export function ensureConfiguration(
  data: Record<string, unknown> | unknown,
  type: string
): Record<string, unknown> {
  const obj = (data && typeof data === 'object' && !Array.isArray(data)) ? (data as Record<string, unknown>) : {};
  const defaults = getDefaultConfiguration(type);
  const current = (obj._configuracion as ComponentConfiguration) ?? {};
  const merged: ComponentConfiguration = {
    ...defaults,
    ...(typeof current === 'object' && current !== null ? current : {}),
  };
  return {
    ...obj,
    _configuracion: merged,
  };
}

/**
 * Validación y sanitización de _configuracion por tipo.
 * Compatible con el manual (variant, layout, parallax, etc.).
 */

import type { ComponentConfiguration } from './component-defaults';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const ALLOWED_KEYS: Record<string, string[]> = {
  home_hero: ['variant', 'layout'],
  home_carousel_lineas: ['variant'],
  home_banner: ['variant', 'parallax'],
  home_productos_destacados: ['variant'],
  custom: ['variant', 'layout', 'parallax'],
};

export function validateComponentConfiguration(
  config: ComponentConfiguration,
  type: string
): ValidationResult {
  const errors: string[] = [];
  const allowed = ALLOWED_KEYS[type] ?? ALLOWED_KEYS.custom;

  if (!config || typeof config !== 'object') {
    return { isValid: false, errors: ['_configuracion debe ser un objeto'] };
  }

  for (const key of Object.keys(config)) {
    if (!allowed.includes(key)) {
      errors.push(`Clave no permitida en _configuracion para ${type}: ${key}`);
    }
  }

  if (config.parallax !== undefined && typeof config.parallax !== 'boolean') {
    errors.push('_configuracion.parallax debe ser true o false');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Devuelve solo las claves permitidas para el tipo.
 */
export function sanitizeConfiguration(
  config: ComponentConfiguration,
  type: string
): ComponentConfiguration {
  const allowed = ALLOWED_KEYS[type] ?? ALLOWED_KEYS.custom;
  const out: ComponentConfiguration = {};
  for (const key of allowed) {
    if (config[key] !== undefined) {
      out[key] = config[key];
    }
  }
  return out;
}

/**
 * Validador de payload para componentes CMS (crear / actualizar).
 * Mismas reglas que aplica el backend en POST /api/cms-components y PUT /api/cms-components/[id].
 * Usar en el front antes de enviar el JSON para tener los mismos parámetros y mensajes de error.
 */

import { ensureConfiguration } from './component-defaults';
import type { ComponentConfiguration } from './component-defaults';
import {
  validateComponentConfiguration,
  sanitizeConfiguration,
} from './component-validators';

/** Campos requeridos para crear un componente (POST) */
export const REQUIRED_FIELDS_CREATE = ['name', 'key', 'page', 'componentPath', 'data'] as const;

/** Formato permitido para key: solo minúsculas, números y guión bajo */
export const KEY_REGEX = /^[a-z0-9_]+$/;

export interface ComponentCreatePayload {
  name?: string;
  key?: string;
  page?: string;
  componentPath?: string;
  type?: string;
  data?: Record<string, unknown>;
  description?: string;
  thumbnail?: unknown;
  mediaDependencies?: unknown[];
  isVisible?: boolean;
  isActive?: boolean;
  category?: string;
  clientId?: string;
  [key: string]: unknown;
}

export interface ComponentUpdatePayload {
  name?: string;
  key?: string;
  page?: string;
  componentPath?: string;
  type?: string;
  data?: Record<string, unknown>;
  description?: string;
  thumbnail?: unknown;
  mediaDependencies?: unknown[];
  isVisible?: boolean;
  isActive?: boolean;
  category?: string;
  [key: string]: unknown;
}

export interface PayloadValidationResult {
  isValid: boolean;
  errors: string[];
  /** Solo si isValid y se pidió sanitize: payload listo para enviar */
  sanitizedPayload?: ComponentCreatePayload | ComponentUpdatePayload;
  /** Solo si isValid y se pidió sanitize: data con _configuracion aplicada y sanitizada */
  sanitizedData?: Record<string, unknown>;
}

/**
 * Valida el formato del key (misma regla que el formulario de componentes).
 */
export function validateKey(key: unknown): { valid: boolean; error?: string } {
  if (key === undefined || key === null) {
    return { valid: false, error: 'La clave es requerida' };
  }
  const str = String(key).trim();
  if (!str) {
    return { valid: false, error: 'La clave es requerida' };
  }
  if (!KEY_REGEX.test(str)) {
    return { valid: false, error: 'La clave solo puede contener letras minúsculas, números y guiones bajos' };
  }
  return { valid: true };
}

/**
 * Valida y opcionalmente sanitiza data (objeto data del componente).
 * Aplica ensureConfiguration y validateComponentConfiguration; si sanitize=true, también sanitizeConfiguration.
 */
export function validateComponentData(
  data: Record<string, unknown> | undefined | null,
  componentType: string,
  options?: { sanitize?: boolean }
): { isValid: boolean; errors: string[]; sanitizedData?: Record<string, unknown> } {
  const errors: string[] = [];
  const type = componentType || 'custom';

  const dataObj = (data ?? {}) as Record<string, unknown>;
  const withDefaults = ensureConfiguration(dataObj, type) as Record<string, unknown>;

  if (withDefaults._configuracion) {
    const configResult = validateComponentConfiguration(
      withDefaults._configuracion as ComponentConfiguration,
      type
    );
    if (!configResult.isValid) {
      errors.push(...configResult.errors);
    }
  }

  let sanitizedData: Record<string, unknown> | undefined;
  if (options?.sanitize && errors.length === 0 && withDefaults._configuracion) {
    sanitizedData = {
      ...withDefaults,
      _configuracion: sanitizeConfiguration(
        withDefaults._configuracion as ComponentConfiguration,
        type
      )
    };
  } else if (errors.length === 0) {
    sanitizedData = withDefaults;
  }

  return {
    isValid: errors.length === 0,
    errors,
    ...(sanitizedData && { sanitizedData })
  };
}

/**
 * Valida el payload completo para crear un componente (POST).
 * Mismos requisitos que el backend: name, key, page, componentPath, data.
 * Opcionalmente valida formato de key y _configuracion dentro de data.
 */
export function validateComponentCreatePayload(
  body: ComponentCreatePayload,
  options?: { validateKeyFormat?: boolean; sanitize?: boolean }
): PayloadValidationResult {
  const errors: string[] = [];
  const validateKeyFormat = options?.validateKeyFormat !== false;
  const sanitize = options?.sanitize === true;

  // Campos requeridos
  for (const field of REQUIRED_FIELDS_CREATE) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`Campo requerido faltante: ${field}`);
    }
  }

  // Key: formato (opcional, por defecto sí)
  if (validateKeyFormat && body.key !== undefined && body.key !== null) {
    const keyResult = validateKey(body.key);
    if (!keyResult.valid) {
      errors.push(keyResult.error!);
    }
  }

  // data: tipo y _configuracion
  const componentType = (body.type as string) || 'custom';
  if (body.data !== undefined && body.data !== null && typeof body.data === 'object') {
    const dataResult = validateComponentData(body.data as Record<string, unknown>, componentType, { sanitize });
    if (!dataResult.isValid) {
      errors.push(...dataResult.errors);
    }

    if (sanitize && dataResult.sanitizedData && errors.length === 0) {
      const sanitizedPayload: ComponentCreatePayload = {
        ...body,
        data: dataResult.sanitizedData
      };
      return {
        isValid: true,
        errors: [],
        sanitizedPayload,
        sanitizedData: dataResult.sanitizedData
      };
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida el payload para actualizar un componente (PUT).
 * Si viene data, se valida y opcionalmente se sanitiza igual que en create.
 */
export function validateComponentUpdatePayload(
  body: ComponentUpdatePayload,
  componentType: string,
  options?: { sanitize?: boolean }
): PayloadValidationResult {
  const errors: string[] = [];
  const sanitize = options?.sanitize === true;
  const type = componentType || 'custom';

  if (body.key !== undefined && body.key !== null) {
    const keyResult = validateKey(body.key);
    if (!keyResult.valid) {
      errors.push(keyResult.error!);
    }
  }

  if (body.data !== undefined && body.data !== null && typeof body.data === 'object') {
    const dataResult = validateComponentData(body.data as Record<string, unknown>, type, { sanitize });
    if (!dataResult.isValid) {
      errors.push(...dataResult.errors);
    }

    if (sanitize && dataResult.sanitizedData && errors.length === 0) {
      return {
        isValid: true,
        errors: [],
        sanitizedPayload: { ...body, data: dataResult.sanitizedData },
        sanitizedData: dataResult.sanitizedData
      };
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Devuelve el objeto data listo para enviar (con _configuracion por defecto y sanitizada).
 * Útil para normalizar antes de PUT cuando solo se edita data.
 */
export function prepareComponentDataForApi(
  data: Record<string, unknown>,
  componentType: string
): Record<string, unknown> {
  const type = componentType || 'custom';
  const withDefaults = ensureConfiguration(data, type) as Record<string, unknown>;
  const out = { ...withDefaults };
  if (out._configuracion) {
    out._configuracion = sanitizeConfiguration(
      out._configuracion as ComponentConfiguration,
      type
    );
  }
  return out;
}

// Re-exportar para que el front tenga acceso a los mismos defaults y schemas
export { getDefaultConfiguration, ensureConfiguration } from './component-defaults';
export {
  validateComponentConfiguration,
  sanitizeConfiguration,
  type ValidationResult
} from './component-validators';

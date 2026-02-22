/**
 * Hook de configuración de componente.
 * La config real viene del CMS (data._configuracion) y se pasa como props desde DynamicLayout.
 * Este hook solo expone defaults como fallback.
 */

export function useComponentConfig<T extends Record<string, unknown>>(
  _componentName: string,
  defaults: T
): T {
  return defaults;
}

export function useComponentConfigValue<T>(
  _componentName: string,
  _key: string,
  defaultValue: T
): T {
  return defaultValue;
}

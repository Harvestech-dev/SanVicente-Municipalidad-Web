/**
 * Motor de layout dinámico y componentes desde CMS.
 * Copiar esta carpeta al proyecto de destino y seguir INSTRUCTIVO_IA.md.
 */

// Types
export type {
  CMSComponent,
  CMSComponentsResponse,
  CMSComponentFilters,
  UseCMSComponentsReturn,
  UseCMSComponentReturn,
} from "./types/cms-components";

// Config
export { API_CONFIG, buildApiUrl } from "./config/api-config";
export type { ClientConfig } from "./config/client-config";
export {
  ClientConfigSchema,
  validateClientConfig,
  safeValidateClientConfig,
} from "./config/client-config";
export { getDefaultConfig } from "./config/default-config";
export {
  getClientConfig,
  loadClientConfigFromAPI,
} from "./config/client-config-loader";

// Contexts
export {
  ClientConfigProvider,
  useClientConfig,
} from "./contexts/ClientConfigProvider";

// Hooks
export { useCMSCache } from "./hooks/useCMSCache";
export { useCMSComponents } from "./hooks/useCMSComponents";
export { usePageCMS } from "./hooks/usePageCMS";
export {
  useComponentConfig,
  useComponentConfigValue,
} from "./hooks/useComponentConfig";

// Components
export {
  DynamicLayout,
  type DynamicLayoutProps,
  type DynamicLayoutComponentProps,
} from "./components/DynamicLayout";

/**
 * Tipos para componentes CMS (API).
 * Contrato entre backend y frontend para layout dinámico.
 */

export interface CMSComponent {
  _id: string;
  name: string;
  type: string;
  page: string;
  data: Record<string, any>;
  content?: string;
  status: "published" | "draft" | "archived";
  isActive: boolean;
  isVisible: boolean;
  thumbnail?: { url: string; alt: string };
  description?: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
}

export interface CMSComponentsResponse {
  success: boolean;
  data: {
    components: CMSComponent[];
    client: { id: string; name: string; slug: string };
  };
  message: string;
}

export interface CMSComponentResponse {
  success: boolean;
  data: {
    component: CMSComponent;
    client: { id: string; name: string; slug: string };
  };
  message: string;
}

export interface CMSComponentFilters {
  type?: string;
  page_filter?: string;
  status?: string;
}

export interface UseCMSComponentsReturn {
  components: CMSComponent[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getComponentByType: (type: string) => CMSComponent | null;
  getComponentsByPage: (page: string) => CMSComponent[];
  cacheStats: {
    total: number;
    valid: number;
    expired: number;
    hitRate: number;
  };
}

export interface UseCMSComponentReturn {
  component: CMSComponent | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Tipos para componentes CMS (API).
 * Contrato entre backend y frontend para layout dinámico.
 */

export interface CMSComponent {
  _id: string;
  name: string;
  type: string;
  page: string;
  data: Record<string, unknown>;
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
  message?: string;
}

export interface CMSComponentFilters {
  type?: string;
  page_filter?: string;
  status?: string;
}

/**
 * Tipos para API de Licitaciones (biddings).
 * Ref: docs/LICITACIONES_API_FRONTEND.md
 */

export type EffectiveStatus =
  | "upcoming"
  | "open"
  | "in_evaluation"
  | "closed"
  | "awarded"
  | "deserted"
  | "cancelled"
  | "suspended";

export interface BiddingDates {
  publication_date: string | null;
  bidding_start_date: string | null;
  bidding_end_date: string | null;
  opening_date: string | null;
  award_date: string | null;
}

export interface BiddingAttachment {
  type?: string;
  title?: string;
  label?: string;
  file_url?: string;
  external_url?: string | null;
  media_id?: string;
  attachment_type?: "url" | "image" | "file";
  is_pliego?: boolean;
}

export interface BiddingWinner {
  company_name?: string;
  cuit?: string;
  award_amount?: number;
}

export interface BiddingItem {
  id: string;
  title: string;
  subtitle?: string;
  bidding_number?: string;
  expediente_number?: string;
  procedure_type?: string;
  object_of_contract?: string;
  area?: string;
  budget_official?: number;
  currency?: string;
  location?: string;
  dates?: BiddingDates;
  opening_location?: string;
  consultation_contact?: string;
  winner?: BiddingWinner | null;
  attachments?: BiddingAttachment[];
  bidding_status?: string;
  effective_status?: EffectiveStatus;
}

export interface BiddingsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BiddingsResponse {
  success: boolean;
  data?: {
    items: BiddingItem[];
    pagination: BiddingsPagination;
  };
}

/** Respuesta de GET /biddings/:id (detalle de una licitación) */
export interface BiddingDetailResponse {
  success: boolean;
  data?: BiddingItem;
}

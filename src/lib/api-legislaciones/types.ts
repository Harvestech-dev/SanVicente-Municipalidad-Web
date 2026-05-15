/**
 * Tipos para API de Legislaciones.
 * Ref: docs/legislaciones/contrato-api.md
 */

export type LegislationType = "ordinance" | "decree" | "boletin";
export type LegislationStatus =
  | "vigente"
  | "modificada"
  | "derogada"
  | "vetada";

export interface LegislationFile {
  url: string;
  size: number;
  mimeType: string;
  originalFilename: string;
  pages?: number;
}

export interface LegislationRelation {
  id: string;
  relation: "modifica" | "deroga" | "complementa" | "referencia";
}

export interface LegislationListItem {
  _id: string;
  type: LegislationType;
  number: number;
  numberPadded: string;
  year: number;
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
  area?: string;
  status: LegislationStatus;
  signedAt?: string;
  publishedAt?: string;
  file: LegislationFile;
  createdAt: string;
  updatedAt: string;
}

export interface LegislationDetail extends LegislationListItem {
  body?: string;
  relatedLegislations?: LegislationRelation[];
}

export interface Pagination {
  page: number;
  pages: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListResponse {
  success: true;
  data: LegislationListItem[];
  pagination: Pagination;
}

export interface DetailResponse {
  success: true;
  data: LegislationDetail;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export type SortBy =
  | "year"
  | "number"
  | "publishedAt"
  | "createdAt"
  | "title";
export type SortOrder = "asc" | "desc";

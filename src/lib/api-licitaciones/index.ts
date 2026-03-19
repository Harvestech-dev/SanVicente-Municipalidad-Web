export { API_LICITACIONES_CONFIG } from "./config";
export { fetchBiddings, fetchBiddingById } from "./fetch";
export {
  fetchBiddingsInBrowser,
  fetchBiddingByIdInBrowser,
} from "./fetch-browser";
export type { FetchBiddingsParams } from "./fetch-browser";
export type {
  BiddingItem,
  BiddingsResponse,
  BiddingDetailResponse,
  EffectiveStatus,
  BiddingAttachment,
  BiddingDates,
  BiddingWinner,
} from "./types";

/**
 * Tipos extraídos de `slider_banner_files/sections.ts` (solo lo necesario
 * para el carrusel de promociones).
 */

/** Carrusel promociones – slide solo imagen (imagen + URL, todo el slide es link) */
export interface PromoSlideSoloImagen {
  tipo_slide: "solo_imagen";
  imageSrc: string;
  imageAlt: string;
  /** Si existe, todo el slide es clickeable hacia esta URL */
  url?: string;
  linkLabel?: string;
}

/** Carrusel promociones – slide imagen con texto (overlay con título, subtítulo, detalle, botón) */
export interface PromoSlideImagenConTexto {
  tipo_slide: "imagen_con_texto";
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  subtitle?: string;
  detail?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  /** Si true, usa colores/estilo destilería; si false, estilo bodega */
  esDestileria?: boolean;
}

export type PromoCarouselSlide = PromoSlideSoloImagen | PromoSlideImagenConTexto;

export interface PromoCarouselConfig {
  autoplay?: boolean;
  intervalo_segundos?: number;
}

export interface PromoCarouselData {
  slides: PromoCarouselSlide[];
  config: PromoCarouselConfig;
}


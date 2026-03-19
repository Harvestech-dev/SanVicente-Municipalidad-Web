/**
 * Tipos por sección. Mismo contrato para datos JSON (fase actual) y API del CMS (fase producción).
 */

export type Locale = "es" | "en";

/** Welcome (bienvenida / verificación de edad) */
export interface WelcomeData {
  hero: {
    imageSrc?: string;
    imageAlt: string;
  };
  logoImage?: string;
  logoAlt?: string;
  title: string;
  message: string;
  legalNotice: string;
  buttons: {
    confirm: string;
    confirmAriaLabel: string;
    decline: string;
    declineAriaLabel: string;
    declineUrl: string;
  };
}

/** Home - Hero (carrusel de imágenes + overlay para texto) */
export interface HomeHeroSlide {
  imageSrc: string;
  imageAlt: string;
}

export interface HomeHeroData {
  slides: HomeHeroSlide[];
  img_logo?: string;
  logoAlt?: string;
  title: string;
  subtitle: string;
}

/** Home - Carousel líneas (6 líneas) */
export interface LineaItem {
  id: string;
  name: string;
  slug: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
}

export interface HomeCarouselLineasData {
  sectionTitle: string;
  lineas: LineaItem[];
}

/** Home - Banner genérico (contrato interno; los JSON pueden venir en formato CMS y mapearse) */
export interface HomeBannerData {
  imageSrc: string;
  imageAlt: string;
  title?: string;
  href?: string;
  /** Si true, se aplica efecto parallax; si false o ausente, versión original. */
  config?: { parallax?: boolean };
}

/** Home - Productos destacados */
export interface ProductoDestacado {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
}

export interface HomeProductosDestacadosData {
  sectionTitle: string;
  products: ProductoDestacado[];
}

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
  /** Si true, usa colores y tipografía Magic Stone (destilería); si false, Palo Alto (bodega). */
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

/** Home - Contacto */
export interface HomeContactoData {
  sectionTitle: string;
  address: string;
  addressUrl?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  socialLinks: { label: string; href: string; ariaLabel: string }[];
}

export interface HomeData {
  hero: HomeHeroData;
  carouselLineas: HomeCarouselLineasData;
  banner1: HomeBannerData;
  banner2: HomeBannerData;
  productosDestacados: HomeProductosDestacadosData;
  contacto: HomeContactoData;
}

/** Header: logo y navegación (compartido por todas las páginas) */
export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export interface HeaderData {
  logo: {
    text: string;
    imageSrc?: string;
    imageAlt?: string;
    href: string;
  };
  nav: NavItem[];
  shop: { label: string; href: string; external?: boolean };
  languages: { code: Locale; label: string }[];
}

/** Página Contacto – formulario */
export interface ContactFormData {
  sectionTitle: string;
  sectionDescription?: string;
  labels: {
    name: string;
    email: string;
    phone: string;
    message: string;
    /** Texto completo del consentimiento (si no se usan privacyPrefix/Link/suffix) */
    privacy: string;
    /** Si están definidos, se muestra: prefix + enlace(privacyLinkText) + suffix */
    privacyPrefix?: string;
    privacyLinkText?: string;
    privacySuffix?: string;
    submit: string;
  };
  successMessage: string;
  errorMessage: string;
}

/** Página Contacto – bloque de datos (Bodega o Destilería) */
export interface ContactBlockData {
  title: string;
  facebookUrl?: string;
  facebookValue?: string;
  instagramUrl?: string;
  instagramValue?: string;
  address?: string;
  addressUrl?: string;
}

/** Política de Privacidad – sección */
export interface PrivacyPolicySection {
  id: string;
  title?: string;
  content: string;
}

/** Página Política de Privacidad */
export interface PrivacyPolicyData {
  title: string;
  lastUpdated: string;
  companyName: string;
  address: string;
  contactEmail: string;
  metaDescription: string;
  sections: PrivacyPolicySection[];
}

/** Página Contacto – datos completos */
export interface ContactPageData {
  form: ContactFormData;
  bodega: ContactBlockData;
  destileria: ContactBlockData;
  /** Si true, los datos de contacto van en una card flotante (glass + sombra) que se ajusta al contenido; si false, ocupan toda la mitad izquierda */
  contactCardFloating?: boolean;
  /** Imagen de fondo de la sección split (parallax opcional) */
  backgroundImage?: string;
  backgroundImageAlt?: string;
  parallax?: boolean;
  mapTitle: string;
  mapLinkLabel: string;
  mapEmbedUrl?: string;
  mapLinkUrl: string;
}

/** Bodega - Quiénes somos (bloque de texto + opcionales: imagen izq, fondo, mostrar equipo) */
export interface BodegaQuienesSomosData {
  title: string;
  paragraphs: string[];
  highlight?: string;
  imageLeft?: { imageSrc: string; imageAlt?: string };
  backgroundImage?: { imageSrc: string; imageAlt?: string };
  showEquipo?: boolean;
}

/** Bodega - Ficha de miembro del equipo */
export interface BodegaEquipoMember {
  id: string;
  name: string;
  role?: string;
  imageSrc?: string;
  imageAlt?: string;
  bio?: string;
}

/** Bodega - Equipo (lista de fichas) */
export interface BodegaEquipoData {
  sectionTitle: string;
  members: BodegaEquipoMember[];
  /** "top" = avatar arriba de la info (por defecto), "left" = avatar a la izquierda */
  avatarLayout?: "top" | "left";
}

/** Bodega - Finca (una finca); compatible con DestileriaStorySplit (title, paragraphs, imageSrc, imageAlt, imagePosition) */
export interface BodegaFincaData {
  /** Identificador estable para keys (ej. "finca-alto-ugarteche") */
  id?: string;
  title: string;
  location?: string;
  description?: string;
  features?: { label: string; value: string }[];
  imageSrc?: string;
  imageAlt?: string;
  imageSrc2?: string;
  imageAlt2?: string;
  /** Párrafos narrativos; se muestra con StorySplit. Origen: finca_1_txt / finca_2_txt (array en CMS). */
  paragraphs: string[];
  /** Lado de la imagen en StorySplit: "right" = texto izq (default), "left" = imagen izq */
  imagePosition?: "left" | "right";
  /** Imagen de fondo opcional para la sección (con overlay oscuro) */
  backgroundImage?: { imageSrc: string; imageAlt?: string };
  /** Si true, el fondo usa efecto parallax (background-attachment: fixed) */
  parallax?: boolean;
}

/** Bodega - Sección "Nuestras Fincas" (título + fondo opcional) */
export interface BodegaFincasSectionData {
  title: string;
  backgroundImage?: { imageSrc: string; imageAlt?: string };
}

/** Bodega - página completa */
export interface BodegaData {
  quienesSomos: BodegaQuienesSomosData;
  equipo: BodegaEquipoData;
  fincasSection: BodegaFincasSectionData;
  finca1: BodegaFincaData;
  finca2: BodegaFincaData;
}

/** Footer (pie de página) */
export interface FooterData {
  logo: {
    text: string;
    imageSrc?: string;
    imageAlt?: string;
    href: string;
  };
  address: string;
  lista_contacto: { label: string; href: string; ariaLabel: string; value?: string }[];
  lista_contacto_destileria: { label: string; href: string; ariaLabel: string; value?: string }[];
  addressUrl?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  socialLinks: { label: string; href: string; ariaLabel: string; value?: string }[];
  disclaimer: string;
  developedBy: string;
  developedByUrl?: string;
}

/** Destilería Magic Stone – Hero */
export interface DestileriaHeroData {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  backgroundImage?: string;
  logoImage?: string;
  /** Posición vertical del contenido (logo, título, subtítulo). Default: "top" */
  position?: "top" | "center" | "bottom";
}

/** Destilería – Story split (texto + imagen); imagePosition define lado de la imagen en desktop */
export interface DestileriaStorySplitData {
  /** Opcional: si no se pasa, no se muestra encabezado (útil para segundo bloque de una misma sección) */
  title?: string;
  /** Párrafos de texto (cada ítem = un <p>) */
  paragraphs: string[];
  imageSrc?: string;
  imageAlt?: string;
  /** "right" = texto izq, imagen der (default); "left" = imagen izq, texto der */
  imagePosition?: "left" | "right";
  /** Si true, usa colores Palo Alto (text-palo-alto-secondary) en título; si false, Magic Stone (destilería). */
  paloalto?: boolean;
}

/** Destilería – Text highlight (título, párrafo, cita opcional); fondo y alineación opcionales */
export interface DestileriaTextHighlightData {
  title?: string;
  body: string;
  highlightQuote?: string;
  /** Imagen de fondo a ancho completo; si parallax es true se usa background-attachment: fixed */
  backgroundImage?: string;
  backgroundImageAlt?: string;
  parallax?: boolean;
  /** Alineación del texto (default: left) */
  textAlign?: "left" | "center" | "right";
}


/** Destilería – Mission / Vision / Values */
export interface DestileriaValueItem {
  key: string;
  title: string;
  description: string;
}

export interface DestileriaMissionVisionData {
  mission: string;
  vision: string;
  values: DestileriaValueItem[];
  /** Etiquetas (i18n) */
  tabLabels?: { mission: string; vision: string; values: string };
  /** "tabs" = pestañas fondo oscuro; "blocks" = bloques separados fondo claro, alineado al hero */
  layout?: "tabs" | "blocks";
}

/** Destilería – Promise block */
export interface DestileriaPromiseData {
  title: string;
  subtitle?: string;
  lines: string[];
  /** Imagen de fondo; si se define, se muestra detrás del contenido con overlay. */
  backgroundImage?: string;
  backgroundImageAlt?: string;
  /** Si true, la imagen de fondo usa efecto parallax (background-attachment: fixed). */
  parallax?: boolean;
}

/** Destilería – Manifesto block */
export interface DestileriaManifestoImage {
  imageSrc: string;
  imageAlt: string;
}

export interface DestileriaManifestoData {
  lines: string[];
  /** Opcional: imágenes para carousel vertical con controles tipo bullet */
  images?: DestileriaManifestoImage[];
}

/** Destilería – página completa */
export interface DestileriaData {
  hero: DestileriaHeroData;
  /** Varios bloques texto+imagen; cada uno puede tener imagen a izquierda o derecha */
  storySplits: DestileriaStorySplitData[];
  /** Varios bloques de texto destacado (sustituye al antiguo momentsGrid) */
  textHighlights: DestileriaTextHighlightData[];
  /** Bloque de texto destacado para la promesa (DestileriaTextHighlight) */
  textPromises: DestileriaTextHighlightData;
  missionVision: DestileriaMissionVisionData;
  /** @deprecated Usar un ítem en textHighlights en su lugar */
  promise?: DestileriaPromiseData;
  manifesto: DestileriaManifestoData;
}

import { useEffect, useState, useRef } from "react";
import { fetchCMSComponentsInBrowser } from "../../lib/cms/fetch-cms-browser";
import { mergeInicioPageComponents } from "../../lib/cms/merge-inicio-page";
import type { CMSComponent } from "../../lib/cms/types";
import { SocialIcon } from "../SocialIcon";
import {
  getProgramSlug,
  saveProgramListCache,
  sortProgramList,
} from "../../lib/programas-utils";
import { normalizePageUrl } from "../../lib/normalize-page-url";
import { fetchNoticiasAdaptadas, fetchEventosAdaptados } from "../../lib/api-vecino";
import "./cms-inicio-client.css";
import { PromoCarousel } from "../../../slider_banner_files/PromoCarousel";
import type { PromoCarouselData, PromoCarouselSlide } from "../../../slider_banner_files/promo-carousel-types";

interface Contacto {
  icon_contacto?: string;
  txt_label?: string;
  link_destino?: string;
  txt_valor?: string;
}

interface Telefono {
  _orden?: number;
  txt_nombre: string;
  txt_numero?: string;
  _icon?: string;
  lista_contactos?: Contacto[];
  lista_contacto?: Contacto[];
  boolean_favorito?: boolean;
}

function getPrimerContacto(t: Telefono): { href: string; valor: string; icon?: string } {
  const contactos = (t.lista_contactos ?? t.lista_contacto ?? []) as Contacto[];
  const conLink = contactos.find((c) => c.link_destino && c.link_destino.trim() !== "");
  if (conLink?.link_destino) {
    const dest = conLink.link_destino;
    const href = dest.startsWith("/") ? normalizePageUrl(dest) : dest;
    return {
      href: href || dest,
      valor: conLink.txt_valor ?? "",
      icon: conLink.icon_contacto,
    };
  }
  const primer = contactos[0];
  if (primer?.txt_valor) {
    const num = (primer.txt_valor ?? "").replace(/\D/g, "");
    return { href: `tel:${num}`, valor: primer.txt_valor, icon: primer.icon_contacto };
  }
  const num = (t.txt_numero ?? "").replace(/\D/g, "");
  return { href: `tel:${num}`, valor: t.txt_numero ?? "" };
}

interface Programa {
  _orden?: number;
  _id?: string;
  boolean_featured?: boolean;
  txt_titulo?: string;
  txt_nombre?: string;
  txt_subtitulo?: string;
  txt_descripcion?: string;
  lista_descripcion?: Array<{ txt_descripcion?: string }>;
  img_logo?: string;
  img_imagen?: string;
  gallery_imagenes?: Array<{ url?: string; img_fondo?: string }>;
  _sigla?: string;
}

function getProgramaNombre(p: Programa): string {
  return p.txt_titulo ?? p.txt_nombre ?? "";
}
function getProgramaDesc(p: Programa): string {
  if (p.txt_subtitulo) return p.txt_subtitulo;
  if (p.txt_descripcion) return p.txt_descripcion;
  return p.lista_descripcion?.[0]?.txt_descripcion ?? "";
}
const MUNI_ISOLOGO_HOME = "/Isologo_muni.png";

/** Home: logo del programa; si no hay, foto; si no hay, isologo municipal. */
function getProgramaHomeVisual(p: Programa): { src: string; mode: "logo" | "photo" | "muni" } {
  const logo = (p.img_logo ?? "").trim();
  if (logo) return { src: logo, mode: "logo" };
  const raw = p as Record<string, unknown>;
  const im = raw.img_imagen ?? p.img_imagen;
  if (typeof im === "string" && im.trim() !== "") return { src: im.trim(), mode: "photo" };
  const g = p.gallery_imagenes?.[0];
  const u = g?.url ?? g?.img_fondo;
  if (u && String(u).trim() !== "") return { src: String(u).trim(), mode: "photo" };
  return { src: MUNI_ISOLOGO_HOME, mode: "muni" };
}

interface Props {
  clientSlug: string;
  isDevelopment: boolean;
}

function mapBannerPromocionalToPromoCarouselData(d: Record<string, unknown>): PromoCarouselData | null {
  const maybeSlides =
    (d.slides as unknown) ??
    (d as unknown as { lista_slides?: unknown }).lista_slides ??
    (d as unknown as { listaSlides?: unknown }).listaSlides ??
    (d as unknown as { data?: { slides?: unknown } }).data?.slides;

  const slidesRaw = Array.isArray(maybeSlides) ? (maybeSlides as unknown[]) : [];

  const safeString = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return "";
    return String(v);
  };

  const mapSlide = (raw: unknown): PromoCarouselSlide => {
    const r = raw as Record<string, unknown>;
    const tipoRaw =
      safeString(r.tipo_slide) ||
      safeString((r as unknown as { tipoSlide?: unknown }).tipoSlide) ||
      safeString((r as unknown as { tipo?: unknown }).tipo) ||
      "solo_imagen";

    const imageSrcCandidate =
      (safeString(r.imageSrc) ||
        safeString(r.img_principal) ||
        safeString(r.img_fondo) ||
        safeString((r as unknown as { image_url?: unknown }).image_url) ||
        safeString((r as unknown as { imageSrcUrl?: unknown }).imageSrcUrl) ||
        "") ?? "";
    const imageAltCandidate = safeString(r.imageAlt || (r as unknown as { txt_alt?: unknown }).txt_alt || (r as unknown as { txt_titulo?: unknown }).txt_titulo);

    const urlCandidate =
      safeString(r.url) ||
      safeString(r.link_destino) ||
      safeString((r as unknown as { href?: unknown }).href) ||
      "";

    const tipo = tipoRaw === "imagen_con_texto" ? "imagen_con_texto" : "solo_imagen";

    if (tipo === "imagen_con_texto") {
      return {
        tipo_slide: "imagen_con_texto",
        imageSrc: safeString(imageSrcCandidate) || undefined,
        imageAlt: safeString(imageAltCandidate) || undefined,
        title: safeString(r.title || (r as unknown as { txt_titulo?: unknown }).txt_titulo) || undefined,
        subtitle: safeString(r.subtitle || (r as unknown as { txt_subtitulo?: unknown }).txt_subtitulo) || undefined,
        detail:
          safeString(r.detail || (r as unknown as { txt_detalle?: unknown }).txt_detalle || (r as unknown as { txt_descripcion?: unknown }).txt_descripcion) ||
          undefined,
        buttonLabel: safeString(r.buttonLabel || (r as unknown as { txt_boton?: unknown }).txt_boton || (r as unknown as { txt_label?: unknown }).txt_label) || undefined,
        buttonUrl:
          safeString(r.buttonUrl || r.link_url || r.btn_url || r.link_destino || r.url) || undefined,
        esDestileria: Boolean(r.esDestileria ?? (r as unknown as { es_destileria?: unknown }).es_destileria),
      };
    }

    return {
      tipo_slide: "solo_imagen",
      imageSrc: safeString(imageSrcCandidate) || "",
      imageAlt: safeString(imageAltCandidate) || "",
      url: urlCandidate || undefined,
      linkLabel: safeString(r.linkLabel || (r as unknown as { link_label?: unknown }).link_label || (r as unknown as { txt_label?: unknown }).txt_label) || undefined,
    };
  };

  const configRaw = (d.config ?? {}) as Record<string, unknown>;
  const autoplay = Boolean(d.autoplay ?? configRaw.autoplay);
  const intervaloCandidate =
    Number(configRaw.intervalo_segundos ?? (d as Record<string, unknown>).intervalo_segundos ?? (d as Record<string, unknown>).intervalo ?? configRaw.intervalo);
  const intervalo_segundos = Number.isFinite(intervaloCandidate) && intervaloCandidate > 0 ? intervaloCandidate : 5;

  const slides = slidesRaw.map(mapSlide);

  const hasAtLeastOneSlide = slides.length > 0 && slides.some((s) => (s.tipo_slide === "solo_imagen" ? s.imageSrc : s.imageSrc));
  if (hasAtLeastOneSlide) {
    return { slides, config: { autoplay, intervalo_segundos } };
  }

  // Fallback: si CMS no trae estructura de slides, mapeamos banner simple (img_fondo/img_principal) a un slide.
  const img =
    safeString(d.img_fondo ?? d.img_principal) ||
    safeString((d as unknown as { imageSrc?: unknown }).imageSrc) ||
    "";
  if (!img.trim()) return null;

  const alt = safeString(d.txt_alt ?? d.txt_titulo) || "";
  const link = safeString(d.link_destino);
  const slide: PromoCarouselSlide = {
    tipo_slide: "solo_imagen",
    imageSrc: img,
    imageAlt: alt,
    url: link || undefined,
    linkLabel: safeString(d.txt_titulo) || undefined,
  };

  return { slides: [slide], config: { autoplay: false, intervalo_segundos: 5 } };
}

function mapSliderBannerToPromoCarouselData(d: Record<string, unknown>): PromoCarouselData | null {
  const cfg = (d._configuracion ?? {}) as Record<string, unknown>;
  const autoplay = Boolean(cfg.autoplay);
  const intervaloCandidate = Number(cfg.intervalo_segundos);
  const intervalo_segundos = Number.isFinite(intervaloCandidate) && intervaloCandidate > 0 ? intervaloCandidate : 5;

  const list = d.lista_banners;
  const slidesRaw = Array.isArray(list) ? (list as unknown[]) : [];

  if (!slidesRaw.length) return null;

  const safeString = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return "";
    return String(v);
  };

  const slides: PromoCarouselSlide[] = slidesRaw
    .map((raw) => {
      const r = raw as Record<string, unknown>;
      const tipo = safeString(r.txt_tipo).toLowerCase();
      const imageSrc = safeString(r.img_imagen);
      const imageAlt = safeString(r.txt_alt_imagen);

      if (!imageSrc.trim()) return null;

      if (tipo === "imagen_con_texto") {
        const buttonLabel =
          safeString(r.txt_label_boton_optional) ||
          safeString((r.btn_boton_optional as Record<string, unknown> | undefined)?.txt_label);

        const buttonUrl = safeString(
          (r.btn_boton_optional as Record<string, unknown> | undefined)?.link_url ?? ""
        );

        return {
          tipo_slide: "imagen_con_texto",
          imageSrc,
          imageAlt,
          title: safeString(r.txt_titulo_optional),
          subtitle: safeString(r.txt_subtitulo_optional),
          detail: safeString(r.txt_detalle_optional),
          buttonLabel: buttonLabel || undefined,
          buttonUrl: buttonUrl || undefined,
          esDestileria: false,
        } satisfies PromoCarouselSlide;
      }

      // default: solo_imagen
      const linkUrl = safeString(
        (r.btn_destino_optional as Record<string, unknown> | undefined)?.link_url ?? ""
      );
      const linkLabel =
        safeString((r.btn_destino_optional as Record<string, unknown> | undefined)?.txt_label) ||
        safeString(r.btn_destino_optional?.toString?.() ?? "");

      return {
        tipo_slide: "solo_imagen",
        imageSrc,
        imageAlt,
        url: linkUrl || undefined,
        linkLabel: linkLabel || undefined,
      } satisfies PromoCarouselSlide;
    })
    .filter(Boolean) as PromoCarouselSlide[];

  if (!slides.length) return null;

  return { slides, config: { autoplay, intervalo_segundos } };
}

export default function CmsInicioClient({
  clientSlug,
  isDevelopment,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageComponents, setPageComponents] = useState<CMSComponent[]>([]);
  const mountedRef = useRef(true);
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiBase.trim()) {
        if (mountedRef.current) {
          setError("PUBLIC_API_URL no configurada");
          setLoading(false);
        }
        return;
      }
      const [all, noticias, eventos] = await Promise.all([
        fetchCMSComponentsInBrowser(apiBase.trim(), {
          clientSlug,
          isDevelopment,
        }),
        fetchNoticiasAdaptadas(),
        fetchEventosAdaptados(),
      ]);
      if (cancelled || !mountedRef.current) return;

      const merged = mergeInicioPageComponents(all, {
        noticiasApi: noticias,
        eventosApi: eventos,
      });
      setPageComponents(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, clientSlug, isDevelopment]);

  useEffect(() => {
    if (pageComponents.length === 0) return;
    const programasCmp = pageComponents.find(
      (c) => c.type === "programas_section" || c.type === "programas_home"
    );
    const data = programasCmp?.data as Record<string, unknown> | undefined;
    const raw = (data?.lista_programas ?? []) as Programa[];
    if (raw.length > 0) {
      saveProgramListCache(sortProgramList(raw), { clientSlug, isDevelopment });
    }
  }, [pageComponents, clientSlug, isDevelopment]);

  useEffect(() => {
    if (loading || pageComponents.length === 0) return;
    const root = document.getElementById("cms-inicio-root");
    if (!root) return;
    const section = root.querySelector(".hero-carrousel");
    if (!section) return;
    const slides = section.querySelectorAll(".slide");
    const dots = section.querySelectorAll(".dot");
    const nextBtn = section.querySelector(".next");
    const prevBtn = section.querySelector(".prev");
    if (slides.length === 0) return;
    let current = 0;
    let timer: ReturnType<typeof setInterval>;
    function showSlide(index: number) {
      slides.forEach((s) => s.classList.remove("active"));
      dots.forEach((d) => d.classList.remove("active"));
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("active");
      dots[current]?.classList.add("active");
      if (timer) clearInterval(timer);
      timer = setInterval(() => showSlide(current + 1), 7000);
    }
    const onNext = () => showSlide(current + 1);
    const onPrev = () => showSlide(current - 1);
    nextBtn?.addEventListener("click", onNext);
    prevBtn?.addEventListener("click", onPrev);
    dots.forEach((dot, idx) => dot.addEventListener("click", () => showSlide(idx)));
    showSlide(0);
    return () => {
      if (timer) clearInterval(timer);
      nextBtn?.removeEventListener("click", onNext);
      prevBtn?.removeEventListener("click", onPrev);
    };
  }, [loading, pageComponents]);

  if (loading) {
    return (
      <div id="cms-inicio-root">
        <div className="cms-inicio-loading">
          <div className="cms-inicio-spinner" aria-hidden />
          <p>Cargando contenido…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="cms-inicio-root">
        <div className="cms-inicio-loading">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="cms-inicio-root">
      {pageComponents.map((cms) => {
        const d = cms.data as Record<string, unknown>;
        const key = cms._id || cms.type + (d._orden as string);

        if (cms.type === "hero_carousel" || cms.type === "hero_carrousel") {
          const listaSlides = (d.lista_slides ?? []) as Array<{
            txt_titulo?: string;
            txt_subtitulo?: string;
            txt_descripcion?: string;
            img_principal?: string;
            txt_categoria?: string;
            btn_boton?: { txt_label?: string; link_destino?: string };
            link_destino?: string;
          }>;
          if (!listaSlides.length) return null;
          return (
            <section key={key} className="hero-carrousel" aria-label="Galería de novedades">
              <div className="slides-container">
                {listaSlides.map((s, index) => {
                  const categoria = String(s.txt_categoria ?? "").trim();
                  const titulo = String(s.txt_titulo ?? "").trim();
                  const subtitulo = String(s.txt_subtitulo ?? s.txt_descripcion ?? "").trim();
                  const btnLabel = String(s.btn_boton?.txt_label ?? "").trim();
                  const linkDestino = String(s.btn_boton?.link_destino ?? s.link_destino ?? "").trim();
                  const showButton = Boolean(btnLabel && linkDestino);
                  const hasOverlay =
                    Boolean(categoria) || Boolean(titulo) || Boolean(subtitulo);
                  const hasSlideContent =
                    Boolean(categoria) || Boolean(titulo) || Boolean(subtitulo) || showButton;
                  const altImg = titulo || categoria || "";
                  return (
                    <div key={index} className={`slide ${index === 0 ? "active" : ""}`}>
                      <img src={s.img_principal} alt={altImg} className="slide-bg" />
                      {hasOverlay && <div className="slide-overlay" />}
                      {hasSlideContent && (
                        <div className="hero-container slide-content">
                          <div className="text-wrapper">
                            {categoria && <span className="badge">{categoria}</span>}
                            {titulo && <h2 className="titulo">{titulo}</h2>}
                            {subtitulo && <p className="descripcion">{subtitulo}</p>}
                            {showButton && (
                              <a href={linkDestino} className="btn-primary">
                                {btnLabel}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="m9 18 6-6-6-6" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" className="nav-btn prev" aria-label="Anterior">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button type="button" className="nav-btn next" aria-label="Siguiente">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <div className="dots-container">
                {listaSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`dot ${index === 0 ? "active" : ""}`}
                    aria-label={`Ir a slide ${index + 1}`}
                  />
                ))}
              </div>
            </section>
          );
        }

        if (cms.type === "banner_hero" || cms.type === "banner_promocional" || cms.type === "banner_imagen") {
          if (cms.type === "banner_promocional") {
            const promoData = mapBannerPromocionalToPromoCarouselData(d as Record<string, unknown>);
            if (!promoData) return null;
            return (
              <section key={key} className="banner-wrapper">
                <PromoCarousel data={promoData} minHeight="320px" className="home-promo-carousel" />
              </section>
            );
          }

          const img = (d.img_fondo ?? d.img_principal) as string | undefined;
          if (!img) return null;
          const link = (d.link_destino ?? "") as string;
          const alt = (d.txt_alt ?? d.txt_titulo ?? "") as string;
          return (
            <section key={key} className="banner-wrapper">
              <div className="banner-container">
                {link ? (
                  <a href={link} className="banner-link" title={(d.txt_titulo as string) || undefined}>
                    <img src={img} alt={String(alt)} className="banner-img" loading="eager" />
                  </a>
                ) : (
                  <img src={img} alt={String(alt)} className="banner-img" loading="eager" />
                )}
              </div>
            </section>
          );
        }

        if (
          cms.type === "slider_banner" ||
          cms.name === "Silider de Banners" ||
          cms.name === "Slider de Banners"
        ) {
          const promoData = mapSliderBannerToPromoCarouselData(d as Record<string, unknown>);
          if (!promoData) return null;
          return (
            <section key={key} className="banner-wrapper">
              <PromoCarousel data={promoData} minHeight="360px" className="home-promo-carousel" />
            </section>
          );
        }

        if (cms.type === "programas_section" || cms.type === "programas_home") {
          const programasRaw = (d.lista_programas ?? []) as Programa[];
          const sorted = sortProgramList(programasRaw);
          const programas = sorted.slice(0, 6);
          const titulo = (d.txt_titulo as string) || "Programas";
          const subtitulo = (d.txt_subtitulo as string) || "";
          const btn = d.btn_boton as { txt_label?: string; link_url?: string } | undefined;
          const textoVerTodo = btn?.txt_label ?? "Ver todos los programas";
          const urlVerTodoRaw = normalizePageUrl(btn?.link_url ?? "/programas");
          const urlVerTodo = urlVerTodoRaw.startsWith("/") ? urlVerTodoRaw : `/${urlVerTodoRaw}`;
          const ocultar =
            d.boolean_ocultar_si_no_hay_noticias === true ||
            d.boolean_ocultar_si_no_hay_programas === true;
          const disclaimer = (d.lista_disclamer_sin_programas ??
            d.lista_disclamer_sin_noticias ??
            []) as Array<{ txt_parrafo?: string }>;
          if (!programas.length && ocultar) return null;
          return (
            <section key={key} className="featured-programs">
              <div className="container">
                <div className="header">
                  <h2 className="title">{titulo}</h2>
                  {subtitulo && <p className="subtitle">{subtitulo}</p>}
                </div>
                {programas.length > 0 ? (
                  <>
                    <div className="programs-grid">
                      {programas.map((prog, i) => {
                        const slug = getProgramSlug(prog, i);
                        const visual = getProgramaHomeVisual(prog);
                        const boxClass =
                          visual.mode === "photo"
                            ? "logo-box logo-box--photo"
                            : "logo-box logo-box--brand";
                        return (
                        <a key={i} href={`/programas/detalle?slug=${encodeURIComponent(slug)}`} className="program-card">
                          <div className={boxClass}>
                            <img
                              src={visual.src}
                              alt={visual.mode === "photo" ? getProgramaNombre(prog) : ""}
                              loading="lazy"
                              className={
                                visual.mode === "photo" ? "program-home-thumb-cover" : "program-home-thumb-contain"
                              }
                            />
                          </div>
                          <div className="content">
                            <h3 className="program-name">{getProgramaNombre(prog)}</h3>
                            <p className="program-desc">{getProgramaDesc(prog)}</p>
                          </div>
                        </a>
                      );
                      })}
                    </div>
                    <div className="action-container">
                      <a href={urlVerTodo} className="btn-ver-todos">
                        {textoVerTodo}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </a>
                    </div>
                  </>
                ) : (
                  disclaimer.length > 0 && (
                    <div className="disclaimer-content">
                      {disclaimer.map((x, i) => x.txt_parrafo && <p key={i}>{x.txt_parrafo}</p>)}
                    </div>
                  )
                )}
              </div>
            </section>
          );
        }

        if (cms.type === "agenda_cultural") {
          const lista = (d.lista_eventos ?? []) as Array<{
            _orden?: number;
            txt_titulo?: string;
            txt_fecha?: string;
            _fechaISO?: string;
            txt_horario?: string;
            txt_ubicacion?: string;
            txt_categoria?: string;
            img_principal?: string;
            txt_descripcion?: string;
            boolean_destacada?: boolean;
          }>;
          const ordenados = [...lista].sort(
            (a, b) =>
              new Date(a._fechaISO ?? a.txt_fecha ?? "").getTime() -
              new Date(b._fechaISO ?? b.txt_fecha ?? "").getTime()
          );
          const eventoDestacado = ordenados.find((e) => e.boolean_destacada);
          const gridEvents = eventoDestacado
            ? ordenados.filter((e) => e !== eventoDestacado).slice(0, 3)
            : ordenados.slice(0, 4);
          const title = (d.txt_titulo as string) || "Agenda Cultural";
          const subtitle = (d.txt_subtitulo as string) || "";
          const viewAllText = (d.txt_ver_todo as string) || "Ver toda la agenda";
          const viewAllHref = normalizePageUrl((d.link_ver_todo as string) || "/agenda") || "/agenda";
          const disclamer = (d.lista_disclamer_sin_eventos ?? []) as Array<{ txt_parrafo?: string }>;
          const ocultar = d.boolean_ocultar_si_no_hay_eventos === true;
          const hay = ordenados.length > 0;
          if (!hay && ocultar) return null;
          return (
            <section key={key} id="agenda" className="agenda-section">
              <div className="container">
                <div className="header-flex">
                  <div className="title-group">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                  </div>
                </div>
                {hay ? (
                  <>
                    {eventoDestacado && (
                      <article className="agenda-destacada-card">
                        <a
                          href={`/agenda/detalle/${eventoDestacado._orden ?? 0}`}
                          className="agenda-destacada-link"
                          aria-label={`Ver detalle: ${eventoDestacado.txt_titulo ?? "evento"}`}
                        >
                          <div className="agenda-destacada-img">
                            {eventoDestacado.img_principal ? (
                              <img
                                src={eventoDestacado.img_principal}
                                alt={eventoDestacado.txt_titulo ?? ""}
                                loading="eager"
                              />
                            ) : null}
                            {String(eventoDestacado.txt_categoria ?? "").trim() ? (
                              <span className="category-badge">{eventoDestacado.txt_categoria}</span>
                            ) : null}
                          </div>
                          <div className="agenda-destacada-content">
                            <h3>{eventoDestacado.txt_titulo}</h3>
                            {String(eventoDestacado.txt_descripcion ?? "").trim() ? (
                              <p className="agenda-destacada-extract">{eventoDestacado.txt_descripcion}</p>
                            ) : null}
                            <div className="agenda-destacada-meta">
                              {String(eventoDestacado.txt_fecha ?? "").trim() ? (
                                <span className="agenda-destacada-fecha">{eventoDestacado.txt_fecha}</span>
                              ) : null}
                              {String(eventoDestacado.txt_horario ?? "").trim() ? (
                                <span className="agenda-destacada-hora">{eventoDestacado.txt_horario}</span>
                              ) : null}
                            </div>
                          </div>
                        </a>
                      </article>
                    )}
                    {gridEvents.length > 0 ? (
                    <div className="events-grid">
                      {gridEvents.map((ev, i) => {
                        const eventId = ev._orden ?? i;
                        return (
                          <a
                            key={ev._orden ?? `ev-${i}`}
                            href={`/agenda/detalle/${eventId}`}
                            className="event-card"
                            aria-label={`Ver detalle: ${ev.txt_titulo ?? "evento"}`}
                          >
                            <div className="image-container">
                              <img src={ev.img_principal} alt={ev.txt_titulo ?? ""} loading="lazy" />
                              {String(ev.txt_categoria ?? "").trim() ? (
                                <span className="category-badge">{ev.txt_categoria}</span>
                              ) : null}
                            </div>
                            <div className="content">
                              <h3>{ev.txt_titulo}</h3>
                              <div className="info-list">
                                <div className="info-item">
                                  <span>{ev.txt_fecha}</span>
                                </div>
                                {String(ev.txt_horario ?? "").trim() ? (
                                  <div className="info-item">
                                    <span>{ev.txt_horario}</span>
                                  </div>
                                ) : null}
                                {String(ev.txt_ubicacion ?? "").trim() ? (
                                  <div className="info-item">
                                    <span>{ev.txt_ubicacion}</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                    ) : null}
                  </>
                ) : (
                  <div className="events-grid">
                    {disclamer.map((p, i) => (
                      <div key={i} className="agenda-empty">
                        <p>{p.txt_parrafo}</p>
                      </div>
                    ))}
                  </div>
                )}
                {hay && (
                  <div className="agenda-action-container">
                    <a href={viewAllHref} className="btn-outline">
                      {viewAllText}
                    </a>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (cms.type === "noticias_section" || cms.type === "noticias") {
          const listaNoticias = (d.lista_noticias ?? []) as Array<{
            _slug?: string;
            boolean_destacada?: boolean;
            img_principal?: string;
            txt_titulo?: string;
            txt_categoria?: string;
            txt_extracto?: string;
            txt_fecha?: string;
          }>;
          const btn = d.btn_boton as { txt_label?: string; link_url?: string; src_destino?: string } | undefined;
          const textoVerTodo = (d.txt_ver_todo as string) || btn?.txt_label || "Ver todas";
          const urlVerTodo = normalizePageUrl((d.link_ver_todo as string) || btn?.link_url || "/noticias") || "/noticias";
          const ocultar = d.boolean_ocultar_si_no_hay_noticias === true;
          const disclaimer = (d.lista_disclamer_sin_noticias ?? []) as Array<{ txt_parrafo?: string }>;
          const hay = listaNoticias.length > 0;
          if (!hay && ocultar) return null;
          const destacada = hay
            ? listaNoticias.find((n) => n.boolean_destacada) || listaNoticias[0]
            : null;
          const otras = destacada
            ? listaNoticias.filter((n) => n._slug !== destacada._slug).slice(0, 3)
            : [];
          return (
            <section key={key} className="noticias-section">
              <div className="container">
                <div className="header-noticias">
                  <div className="title-group">
                    <h2>{(d.txt_titulo as string) || "Noticias"}</h2>
                    <p>{(d.txt_subtitulo as string) || ""}</p>
                  </div>
                </div>
                {destacada && (
                  <article className="destacada-card">
                    <a href={`/Noticias/detalle/${encodeURIComponent(destacada._slug ?? "")}`} className="destacada-link">
                      <div className="destacada-img">
                        <img src={destacada.img_principal} alt={destacada.txt_titulo} />
                      </div>
                      <div className="destacada-content">
                        <h3>{destacada.txt_titulo}</h3>
                        <p>{destacada.txt_extracto}</p>
                        <span>{destacada.txt_fecha}</span>
                      </div>
                    </a>
                  </article>
                )}
                <div className="noticias-grid">
                  {otras.map((n, i) => (
                    <article key={i} className="noticia-card">
                      <a href={`/Noticias/detalle/${encodeURIComponent(n._slug ?? "")}`}>
                        <div className="card-img">
                          <img src={n.img_principal} alt={n.txt_titulo} />
                        </div>
                        <div className="card-content">
                          <h4>{n.txt_titulo}</h4>
                          <p>{n.txt_extracto}</p>
                          <span>{n.txt_fecha}</span>
                        </div>
                      </a>
                    </article>
                  ))}
                  {!hay &&
                    disclaimer.map((p, i) => (
                      <p key={i}>{p.txt_parrafo}</p>
                    ))}
                </div>
                {hay && (
                  <div className="action-container">
                    <a href={urlVerTodo} className="btn-ver-todo">
                      {textoVerTodo}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (cms.type === "telefonos_utiles") {
          const telefonos = (d.lista_telefonos ?? d.lista_contacto ?? []) as Telefono[];
          const titulo = (d.txt_titulo as string) || "";
          const subtitulo = (d.txt_subtitulo as string) || "";
          const btn = d.btn_boton as
            | {
                txt_label?: string;
                label_texto?: string;
                link_destino?: string;
                link_url?: string;
                src_destino?: string;
              }
            | undefined;
          const textoVerTodo =
            (d.txt_ver_todo as string) || btn?.txt_label || btn?.label_texto || "";
          const urlVerTodoRaw = normalizePageUrl(
            (d.link_ver_todo as string) || btn?.link_destino || btn?.link_url || btn?.src_destino || ""
          );
          const urlVerTodo =
            urlVerTodoRaw && urlVerTodoRaw.startsWith("/")
              ? urlVerTodoRaw
              : urlVerTodoRaw
                ? `/${urlVerTodoRaw}`
                : "";
          const conFav = telefonos.filter((t) => t.boolean_favorito);
          const favs = conFav.length > 0 ? conFav.slice(0, 4) : telefonos.slice(0, 4);
          const tieneMas = telefonos.length > 4;
          if (!telefonos.length) return null;
          return (
            <section key={key} className="useful-phones">
              <div className="container">
                <div className="header">
                  {titulo && <h2 className="title">{titulo}</h2>}
                  {subtitulo && <p className="subtitle">{subtitulo}</p>}
                </div>
                <div className="phones-grid">
                  {favs.map((item, i) => {
                    const { href, valor, icon } = getPrimerContacto(item);
                    return (
                      <a
                        key={i}
                        href={href}
                        className="phone-card"
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        <div
                          className="icon-circle"
                          style={{ backgroundColor: "rgba(194,109,14,0.15)", color: "#C26D0E" }}
                        >
                          <SocialIcon iconName={item._icon ?? "FaPhone"} size={24} />
                        </div>
                        <h3 className="name">{item.txt_nombre}</h3>
                        <span className="number" style={{ color: "#C26D0E" }}>
                          <SocialIcon iconName={icon ?? item._icon ?? "FaPhone"} size={18} />
                          {valor}
                        </span>
                      </a>
                    );
                  })}
                </div>
                {tieneMas && urlVerTodo && textoVerTodo && (
                  <div className="footer-action">
                    <a href={urlVerTodo} className="btn-more">
                      {textoVerTodo}
                    </a>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (cms.type === "redes_sociales") {
          const lista = ((d.lista_contacto ?? []) as Contacto[]).filter((r) => r.link_destino);
          if (!lista.length) return null;
          return (
            <div key={key} className="redes-sociales">
              {lista.map((red, i) => (
                <a
                  key={i}
                  href={red.link_destino}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="redes-social-icon"
                  aria-label={red.txt_label ?? ""}
                >
                  <SocialIcon iconName={red.icon_contacto ?? "FaLink"} size={20} />
                </a>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import type { PromoCarouselData, PromoCarouselSlide } from "./promo-carousel-types";
import "./promo-carousel.css";

interface PromoCarouselProps {
  data: PromoCarouselData;
  /** Altura mínima del carrusel (ej. "400px" o "50vh") */
  minHeight?: string;
  className?: string;
}

function SlideSoloImagen({
  slide,
}: {
  slide: Extract<PromoCarouselSlide, { tipo_slide: "solo_imagen" }>;
}) {
  const content = (
    <div className="promo-carousel__media">
      <img src={slide.imageSrc} alt={slide.imageAlt} />
    </div>
  );

  if (!slide.url) return content;

  return (
    <a
      className="promo-carousel__link"
      href={slide.url}
      aria-label={slide.linkLabel ?? slide.imageAlt}
    >
      {content}
    </a>
  );
}

function SlideImagenConTexto({
  slide,
  esDestileria,
}: {
  slide: Extract<PromoCarouselSlide, { tipo_slide: "imagen_con_texto" }>;
  esDestileria?: boolean;
}) {
  const hasText =
    slide.title || slide.subtitle || slide.detail || (slide.buttonLabel && slide.buttonUrl);

  const ctaThemeClass = esDestileria ? "promo-carousel__cta--destileria" : "promo-carousel__cta--bodega";

  return (
    <>
      {slide.imageSrc ? (
        <div className="promo-carousel__media">
          <img src={slide.imageSrc} alt={slide.imageAlt ?? ""} />
        </div>
      ) : (
        <div
          className="promo-carousel__media"
          style={{ background: esDestileria ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.25)" }}
          aria-hidden
        />
      )}

      <div className="promo-carousel__overlay" aria-hidden="true" />

      {hasText && (
        <div className="promo-carousel__text-layer">
          {slide.title && <h2 className="promo-carousel__title">{slide.title}</h2>}
          {slide.subtitle && <p className="promo-carousel__subtitle">{slide.subtitle}</p>}
          {slide.detail && <p className="promo-carousel__detail">{slide.detail}</p>}

          {slide.buttonLabel && slide.buttonUrl && (
            <a
              className={`promo-carousel__cta ${ctaThemeClass}`}
              href={slide.buttonUrl}
              aria-label={slide.buttonLabel}
            >
              {slide.buttonLabel}
            </a>
          )}
        </div>
      )}
    </>
  );
}

export function PromoCarousel({ data, minHeight = "400px", className = "" }: PromoCarouselProps) {
  const { slides, config } = data;
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalMs = (config.intervalo_segundos ?? 5) * 1000;

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (!config.autoplay || slides.length <= 1) return;
    const id = setInterval(goNext, intervalMs);
    return () => clearInterval(id);
  }, [config.autoplay, slides.length, intervalMs, goNext]);

  if (!slides.length) return null;

  const showControls = slides.length > 1;

  return (
    <section
      className={`promo-carousel ${className}`}
      aria-label="Carrusel de promociones"
      style={{ minHeight, height: minHeight }}
    >
      <div className="promo-carousel__track">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="promo-carousel__slide"
            style={{
              opacity: i === currentIndex ? 1 : 0,
              pointerEvents: i === currentIndex ? "auto" : "none",
              zIndex: i === currentIndex ? 1 : 0,
            }}
            aria-hidden={i !== currentIndex}
          >
            {slide.tipo_slide === "solo_imagen" ? (
              <SlideSoloImagen slide={slide} />
            ) : (
              <SlideImagenConTexto slide={slide} esDestileria={slide.esDestileria} />
            )}
          </div>
        ))}
      </div>

      {showControls && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="promo-carousel__arrow promo-carousel__arrow--prev"
            aria-label="Slide anterior"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="promo-carousel__arrow promo-carousel__arrow--next"
            aria-label="Slide siguiente"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            className="promo-carousel__dots"
            role="tablist"
            aria-label="Diapositivas"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Ir a slide ${i + 1}`}
                onClick={() => setCurrentIndex(i)}
                className={`promo-carousel__dot ${i === currentIndex ? "promo-carousel__dot--active" : ""}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

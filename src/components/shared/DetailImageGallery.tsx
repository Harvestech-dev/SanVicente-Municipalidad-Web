import { useCallback, useId, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaDownload } from "react-icons/fa";
import { MediaActions } from "./MediaActions";
import "./detail-image-gallery.css";

export type DetailGalleryItem = {
  src: string;
  alt: string;
};

type CarouselProps = {
  items: DetailGalleryItem[];
  baseFileSlug: string;
  onShare: () => void;
  mediaActionsContainerClass: string;
  mediaActionsButtonClass: string;
  shareAriaLabel: string;
  shareTitle: string;
  showShareInHero?: boolean;
  /** Contenedor opcional (ej. section) */
  className?: string;
};

/**
 * Una o varias imágenes: si hay más de una, carrusel con flechas y dots (sin descarga en el carrusel).
 * Una sola imagen: figura + MediaActions con descarga y compartir.
 */
export function DetailImageCarousel({
  items,
  baseFileSlug,
  onShare,
  mediaActionsContainerClass,
  mediaActionsButtonClass,
  shareAriaLabel,
  shareTitle,
  showShareInHero = true,
  className = "",
}: CarouselProps) {
  const [index, setIndex] = useState(0);
  const liveId = useId();

  const n = items.length;
  const current = items[index];

  const goPrev = useCallback(() => {
    if (n <= 1) return;
    setIndex((i) => (i - 1 + n) % n);
  }, [n]);

  const goNext = useCallback(() => {
    if (n <= 1) return;
    setIndex((i) => (i + 1) % n);
  }, [n]);

  if (n === 0 || !current) return null;

  const single = n === 1;
  const downloadHref = single ? current.src : undefined;
  const downloadFileName = single ? `${baseFileSlug}.jpg` : undefined;

  return (
    <div className={`detail-image-carousel ${className}`.trim()}>
      <figure
        className="detail-image-carousel__figure"
        tabIndex={single ? undefined : 0}
        aria-roledescription={single ? undefined : "carrusel"}
        aria-label={single ? undefined : "Galería de imágenes"}
        onKeyDown={
          single
            ? undefined
            : (e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  goPrev();
                }
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  goNext();
                }
              }
        }
      >
        <img
          src={current.src}
          alt={current.alt}
          className="detail-image-carousel__img"
        />

        {!single && (
          <>
            <button
              type="button"
              className="detail-image-carousel__nav detail-image-carousel__nav--prev"
              onClick={goPrev}
              aria-label="Imagen anterior"
            >
              <FaChevronLeft aria-hidden />
            </button>
            <button
              type="button"
              className="detail-image-carousel__nav detail-image-carousel__nav--next"
              onClick={goNext}
              aria-label="Imagen siguiente"
            >
              <FaChevronRight aria-hidden />
            </button>
          </>
        )}

        <MediaActions
          containerClassName={mediaActionsContainerClass}
          buttonClassName={mediaActionsButtonClass}
          downloadHref={downloadHref}
          downloadFileName={downloadFileName}
          shareAriaLabel={shareAriaLabel}
          shareTitle={shareTitle}
          showShare={showShareInHero}
          onShare={onShare}
        />
      </figure>

      {!single && (
        <>
          <p id={liveId} className="detail-image-carousel__live" aria-live="polite">
            Imagen {index + 1} de {n}
          </p>
          <ul className="detail-image-carousel__dots" aria-label="Seleccionar imagen">
            {items.map((_, i) => (
              <li key={`${i}-${items[i].src}`}>
                <button
                  type="button"
                  className={
                    "detail-image-carousel__dot" +
                    (i === index ? " detail-image-carousel__dot--active" : "")
                  }
                  aria-label={`Ir a imagen ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => setIndex(i)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

type ThumbsProps = {
  items: DetailGalleryItem[];
  baseFileSlug: string;
  className?: string;
};

/**
 * Miniaturas con overlay de descarga al hover; el enlace descarga (sin modal).
 */
export function DetailImageThumbnailsRow({
  items,
  baseFileSlug,
  className = "",
}: ThumbsProps) {
  if (items.length <= 1) return null;

  return (
    <div
      className={`detail-image-thumbs ${className}`.trim()}
      role="list"
      aria-label="Descargar imágenes de la galería"
    >
      {items.map((item, i) => {
        const idx = i + 1;
        const fileName = `${baseFileSlug}-${idx}.jpg`;
        return (
          <a
            key={`${item.src}-${i}`}
            role="listitem"
            href={item.src}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-image-thumbs__tile"
            aria-label={`Descargar imagen ${idx}`}
            title={`Descargar imagen ${idx}`}
          >
            <img src={item.src} alt="" loading="lazy" />
            <span className="detail-image-thumbs__overlay" aria-hidden="true">
              <FaDownload />
            </span>
          </a>
        );
      })}
    </div>
  );
}

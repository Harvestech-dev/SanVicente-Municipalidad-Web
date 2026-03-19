import { useEffect, useMemo, useState } from "react";
import { FaShareAlt } from "react-icons/fa";
import { fetchNoticiasAdaptadas } from "../../lib/api-vecino";
import {
  DetailImageCarousel,
  DetailImageThumbnailsRow,
} from "../shared/DetailImageGallery";
import { DetailSkeleton } from "../shared/DetailSkeleton";
import "./noticia-detail-client.css";

type Noticia = {
  _slug?: string;
  txt_titulo?: string;
  txt_categoria?: string;
  txt_fecha?: string;
  img_principal?: string;
  txt_extracto?: string;
  txt_cuerpo?: string;
  gallery_imagenes?: string[];
};

export default function NoticiaDetailClient({ slug }: { slug: string | null }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [noticia, setNoticia] = useState<Noticia | null>(null);

  const slugFromUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const querySlug = new URLSearchParams(window.location.search).get("slug");
    if (querySlug && querySlug.trim() !== "") return querySlug.trim();
    const segments = window.location.pathname.split("/").filter(Boolean);
    const maybeSlug = segments[segments.length - 1] ?? "";
    if (maybeSlug.toLowerCase() === "detalle") return "";
    return decodeURIComponent(maybeSlug).trim();
  }, []);

  const safeSlug = useMemo(
    () => ((slug ?? "").trim() || slugFromUrl),
    [slug, slugFromUrl]
  );

  useEffect(() => {
    let cancelled = false;
    if (!safeSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setNoticia(null);

    fetchNoticiasAdaptadas()
      .then((lista) => {
        if (cancelled) return;
        const found = (lista as Noticia[]).find((n) => n._slug === safeSlug) ?? null;
        setNoticia(found);
        setNotFound(!found);
      })
      .catch(() => {
        if (cancelled) return;
        setNoticia(null);
        setNotFound(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [safeSlug]);

  if (loading) {
    return (
      <main className="noticia-detail article-page">
        <div className="container-narrow">
          <DetailSkeleton imageHeightPx={420} />
        </div>
      </main>
    );
  }

  if (notFound || !noticia) {
    return (
      <main className="noticia-detail article-page">
        <div className="container-narrow">
          <div className="empty-state">
            <p>No se encontró la noticia.</p>
            <a href="/noticias" className="detail-back-link">
              &larr; Volver a todas las noticias
            </a>
          </div>
        </div>
      </main>
    );
  }

  const gallery = Array.isArray(noticia.gallery_imagenes)
    ? noticia.gallery_imagenes.filter((img) => String(img ?? "").trim() !== "")
    : [];
  const uniqueGallery = Array.from(new Set(gallery));
  const imageSources = uniqueGallery.length > 0
    ? uniqueGallery
    : (noticia.img_principal ? [noticia.img_principal] : []);
  const title = noticia.txt_titulo ?? "Noticia";
  const galleryItems = imageSources.map((src, i) => ({
    src,
    alt: `${title} — imagen ${i + 1}`,
  }));

  const onShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: noticia.txt_titulo ?? "Noticia",
      text: noticia.txt_extracto ?? noticia.txt_titulo ?? "Noticia",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard?.writeText(window.location.href);
      window.alert("Enlace copiado al portapapeles.");
    } catch {
      /* noop */
    }
  };

  return (
    <main className="noticia-detail article-page">
      <article className="article-page-inner">
        <header className="article-header">
          <div className="container-narrow">
            <div className="breadcrumb detail-breadcrumb">
              <a href="/noticias">Noticias</a> / <span>{noticia.txt_categoria}</span>
            </div>
            <h1 className="article-title">{noticia.txt_titulo}</h1>
            <div className="article-meta">
              <span className="date">{noticia.txt_fecha}</span>
              <span className="dot">·</span>
              <span className="category">{noticia.txt_categoria}</span>
            </div>
          </div>
        </header>

        {galleryItems.length > 0 && (
          <div className="container-narrow-wide noticia-detail__hero-gallery">
            <DetailImageCarousel
              items={galleryItems}
              baseFileSlug={noticia._slug ?? safeSlug}
              onShare={onShare}
              mediaActionsContainerClass="media-actions"
              mediaActionsButtonClass="media-action-btn"
              shareAriaLabel="Compartir noticia"
              shareTitle="Compartir noticia"
              showShareInHero={false}
            />
          </div>
        )}

        <div className="article-body">
          <div className="container-narrow">
            <div className="content" dangerouslySetInnerHTML={{ __html: noticia.txt_cuerpo ?? "" }} />

            <div className="article-footer">
              <div className="detail-back-share-row">
                <a href="/noticias" className="detail-back-link">
                  ← Volver a todas las noticias
                </a>
                <button
                  type="button"
                  className="detail-share-link"
                  onClick={onShare}
                  aria-label="Compartir noticia"
                  title="Compartir noticia"
                >
                  <FaShareAlt aria-hidden />
                  Compartir
                </button>
              </div>
              <DetailImageThumbnailsRow
                items={galleryItems}
                baseFileSlug={noticia._slug ?? safeSlug}
              />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

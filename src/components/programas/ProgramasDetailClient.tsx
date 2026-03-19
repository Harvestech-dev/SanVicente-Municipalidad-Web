/**
 * Detalle de un programa con datos desde la API CMS.
 * Recibe slug por prop (si existe) o lo toma de window.location.search (?slug=...).
 */

import { useEffect, useMemo, useState } from "react";
import { FaFileAlt, FaImage, FaLink, FaShareAlt } from "react-icons/fa";
import { fetchCMSComponentsInBrowser } from "../../lib/cms/fetch-cms-browser";
import { getProgramasPageData } from "../../lib/cms/programas-from-cms";
import {
  getProgramSlug,
  readProgramListCache,
  saveProgramListCache,
  sortProgramList,
} from "../../lib/programas-utils";
import {
  DetailImageCarousel,
  DetailImageThumbnailsRow,
  type DetailGalleryItem,
} from "../shared/DetailImageGallery";
import { DetailSkeleton } from "../shared/DetailSkeleton";
import "./programas-detail-client.css";

interface Programa {
  _id?: string;
  _orden?: number;
  img_logo?: string;
  img_imagen?: string;
  txt_titulo?: string;
  txt_subtitulo?: string;
  lista_descripcion?: Array<{ txt_descripcion?: string }>;
  lista_adjuntos?: Array<{ txt_nombre?: string; link_url?: string }>;
  attachments_adjuntos?: Array<{
    txt_label?: string;
    txt_nombre?: string;
    txt_url?: string;
    link_url?: string;
  }>;
  gallery_imagenes?: Array<{
    url?: string;
    img_fondo?: string;
    alt?: string;
  }>;
}

type AttachmentKind = "file" | "image" | "url";

function inferAttachmentKind(input: {
  url: string;
  label: string;
  explicitType?: string;
}): AttachmentKind {
  const typeRaw = (input.explicitType ?? "").toLowerCase().trim();
  if (typeRaw) {
    if (typeRaw.includes("image") || typeRaw.includes("img") || typeRaw.includes("foto")) {
      return "image";
    }
    if (
      typeRaw.includes("file") ||
      typeRaw.includes("archivo") ||
      typeRaw.includes("document")
    ) {
      return "file";
    }
    if (typeRaw.includes("url") || typeRaw.includes("link") || typeRaw.includes("enlace")) {
      return "url";
    }
  }

  const raw = `${input.url} ${input.label}`.toLowerCase();
  const imageExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".bmp"];
  const fileExt = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".txt",
    ".csv",
  ];

  if (imageExt.some((ext) => raw.includes(ext))) return "image";
  if (fileExt.some((ext) => raw.includes(ext))) return "file";
  return "url";
}

/** Orden: imagen principal CMS, luego galería, sin duplicar URLs; si no hay nada, logo. */
function getProgramGalleryImages(p: Programa): DetailGalleryItem[] {
  const title = p.txt_titulo ?? "Programa";
  const seen = new Set<string>();
  const out: DetailGalleryItem[] = [];

  const add = (src: unknown, alt: string) => {
    if (typeof src !== "string" || !src.trim()) return;
    const s = src.trim();
    if (seen.has(s)) return;
    seen.add(s);
    out.push({ src: s, alt });
  };

  const raw = p as Record<string, unknown>;
  add(raw.img_imagen ?? p.img_imagen, title);

  const gal = raw.gallery_imagenes ?? raw.gallery_imagen ?? p.gallery_imagenes;
  if (Array.isArray(gal)) {
    for (const item of gal) {
      const o = (item ?? {}) as Record<string, unknown>;
      const u = o.url ?? o.img_fondo ?? o.txt_url;
      add(u, String(o.alt ?? title));
    }
  }

  if (out.length === 0) {
    add(p.img_logo, title);
  }

  return out;
}

interface Props {
  slug: string | null;
}

export default function ProgramasDetailClient({ slug }: Props) {
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";
  const clientSlug = (
    import.meta.env.CLIENT_SLUG ??
    import.meta.env.PUBLIC_CLIENT_SLUG ??
    ""
  ).toString().trim();
  const isDevelopment =
    String(
      import.meta.env.ENVIRONMENT ?? import.meta.env.ENVIROMENT ?? ""
    ).toLowerCase() === "development";

  const [program, setProgram] = useState<Programa | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const slugFromQuery = useMemo(() => {
    if (typeof window === "undefined") return null;
    const q = new URLSearchParams(window.location.search).get("slug");
    return q && q.trim() !== "" ? q.trim() : null;
  }, []);
  const effectiveSlug = mounted ? slug ?? slugFromQuery : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!effectiveSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    // 1) Intentar resolver desde cache cliente (inicio/listado).
    const cached = readProgramListCache<Programa>({ clientSlug, isDevelopment });
    if (cached.length > 0) {
      const indexCached = cached.findIndex(
        (prog, i) => getProgramSlug(prog, i) === effectiveSlug
      );
      if (indexCached >= 0) {
        setProgram(cached[indexCached]);
        setLoading(false);
        return () => {
          cancelled = true;
        };
      }
    }

    // 2) Fallback cliente: volver a consultar CMS en browser.
    if (!apiBase.trim()) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetchCMSComponentsInBrowser(apiBase.trim(), {
      clientSlug,
      isDevelopment,
    })
      .then((components) => {
        if (cancelled) return;
        const data = getProgramasPageData(components);
        const lista = sortProgramList((data.lista_programas ?? []) as Programa[]);
        saveProgramListCache(lista, { clientSlug, isDevelopment });
        const index = lista.findIndex(
          (prog, i) => getProgramSlug(prog, i) === effectiveSlug
        );
        if (index >= 0) {
          setProgram(lista[index]);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, clientSlug, isDevelopment, effectiveSlug, mounted]);

  // Evita mismatch SSR vs client: hasta montar, mostramos el mismo placeholder.
  if (!mounted) {
    return (
      <main className="programas-detail main-content">
        <section className="article-page">
          <div className="container-narrow">
            <DetailSkeleton imageHeightPx={420} />
          </div>
        </section>
      </main>
    );
  }

  if (!effectiveSlug) {
    return (
      <main className="programas-detail main-content">
        <section className="article-page">
          <div className="container-narrow">
            <p>No se especificó ningún programa.</p>
            <a href="/programas" className="detail-back-link">
              ← Volver a todos los programas
            </a>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="programas-detail main-content">
        <section className="article-page">
          <div className="container-narrow">
            <DetailSkeleton imageHeightPx={420} />
          </div>
        </section>
      </main>
    );
  }

  if (notFound || !program) {
    return (
      <main className="programas-detail main-content">
        <section className="article-page">
          <div className="container-narrow">
            <p>No se encontró el programa.</p>
            <a href="/programas" className="detail-back-link">
              ← Volver a todos los programas
            </a>
          </div>
        </section>
      </main>
    );
  }

  const galleryItems = getProgramGalleryImages(program);
  const tieneImagen = galleryItems.length > 0;
  const descripciones = program.lista_descripcion ?? [];
  const adjuntos =
    (program.attachments_adjuntos as Array<{
      txt_label?: string;
      txt_nombre?: string;
      txt_url?: string;
      link_url?: string;
    }>) ??
    (program.lista_adjuntos as Array<{ txt_nombre?: string; link_url?: string }>) ??
    [];
  const linksAdjuntos = adjuntos
    .filter((a) => {
      const url = a.txt_url ?? a.link_url;
      return url && String(url).trim() !== "";
    })
    .map((a) => ({
      label: (a.txt_label ?? a.txt_nombre ?? "Enlace") as string,
      url: (a.txt_url ?? a.link_url ?? "#") as string,
      kind: inferAttachmentKind({
        url: String(a.txt_url ?? a.link_url ?? ""),
        label: String(a.txt_label ?? a.txt_nombre ?? "Enlace"),
        explicitType: String(
          (a as Record<string, unknown>).type ??
            (a as Record<string, unknown>).txt_tipo ??
            (a as Record<string, unknown>).tipo ??
            ""
        ),
      }),
    }));
  const onShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: program.txt_titulo ?? "Programa",
      text: program.txt_subtitulo ?? program.txt_titulo ?? "Programa",
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
    <main className="programas-detail main-content">
      <section className="hero-page">
        <div className="container">
          <nav className="breadcrumb detail-breadcrumb" aria-label="Miga de pan">
            <a href="/programas">Programas</a>
            <span className="sep">/</span>
            <span>{program.txt_titulo}</span>
          </nav>
          <h1 className="hero-title">{program.txt_titulo}</h1>
          {program.txt_subtitulo && (
            <p className="hero-subtitle">{program.txt_subtitulo}</p>
          )}
        </div>
      </section>

      {tieneImagen && (
        <section className="gallery-section" aria-label="Imágenes del programa">
          <div className="container gallery-container">
            <DetailImageCarousel
              items={galleryItems}
              baseFileSlug={effectiveSlug ?? "programa"}
              onShare={onShare}
              mediaActionsContainerClass="media-actions"
              mediaActionsButtonClass="media-action-btn"
              shareAriaLabel="Compartir programa"
              shareTitle="Compartir programa"
              showShareInHero={false}
            />
          </div>
        </section>
      )}

      <article className="article-page">
        <div className="article-body">
          <div className="container-narrow">
            {descripciones.length > 0 && (
              <div className="content">
                {descripciones.map(
                  (d, i) =>
                    d.txt_descripcion && (
                      <p key={i}>{d.txt_descripcion}</p>
                    )
                )}
              </div>
            )}

            {linksAdjuntos.length > 0 && (
              <div className="attachments">
                <h2 className="attachments-title">Enlaces y recursos</h2>
                <ul className="attachments-list">
                  {linksAdjuntos.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target={
                          link.url.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          link.url.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="attachment-link"
                      >
                        <span
                          className={`attachment-icon attachment-icon--${link.kind}`}
                          aria-hidden="true"
                        >
                          {link.kind === "image" ? (
                            <FaImage />
                          ) : link.kind === "file" ? (
                            <FaFileAlt />
                          ) : (
                            <FaLink />
                          )}
                        </span>
                        <span>{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="article-footer">
              <div className="detail-back-share-row">
                <a href="/programas" className="detail-back-link">
                  ← Volver a todos los programas
                </a>
                <button
                  type="button"
                  className="detail-share-link"
                  onClick={onShare}
                  aria-label="Compartir programa"
                  title="Compartir programa"
                >
                  <FaShareAlt aria-hidden />
                  Compartir
                </button>
              </div>
              <DetailImageThumbnailsRow
                items={galleryItems}
                baseFileSlug={effectiveSlug ?? "programa"}
              />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

/**
 * Detalle de una legislación con fetch en cliente.
 * Recibe slug por prop.
 */

import { useEffect, useState } from "react";
import { FaShareAlt } from "react-icons/fa";
import { fetchLegislationBySlugInBrowser } from "../../lib/api-legislaciones/fetch-browser";
import type {
  LegislationDetail,
  LegislationStatus,
  LegislationType,
} from "../../lib/api-legislaciones/types";

const TYPE_LABELS: Record<LegislationType, string> = {
  ordinance: "Ordenanza",
  decree: "Decreto",
  boletin: "Boletín",
};

const STATUS_LABELS: Record<LegislationStatus, string> = {
  vigente: "Vigente",
  modificada: "Modificada",
  derogada: "Derogada",
  vetada: "Vetada",
};

const STATUS_CLASSES: Record<LegislationStatus, string> = {
  vigente: "status-vigente",
  modificada: "status-modificada",
  derogada: "status-derogada",
  vetada: "status-vetada",
};

const RELATION_LABELS: Record<string, string> = {
  modifica: "Modifica a",
  deroga: "Deroga a",
  complementa: "Complementa a",
  referencia: "Hace referencia a",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  slug: string | null;
}

export default function NormativaDetailClient({ slug }: Props) {
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";
  const [item, setItem] = useState<LegislationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const slugFromUrl =
    typeof window === "undefined"
      ? null
      : (() => {
          const segments = window.location.pathname.split("/").filter(Boolean);
          const maybe = segments[segments.length - 1] ?? "";
          if (!maybe || maybe.toLowerCase() === "normativa") return null;
          return decodeURIComponent(maybe).trim();
        })();
  const effectiveSlug = (slug ?? "").trim() || (slugFromUrl ?? "");

  useEffect(() => {
    if (!apiBase || !effectiveSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchLegislationBySlugInBrowser(apiBase, effectiveSlug)
      .then((data) => {
        if (cancelled) return;
        setItem(data ?? null);
        setNotFound(!data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBase, effectiveSlug]);

  if (!effectiveSlug) {
    return (
      <main className="normativa-container normativa-detail">
        <section className="detail-section">
          <div className="content-wrapper">
            <div className="empty-state">
              <p>No se especificó ninguna normativa.</p>
              <a href="/Transparencia/normativa" className="btn-back">
                ← Volver a Normativa
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="normativa-container normativa-detail">
        <section className="detail-section">
          <div className="content-wrapper">
            <div className="empty-state">
              <p>Cargando detalle…</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (notFound || !item) {
    return (
      <main className="normativa-container normativa-detail">
        <section className="detail-section">
          <div className="content-wrapper">
            <div className="empty-state">
              <p>No se encontró la normativa solicitada.</p>
              <a href="/Transparencia/normativa" className="btn-back">
                ← Volver a Normativa
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const typeLabel = TYPE_LABELS[item.type] ?? item.type;

  const onShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: item.title ?? typeLabel,
      text: item.summary ?? item.title ?? typeLabel,
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
    <main className="normativa-container normativa-detail">
      <section className="hero-normativa">
        <div className="content-wrapper">
          <nav className="breadcrumb" aria-label="Miga de pan">
            <a href="/Transparencia/normativa">Normativa</a>
          </nav>
          <div className="meta-row">
            <span className="id-tag">
              {typeLabel} N° {item.numberPadded}/{item.year}
            </span>
            <span
              className={`status-badge ${STATUS_CLASSES[item.status] ?? ""}`}
            >
              {STATUS_LABELS[item.status] ?? item.status}
            </span>
          </div>
          <h1>{item.title}</h1>
          {item.summary && <p className="hero-subtitle">{item.summary}</p>}
        </div>
      </section>

      <section className="detail-section">
        <div className="content-wrapper detail-layout">
          {item.body && (
            <section
              className="detail-block block-body"
              data-section="body"
            >
              <h2>Texto completo</h2>
              <div className="body-text">{item.body}</div>
            </section>
          )}

          <div className="detail-sidebar-sticky">
            <div className="sidebar-card block-documentos">
              <h3>Documento</h3>
              <div className="button-group">
                {item.file?.url ? (
                  <a
                    href={item.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline-sm attachment-link"
                  >
                    <svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="attachment-label">
                      Descargar PDF
                      {item.file.size > 0 && (
                        <span className="file-size">
                          {" "}
                          ({formatFileSize(item.file.size)})
                        </span>
                      )}
                    </span>
                  </a>
                ) : (
                  <p className="no-docs">No hay archivo adjunto.</p>
                )}
              </div>
            </div>
          </div>

          <section className="detail-block data-block block-datos">
            <h2>Datos del documento</h2>
            <dl className="data-grid detail-grid">
              <div className="data-item">
                <dt className="label">Tipo</dt>
                <dd className="value">{typeLabel}</dd>
              </div>
              <div className="data-item">
                <dt className="label">Número</dt>
                <dd className="value">{item.numberPadded}</dd>
              </div>
              <div className="data-item">
                <dt className="label">Año</dt>
                <dd className="value">{item.year}</dd>
              </div>
              {item.area && (
                <div className="data-item">
                  <dt className="label">Área</dt>
                  <dd className="value">{item.area}</dd>
                </div>
              )}
              {item.signedAt && (
                <div className="data-item">
                  <dt className="label">Firma</dt>
                  <dd className="value">{formatDate(item.signedAt)}</dd>
                </div>
              )}
              {item.publishedAt && (
                <div className="data-item">
                  <dt className="label">Publicación</dt>
                  <dd className="value">{formatDate(item.publishedAt)}</dd>
                </div>
              )}
              {item.file?.pages != null && (
                <div className="data-item">
                  <dt className="label">Páginas</dt>
                  <dd className="value">{item.file.pages}</dd>
                </div>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="data-item data-item-full">
                  <dt className="label">Tags</dt>
                  <dd className="value">
                    <div className="card-tags">
                      {item.tags.map((tag) => (
                        <span key={tag} className="tag-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {item.relatedLegislations && item.relatedLegislations.length > 0 && (
            <section className="detail-block block-relacionadas">
              <h2>Normativa relacionada</h2>
              <ul className="relations-list">
                {item.relatedLegislations.map((rel, i) => (
                  <li key={i} className="relation-item">
                    <span className="relation-label">
                      {RELATION_LABELS[rel.relation] ?? rel.relation}
                    </span>
                    <span className="relation-id">ID: {rel.id}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="detail-footer block-footer">
            <div className="detail-back-share-row">
              <a href="/Transparencia/normativa" className="btn-back">
                ← Volver a Normativa
              </a>
              <button
                type="button"
                className="detail-share-link"
                onClick={onShare}
                aria-label="Compartir normativa"
                title="Compartir normativa"
              >
                <FaShareAlt aria-hidden />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

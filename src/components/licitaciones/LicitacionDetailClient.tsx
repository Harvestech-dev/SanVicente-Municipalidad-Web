/**
 * Detalle de una licitación con fetch en cliente (GET biddings/:id).
 * Recibe id por prop (desde ?id= en la URL).
 */

import { useEffect, useState } from "react";
import { FaShareAlt } from "react-icons/fa";
import { fetchBiddingByIdInBrowser } from "../../lib/api-licitaciones/fetch-browser";
import type { BiddingItem, BiddingAttachment } from "../../lib/api-licitaciones/types";
import { SocialIcon } from "../SocialIcon";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Próxima",
  open: "Abierta",
  in_evaluation: "En evaluación",
  closed: "Cerrada",
  awarded: "Adjudicada",
  deserted: "Desierta",
  cancelled: "Cancelada",
  suspended: "Suspendida",
};

const STATUS_CLASSES: Record<string, string> = {
  upcoming: "status-upcoming",
  open: "status-open",
  in_evaluation: "status-evaluation",
  closed: "status-closed",
  awarded: "status-awarded",
  deserted: "status-deserted",
  cancelled: "status-cancelled",
  suspended: "status-suspended",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function formatBudget(amount: number | undefined, currency?: string): string {
  if (amount == null) return "—";
  const sym = currency === "ARS" ? "$" : (currency ?? "$");
  return `${sym} ${amount.toLocaleString("es-AR")}`;
}

function hasAttachmentUrl(a: BiddingAttachment): boolean {
  const url = (a.external_url ?? a.file_url)?.trim();
  return !!url;
}

const iconByType: Record<string, string> = {
  url: "FaLink",
  image: "FaImage",
  file: "FaFileLines",
};

function AttachmentLink({
  attachment,
  className = "",
}: {
  attachment: BiddingAttachment;
  className?: string;
}) {
  const url = (attachment.external_url ?? attachment.file_url)?.trim();
  const label = attachment.label ?? attachment.title ?? "Documento";
  const type = attachment.attachment_type ?? "url";
  const iconName = iconByType[type] ?? "FaLink";
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-outline-sm attachment-link ${className}`}
    >
      <span className="attachment-type-icon" aria-hidden>
        <SocialIcon iconName={iconName} size={18} className="attachment-icon" />
      </span>
      <span className="attachment-label">{label}</span>
    </a>
  );
}

interface Props {
  id: string | null;
}

export default function LicitacionDetailClient({ id }: Props) {
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";
  const [bidding, setBidding] = useState<BiddingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const idFromUrl =
    typeof window === "undefined"
      ? null
      : (() => {
          const queryId = new URLSearchParams(window.location.search).get("id");
          if (queryId && queryId.trim() !== "") return queryId.trim();
          const segments = window.location.pathname.split("/").filter(Boolean);
          const maybeId = segments[segments.length - 1] ?? "";
          if (maybeId.toLowerCase() === "detalle") return null;
          return decodeURIComponent(maybeId).trim();
        })();
  const effectiveId = (id ?? "").trim() || (idFromUrl ?? "");

  useEffect(() => {
    if (!apiBase || !effectiveId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchBiddingByIdInBrowser(apiBase, effectiveId)
      .then((data) => {
        if (!cancelled) {
          setBidding(data ?? null);
          setNotFound(!data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, effectiveId]);

  if (!effectiveId) {
    return (
      <main className="licitaciones-container licitaciones-detail">
        <section className="detail-section">
          <div className="content-wrapper">
            <div className="empty-state">
              <p>No se especificó ninguna licitación.</p>
              <a href="/Transparencia/licitaciones" className="btn-back">
                ← Volver a Licitaciones y Concursos
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="licitaciones-container licitaciones-detail">
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

  if (notFound || !bidding) {
    return (
      <main className="licitaciones-container licitaciones-detail">
        <section className="detail-section">
          <div className="content-wrapper">
            <div className="empty-state">
              <p>No se encontró la licitación.</p>
              <a href="/Transparencia/licitaciones" className="btn-back">
                ← Volver a Licitaciones y Concursos
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const attachmentsWithUrl =
    bidding.attachments?.filter(hasAttachmentUrl) ?? [];
  const procedureTypeLabel = bidding.procedure_type?.replace(/_/g, " ") ?? "";
  const hasWinner =
    bidding.winner &&
    (bidding.winner.company_name ?? bidding.winner.award_amount != null);
  const onShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: bidding.title ?? "Licitación",
      text: bidding.subtitle ?? bidding.title ?? "Licitación",
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
    <main className="licitaciones-container licitaciones-detail">
      <section className="hero-licitaciones">
        <div className="content-wrapper">
          <nav className="breadcrumb" aria-label="Miga de pan">
            <a href="/Transparencia/licitaciones">Licitaciones y Concursos</a>
          </nav>
          <div className="meta-row">
            {bidding.bidding_number && (
              <span className="id-tag">N° {bidding.bidding_number}</span>
            )}
            {bidding.expediente_number && (
              <span className="expediente-tag">
                Exp. {bidding.expediente_number}
              </span>
            )}
            {procedureTypeLabel && (
              <span className="type-badge">{procedureTypeLabel}</span>
            )}
            {bidding.effective_status && (
              <span
                className={`status-badge ${STATUS_CLASSES[bidding.effective_status] ?? ""}`}
              >
                {STATUS_LABELS[bidding.effective_status] ??
                  bidding.effective_status}
              </span>
            )}
          </div>
          <h1>{bidding.title}</h1>
          {bidding.subtitle && (
            <p className="hero-subtitle">{bidding.subtitle}</p>
          )}
        </div>
      </section>

      <section className="detail-section">
        <div className="content-wrapper detail-layout">
          {bidding.object_of_contract && (
            <section
              className="detail-block block-objeto"
              data-section="objeto"
            >
              <h2>Objeto del contrato</h2>
              <p className="object-text">{bidding.object_of_contract}</p>
            </section>
          )}

          <div className="detail-sidebar-sticky">
            <div
              className="sidebar-card budget-box block-presupuesto"
              data-section="presupuesto"
            >
              <span className="budget-label">Presupuesto oficial</span>
              <span className="budget-value">
                {formatBudget(bidding.budget_official, bidding.currency)}
              </span>
            </div>

            <div
              className="sidebar-card attachments-card block-documentos"
              data-section="documentos"
            >
              <h3>Documentos</h3>
              <div className="button-group">
                {attachmentsWithUrl.length === 0 ? (
                  <p className="no-docs">No hay documentos cargados.</p>
                ) : (
                  attachmentsWithUrl.map((att, i) => (
                    <AttachmentLink
                      key={i}
                      attachment={att}
                      className="btn-outline-sm"
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <section
            className="detail-block data-block block-datos"
            data-section="datos"
          >
            <h2>Datos del proceso</h2>
            <dl className="data-grid detail-grid">
              <div className="data-item">
                <dt className="label">Publicación</dt>
                <dd className="value">
                  {formatDate(bidding.dates?.publication_date)}
                </dd>
              </div>
              <div className="data-item">
                <dt className="label">Inicio recepción ofertas</dt>
                <dd className="value">
                  {formatDate(bidding.dates?.bidding_start_date)}
                </dd>
              </div>
              <div className="data-item">
                <dt className="label">Cierre recepción ofertas</dt>
                <dd className="value">
                  {formatDate(bidding.dates?.bidding_end_date)}
                </dd>
              </div>
              <div className="data-item">
                <dt className="label">Fecha de apertura</dt>
                <dd className="value">
                  {formatDate(bidding.dates?.opening_date)}
                </dd>
              </div>
              <div className="data-item">
                <dt className="label">Adjudicación</dt>
                <dd className="value">
                  {formatDate(bidding.dates?.award_date)}
                </dd>
              </div>
              {bidding.area && (
                <div className="data-item">
                  <dt className="label">Área</dt>
                  <dd className="value">{bidding.area}</dd>
                </div>
              )}
              {bidding.location && (
                <div className="data-item">
                  <dt className="label">Ubicación</dt>
                  <dd className="value">{bidding.location}</dd>
                </div>
              )}
              {bidding.opening_location && (
                <div className="data-item data-item-full">
                  <dt className="label">Lugar de apertura</dt>
                  <dd className="value">{bidding.opening_location}</dd>
                </div>
              )}
              {bidding.consultation_contact && (
                <div className="data-item data-item-full">
                  <dt className="label">Consultas</dt>
                  <dd className="value">
                    {bidding.consultation_contact.includes("@") ||
                    bidding.consultation_contact.includes(".") ? (
                      <a
                        href={`mailto:${bidding.consultation_contact.trim()}`}
                      >
                        {bidding.consultation_contact}
                      </a>
                    ) : (
                      bidding.consultation_contact
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {hasWinner && bidding.winner && (
            <section
              className="detail-block winner-block block-adjudicacion"
              data-section="adjudicacion"
            >
              <h2>Adjudicación</h2>
              <dl className="winner-grid">
                {bidding.winner.company_name && (
                  <div className="data-item">
                    <dt className="label">Empresa adjudicada</dt>
                    <dd className="value">{bidding.winner.company_name}</dd>
                  </div>
                )}
                {bidding.winner.cuit && (
                  <div className="data-item">
                    <dt className="label">CUIT</dt>
                    <dd className="value">{bidding.winner.cuit}</dd>
                  </div>
                )}
                {bidding.winner.award_amount != null && (
                  <div className="data-item">
                    <dt className="label">Monto adjudicado</dt>
                    <dd className="value budget-value">
                      {formatBudget(
                        bidding.winner.award_amount,
                        bidding.currency
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <div className="detail-footer block-footer" data-section="footer">
            <div className="detail-back-share-row">
              <a href="/Transparencia/licitaciones" className="btn-back">
                ← Volver a Licitaciones y Concursos
              </a>
              <button
                type="button"
                className="detail-share-link"
                onClick={onShare}
                aria-label="Compartir licitación"
                title="Compartir licitación"
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

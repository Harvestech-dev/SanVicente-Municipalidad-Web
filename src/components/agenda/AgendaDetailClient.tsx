/**
 * Detalle de un evento (API Vecino) por id numérico (?id=).
 */

import { useEffect, useState } from "react";
import { FaShareAlt } from "react-icons/fa";
import { fetchEventosAdaptados } from "../../lib/api-vecino";
import { DetailSkeleton } from "../shared/DetailSkeleton";
import { MediaActions } from "../shared/MediaActions";
import "./agenda-detail-client.css";

type Evento = {
  _orden?: number;
  txt_titulo?: string;
  txt_fecha?: string;
  _fechaISO?: string;
  txt_horario?: string;
  txt_ubicacion?: string;
  txt_categoria?: string;
  img_principal?: string;
  txt_descripcion?: string;
};

export default function AgendaDetailClient({ eventId }: { eventId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ev, setEv] = useState<Evento | null>(null);

  const idFromUrl = (() => {
    if (typeof window === "undefined") return null;
    const queryId = new URLSearchParams(window.location.search).get("id");
    if (queryId && queryId.trim() !== "") return queryId.trim();
    const segments = window.location.pathname.split("/").filter(Boolean);
    const maybeId = segments[segments.length - 1] ?? "";
    if (maybeId.toLowerCase() === "detalle") return null;
    return decodeURIComponent(maybeId).trim();
  })();

  const effectiveId = (eventId ?? "").trim() || (idFromUrl ?? "");
  const idNum = effectiveId ? Number.parseInt(effectiveId, 10) : NaN;

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    fetchEventosAdaptados()
      .then((lista) => {
        if (cancelled) return;
        const found =
          (lista as Evento[]).find((e) => Number(e._orden) === idNum) ?? null;
        setEv(found);
        setNotFound(!found);
      })
      .catch(() => {
        if (!cancelled) {
          setEv(null);
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idNum]);

  if (loading) {
    return (
      <main className="agenda-detail-page">
        <div className="agenda-detail-narrow">
          <DetailSkeleton imageHeightPx={420} />
        </div>
      </main>
    );
  }

  if (notFound || !ev) {
    return (
      <main className="agenda-detail-page">
        <div className="agenda-detail-narrow">
          <div className="agenda-detail-empty">
            <p>No se encontró el evento.</p>
            <a href="/agenda" className="detail-back-link">
              ← Volver a la agenda
            </a>
          </div>
        </div>
      </main>
    );
  }

  const descripcion =
    (ev.txt_descripcion && String(ev.txt_descripcion).trim()) ||
    (ev.txt_ubicacion && String(ev.txt_ubicacion).trim() && ev.txt_ubicacion !== "Consultar"
      ? ev.txt_ubicacion
      : "");

  const onShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: ev.txt_titulo ?? "Evento",
      text: ev.txt_descripcion ?? ev.txt_titulo ?? "Evento",
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
    <main className="agenda-detail-page">
      <article className="agenda-detail-inner">
        <header className="agenda-detail-header">
          <div className="agenda-detail-narrow">
            <nav className="detail-breadcrumb" aria-label="Miga de pan">
              <a href="/agenda">Agenda cultural</a>
              <span aria-hidden> / </span>
              <span>{ev.txt_categoria ?? "Evento"}</span>
            </nav>
            <h1 className="agenda-detail-title">{ev.txt_titulo}</h1>
            <div className="agenda-detail-meta">
              <span>{ev.txt_fecha}</span>
              {ev.txt_categoria && (
                <>
                  <span className="dot">·</span>
                  <span>{ev.txt_categoria}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {ev.img_principal && (
          <div className="agenda-detail-figure-wrap">
            <div className="agenda-detail-narrow-wide">
              <figure className="agenda-detail-figure agenda-detail-figure--media">
                <img src={ev.img_principal} alt={ev.txt_titulo ?? ""} />
                <MediaActions
                  containerClassName="agenda-detail-media-actions"
                  buttonClassName="agenda-detail-media-btn"
                  downloadHref={ev.img_principal}
                  downloadFileName={`evento-${ev._orden ?? "imagen"}.jpg`}
                  shareAriaLabel="Compartir evento"
                  shareTitle="Compartir evento"
                  showShare={false}
                  onShare={onShare}
                />
              </figure>
            </div>
          </div>
        )}

        <div className="agenda-detail-body">
          <div className="agenda-detail-narrow">
            {String(ev.txt_horario ?? "").trim() && (
              <p className="agenda-detail-line">
                <strong>Horario:</strong> {ev.txt_horario}
              </p>
            )}
            {String(ev.txt_ubicacion ?? "").trim() &&
              ev.txt_ubicacion !== descripcion && (
                <p className="agenda-detail-line">
                  <strong>Lugar / info:</strong> {ev.txt_ubicacion}
                </p>
              )}
            {descripcion && (
              <div
                className="agenda-detail-desc"
                dangerouslySetInnerHTML={{
                  __html: descripcion.includes("<")
                    ? descripcion
                    : `<p>${descripcion.replace(/\n/g, "</p><p>")}</p>`,
                }}
              />
            )}
            <div className="agenda-detail-footer">
              <div className="detail-back-share-row">
                <a href="/agenda" className="detail-back-link">
                  ← Volver a toda la agenda
                </a>
                <button
                  type="button"
                  className="detail-share-link"
                  onClick={onShare}
                  aria-label="Compartir evento"
                  title="Compartir evento"
                >
                  <FaShareAlt aria-hidden />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

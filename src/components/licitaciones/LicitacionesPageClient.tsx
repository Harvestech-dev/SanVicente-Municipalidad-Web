/**
 * Listado de licitaciones con fetch en cliente (PUBLIC_API_URL).
 * Filtros, búsqueda y paginación en el navegador.
 */

import { useEffect, useState, useMemo } from "react";
import {
  fetchBiddingsInBrowser,
  type FetchBiddingsParams,
} from "../../lib/api-licitaciones/fetch-browser";
import type { BiddingItem, EffectiveStatus } from "../../lib/api-licitaciones/types";

const TITULO = "Licitaciones y Concursos";
const DESCRIPCION =
  "Consulta todos los procesos de contratación pública vigentes y participa de manera transparente.";

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

const ITEMS_PER_PAGE = 8;

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

function searchableText(lic: BiddingItem): string {
  const parts = [
    lic.title,
    lic.subtitle,
    lic.object_of_contract,
    lic.area,
  ].filter(Boolean) as string[];
  return parts.join(" ").toLowerCase();
}

export default function LicitacionesPageClient() {
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";
  const [items, setItems] = useState<BiddingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!apiBase) {
      setError("PUBLIC_API_URL no configurada");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params: FetchBiddingsParams = { limit: 50 };
    fetchBiddingsInBrowser(apiBase, params)
      .then(({ items: data }) => {
        if (!cancelled) {
          setItems(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Error al cargar licitaciones");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const estadosParaFiltro = useMemo(() => {
    const statuses = Array.from(
      new Set(items.map((l) => l.effective_status).filter(Boolean))
    ) as string[];
    return ["Todas", ...statuses];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((lic) => {
      const status = lic.effective_status ?? "";
      const search = searchableText(lic);
      const matchStatus =
        currentCategory === "Todas" || status === currentCategory;
      const matchSearch = search.includes(searchQuery.toLowerCase().trim());
      return matchStatus && matchSearch;
    });
  }, [items, currentCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  if (!apiBase) {
    return (
      <div className="licitaciones-container">
        <section className="hero-licitaciones">
          <div className="content-wrapper">
            <h1>{TITULO}</h1>
            <p>{DESCRIPCION}</p>
          </div>
        </section>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          PUBLIC_API_URL no configurada
        </div>
      </div>
    );
  }

  return (
    <main className="licitaciones-container">
      <section className="hero-licitaciones">
        <div className="content-wrapper">
          <h1>{TITULO}</h1>
          <p>{DESCRIPCION}</p>
        </div>
      </section>

      {loading && (
        <section className="list-section">
          <div className="content-wrapper grid-gap">
            <div className="empty-state">
              <p>Cargando licitaciones…</p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="list-section">
          <div className="content-wrapper grid-gap">
            <div className="empty-state">
              <p>{error}</p>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && (
        <>
          {items.length > 0 && (
            <section className="filters-bar">
              <div className="content-wrapper filters-flex">
                <div className="search-wrapper">
                  <svg
                    className="search-icon"
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
                    <circle cx={11} cy={11} r={8} />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por título, objeto o área..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="categories-wrapper">
                  {estadosParaFiltro.map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      className={`btn-cat ${estado === currentCategory ? "active" : ""}`}
                      onClick={() => {
                        setCurrentCategory(estado);
                        setCurrentPage(1);
                      }}
                    >
                      {estado === "Todas"
                        ? "Todas"
                        : STATUS_LABELS[estado] ?? estado}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="list-section">
            <div className="content-wrapper grid-gap">
              {items.length === 0 ? (
                <div className="empty-state">
                  <p>No hay licitaciones publicadas en este momento.</p>
                </div>
              ) : (
                <>
                  <div className="licitaciones-list">
                    {pageItems.map((lic) => (
                      <article
                        key={lic.id}
                        className="licitacion-card"
                        data-status={lic.effective_status ?? ""}
                      >
                        <div className="card-main-info">
                          <h3>
                            <a
                              href={`/Transparencia/licitaciones/detalle/${encodeURIComponent(lic.id)}`}
                              className="card-title-link"
                            >
                              {lic.title}
                            </a>
                          </h3>
                          {lic.subtitle && (
                            <p className="card-subtitle">{lic.subtitle}</p>
                          )}
                          {lic.object_of_contract && (
                            <p className="card-desc">
                              {lic.object_of_contract}
                            </p>
                          )}
                          <div className="data-grid">
                            <div className="data-item">
                              <span className="label">Apertura:</span>
                              <span className="value">
                                {formatDate(lic.dates?.opening_date)}
                              </span>
                            </div>
                            <div className="data-item">
                              <span className="label">Cierre:</span>
                              <span className="value">
                                {formatDate(lic.dates?.bidding_end_date)}
                              </span>
                            </div>
                            {lic.area && (
                              <div className="data-item">
                                <span className="label">Área:</span>
                                <span className="value">{lic.area}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="card-side-info">
                          <div className="budget-box">
                            <div className="meta-row">
                              {lic.effective_status && (
                                <span
                                  className={`status-badge ${STATUS_CLASSES[lic.effective_status] ?? ""}`}
                                >
                                  {STATUS_LABELS[lic.effective_status] ??
                                    lic.effective_status}
                                </span>
                              )}
                              {!lic.effective_status && lic.procedure_type && (
                                <span className="type-badge">
                                  {lic.procedure_type}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/Transparencia/licitaciones/detalle/${encodeURIComponent(lic.id)}`}
                            className="btn-primary-sm btn-detalle"
                          >
                            Ver detalle
                            <svg
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="pagination">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (i) => (
                          <button
                            key={i}
                            type="button"
                            className={i === page ? "active" : ""}
                            onClick={() => {
                              setCurrentPage(i);
                              document
                                .querySelector(".licitaciones-list")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                            }}
                          >
                            {i}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

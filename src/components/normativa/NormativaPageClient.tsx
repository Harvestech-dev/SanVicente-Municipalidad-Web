/**
 * Listado de normativa (legislaciones) con fetch en cliente.
 * Tabs por tipo (ordenanzas/decretos/boletines). Filtros server-side: año, status, search.
 * Paginación server-side.
 */

import { useEffect, useMemo, useState } from "react";
import {
  fetchLegislationsInBrowser,
  type FetchLegislationsParams,
} from "../../lib/api-legislaciones/fetch-browser";
import type {
  LegislationListItem,
  LegislationStatus,
  LegislationType,
  Pagination,
} from "../../lib/api-legislaciones/types";

const TITULO = "Normativa Municipal";
const DESCRIPCION =
  "Accede a ordenanzas, decretos y boletines oficiales de la Municipalidad de San Vicente.";

const TYPE_TABS: { value: LegislationType; label: string; singular: string }[] =
  [
    { value: "ordinance", label: "Ordenanzas", singular: "Ordenanza" },
    { value: "decree", label: "Decretos", singular: "Decreto" },
    { value: "boletin", label: "Boletines", singular: "Boletín" },
  ];

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

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 350;

const MIN_YEAR = 2022;

function getYearRange(): number[] {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now; y >= MIN_YEAR; y--) years.push(y);
  return years;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
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

export default function NormativaPageClient() {
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";

  const [tipo, setTipo] = useState<LegislationType>("ordinance");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<LegislationListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => getYearRange(), []);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tipo, search, year, status]);

  useEffect(() => {
    if (!apiBase) {
      setError("PUBLIC_API_URL no configurada");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: FetchLegislationsParams = {
      type: tipo,
      page,
      limit: ITEMS_PER_PAGE,
      sortBy: "year",
      sortOrder: "desc",
    };
    if (search) params.search = search;
    if (year) params.year = Number(year);
    if (status) params.status = status as LegislationStatus;

    fetchLegislationsInBrowser(apiBase, params)
      .then(({ items: data, pagination: pag }) => {
        if (cancelled) return;
        setItems(data);
        setPagination(pag);
      })
      .catch(() => {
        if (!cancelled) setError("Error al cargar normativa");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBase, tipo, search, year, status, page]);

  const activeTab = TYPE_TABS.find((t) => t.value === tipo)!;

  const totalPages = pagination?.pages ?? 0;
  const total = pagination?.total ?? 0;

  const onResetFiltros = () => {
    setSearchInput("");
    setSearch("");
    setYear("");
    setStatus("");
    setPage(1);
  };

  const hasActiveFilters = !!(searchInput || year || status);

  if (!apiBase) {
    return (
      <div className="normativa-container">
        <section className="hero-normativa">
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
    <main className="normativa-container">
      <section className="hero-normativa">
        <div className="content-wrapper">
          <div className="hero-icon" aria-hidden>
            <svg
              width={36}
              height={36}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1={16} y1={13} x2={8} y2={13} />
              <line x1={16} y1={17} x2={8} y2={17} />
              <line x1={10} y1={9} x2={8} y2={9} />
            </svg>
          </div>
          <h1>{TITULO}</h1>
          <p>{DESCRIPCION}</p>
        </div>
      </section>

      <section className="type-tabs-section">
        <div className="content-wrapper">
          <div className="type-tabs" role="tablist" aria-label="Tipo de normativa">
            {TYPE_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={t.value === tipo}
                className={`type-tab ${t.value === tipo ? "active" : ""}`}
                onClick={() => setTipo(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

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
              className="search-input"
              placeholder={`Buscar en ${activeTab.label.toLowerCase()}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="selects-wrapper">
            <select
              className="filter-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              aria-label="Filtrar por año"
            >
              <option value="">Año: Todos</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="">Estado: Todos</option>
              {(Object.keys(STATUS_LABELS) as LegislationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-ghost"
                onClick={onResetFiltros}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
        {!loading && !error && pagination && (
          <div className="content-wrapper results-count-row">
            <p className="results-count">
              {total === 0
                ? `Sin resultados`
                : `${total} ${total === 1 ? "documento" : "documentos"}`}
            </p>
          </div>
        )}
      </section>

      <section className="list-section">
        <div className="content-wrapper grid-gap">
          {loading && (
            <div className="empty-state">
              <p>Cargando {activeTab.label.toLowerCase()}…</p>
            </div>
          )}

          {!loading && error && (
            <div className="empty-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="empty-state">
              <p>
                No se encontraron {activeTab.label.toLowerCase()} con los filtros
                aplicados.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onResetFiltros}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <ul className="normativa-list">
                {items.map((leg) => (
                  <li key={leg._id} className="normativa-card">
                    <div className="card-main">
                      <div className="card-meta-row">
                        <span className="card-number">
                          {activeTab.singular} N° {leg.numberPadded}
                        </span>
                        <span className="card-year">/{leg.year}</span>
                        <span
                          className={`status-badge ${STATUS_CLASSES[leg.status] ?? ""}`}
                        >
                          {STATUS_LABELS[leg.status] ?? leg.status}
                        </span>
                      </div>
                      <h3 className="card-title">
                        <a
                          href={`/Transparencia/normativa/${encodeURIComponent(leg.slug)}`}
                          className="card-title-link"
                        >
                          {leg.title}
                        </a>
                      </h3>
                      {leg.summary && <p className="card-summary">{leg.summary}</p>}
                      <div className="card-info-row">
                        {leg.area && (
                          <span className="card-info-item">
                            <span className="label">Área:</span> {leg.area}
                          </span>
                        )}
                        {leg.publishedAt && (
                          <span className="card-info-item">
                            <span className="label">Publicada:</span>{" "}
                            {formatDate(leg.publishedAt)}
                          </span>
                        )}
                        {leg.file?.pages != null && (
                          <span className="card-info-item">
                            <span className="label">Páginas:</span>{" "}
                            {leg.file.pages}
                          </span>
                        )}
                      </div>
                      {leg.tags && leg.tags.length > 0 && (
                        <div className="card-tags">
                          {leg.tags.map((tag) => (
                            <span key={tag} className="tag-chip">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="card-actions">
                      {leg.file?.url && (
                        <a
                          href={leg.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline-sm"
                          aria-label={`Descargar PDF de ${leg.title}`}
                        >
                          <svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1={12} y1={15} x2={12} y2={3} />
                          </svg>
                          PDF
                          {leg.file.size > 0 && (
                            <span className="file-size">
                              {formatFileSize(leg.file.size)}
                            </span>
                          )}
                        </a>
                      )}
                      <a
                        href={`/Transparencia/normativa/${encodeURIComponent(leg.slug)}`}
                        className="btn-primary-sm"
                      >
                        Ver completo
                        <svg
                          width={16}
                          height={16}
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
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  className="pagination"
                  aria-label="Paginación de resultados"
                >
                  <button
                    type="button"
                    className="page-btn"
                    disabled={!pagination?.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  <span className="page-info">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="page-btn"
                    disabled={!pagination?.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

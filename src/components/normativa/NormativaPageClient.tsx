/**
 * Listado de normativa (legislaciones) con fetch en cliente.
 * Tabs por tipo (ordenanzas/decretos/boletines). Filtros server-side: año, status, search.
 * Paginación server-side.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLegislationsInBrowser,
  type FetchLegislationsParams,
} from "../../lib/api-legislaciones/fetch-browser";
import { isMockEnabled } from "../../lib/api-legislaciones/mock";
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

const PAGE_SIZE = 50;
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
  const mockActive = isMockEnabled();

  const [tipo, setTipo] = useState<LegislationType>("ordinance");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const [items, setItems] = useState<LegislationListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasNext = pagination?.hasNext ?? false;

  const years = useMemo(() => getYearRange(), []);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const loadPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!apiBase && !mockActive) {
        setError("PUBLIC_API_URL no configurada");
        setLoading(false);
        return;
      }
      if (replace) {
        setLoading(true);
        setItems([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params: FetchLegislationsParams = {
        type: tipo,
        page: targetPage,
        limit: PAGE_SIZE,
        sortBy: "year",
        sortOrder: "desc",
      };
      if (search) params.search = search;
      if (year) params.year = Number(year);
      if (status) params.status = status as LegislationStatus;

      try {
        const { items: data, pagination: pag } =
          await fetchLegislationsInBrowser(apiBase, params);
        setPagination(pag);
        setItems((prev) => (replace ? data : [...prev, ...data]));
        pageRef.current = targetPage;
      } catch {
        setError("Error al cargar normativa");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiBase, mockActive, tipo, search, year, status]
  );

  useEffect(() => {
    pageRef.current = 1;
    loadPage(1, true);
  }, [loadPage]);

  useEffect(() => {
    if (!hasNext || loadingMore || loading) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadPage(pageRef.current + 1, false);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNext, loadingMore, loading, loadPage]);

  const activeTab = TYPE_TABS.find((t) => t.value === tipo)!;
  const total = pagination?.total ?? 0;

  const onResetFiltros = () => {
    setSearchInput("");
    setSearch("");
    setYear("");
    setStatus("");
  };

  const hasActiveFilters = !!(searchInput || year || status);

  if (!apiBase && !mockActive) {
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
                : `Mostrando ${items.length} de ${total} ${total === 1 ? "documento" : "documentos"}`}
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
              <ul className="normativa-list" role="list">
                <li className="normativa-row header-row" aria-hidden>
                  <span className="col-id">{activeTab.singular}</span>
                  <span className="col-title">Título</span>
                  <span className="col-status">Estado</span>
                  <span className="col-date">Publicada</span>
                  <span className="col-actions">Acciones</span>
                </li>
                {items.map((leg) => (
                  <li key={leg._id} className="normativa-row">
                    <span className="col-id">
                      <span className="card-type">{activeTab.singular}</span>
                      <span className="card-number">N° {leg.numberPadded}</span>
                      <span className="card-year">/{leg.year}</span>
                    </span>
                    <span className="col-title">
                      <a
                        href={`/Transparencia/normativa/${encodeURIComponent(leg.slug)}`}
                        className="card-title-link"
                        title={leg.title}
                      >
                        {leg.title}
                      </a>
                      {leg.area && (
                        <span className="col-title-area">{leg.area}</span>
                      )}
                    </span>
                    <span className="col-status">
                      <span
                        className={`status-badge ${STATUS_CLASSES[leg.status] ?? ""}`}
                      >
                        {STATUS_LABELS[leg.status] ?? leg.status}
                      </span>
                    </span>
                    <span className="col-date">
                      {leg.publishedAt ? formatDate(leg.publishedAt) : "—"}
                    </span>
                    <span className="col-actions">
                      {leg.file?.url && (
                        <a
                          href={leg.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline-sm"
                          aria-label={`Descargar PDF de ${leg.title}`}
                          title={
                            leg.file.size > 0
                              ? `PDF (${formatFileSize(leg.file.size)})`
                              : "PDF"
                          }
                        >
                          <svg
                            width={14}
                            height={14}
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
                        </a>
                      )}
                      <a
                        href={`/Transparencia/normativa/${encodeURIComponent(leg.slug)}`}
                        className="btn-primary-sm"
                      >
                        Ver
                        <svg
                          width={14}
                          height={14}
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
                    </span>
                  </li>
                ))}
              </ul>

              <div
                ref={sentinelRef}
                className="infinite-sentinel"
                aria-hidden
              />
              {loadingMore && (
                <div className="loading-more">Cargando más…</div>
              )}
              {!hasNext && items.length > 0 && (
                <div className="end-of-list">— Fin del listado —</div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

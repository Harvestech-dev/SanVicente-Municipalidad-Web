/**
 * Página de programas con datos exclusivamente desde la API CMS.
 */

import { useEffect, useState, useMemo } from "react";
import { fetchCMSComponentsInBrowser } from "../../lib/cms/fetch-cms-browser";
import { getProgramasPageData } from "../../lib/cms/programas-from-cms";
import {
  getProgramSlug,
  saveProgramListCache,
  sortProgramList,
} from "../../lib/programas-utils";
import "./programas-page-client.css";

interface Programa {
  _orden?: number;
  boolean_featured?: boolean;
  img_logo?: string;
  img_imagen?: string;
  txt_titulo?: string;
  txt_subtitulo?: string;
  lista_descripcion?: Array<{ txt_descripcion?: string }>;
  gallery_imagenes?: Array<{ url?: string; img_fondo?: string }>;
}

const ITEMS_PER_PAGE = 6;
/** Misma imagen por defecto que en la home (`CmsInicioClient` getProgramaHomeVisual). */
const MUNI_ISOLOGO = "/Isologo_muni.png";

function getPrimeraImagen(p: Programa): string {
  const raw = p as Record<string, unknown>;
  const imgImagen = raw.img_imagen ?? p.img_imagen;
  if (typeof imgImagen === "string" && imgImagen.trim() !== "") {
    return imgImagen.trim();
  }
  const first = p.gallery_imagenes?.[0];
  if (!first) return "";
  return (first.url ?? first.img_fondo ?? "") as string;
}

function getPrimerParrafo(p: Programa): string {
  const desc = p.lista_descripcion?.[0]?.txt_descripcion;
  return (desc ?? p.txt_subtitulo ?? "") as string;
}

export default function ProgramasPageClient() {
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

  const [titulo, setTitulo] = useState("Programas Municipales");
  const [subtitulo, setSubtitulo] = useState("");
  const [lista, setLista] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentFilter, setCurrentFilter] = useState<"todos" | "destacados">(
    "todos"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!apiBase.trim()) {
      setError("PUBLIC_API_URL no configurada");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCMSComponentsInBrowser(apiBase.trim(), {
      clientSlug,
      isDevelopment,
    })
      .then((components) => {
        if (cancelled) return;
        const data = getProgramasPageData(components);
        setTitulo(data.txt_titulo);
        setSubtitulo(data.txt_subtitulo);
        const raw = (data.lista_programas ?? []) as Programa[];
        const sorted = sortProgramList(raw);
        setLista(sorted);
        saveProgramListCache(sorted, { clientSlug, isDevelopment });
      })
      .catch(() => {
        if (!cancelled) setError("Error al cargar programas");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, clientSlug, isDevelopment]);

  const programaDestacado = useMemo(
    () => lista.find((p) => p.boolean_featured) ?? null,
    [lista]
  );
  const indexDestacado = programaDestacado
    ? lista.indexOf(programaDestacado)
    : 0;

  const normalizedSearch = (s: string) =>
    (s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const filtered = useMemo(() => {
    const q = normalizedSearch(searchQuery);
    return lista.filter((prog) => {
      const title = (prog.txt_titulo ?? "").toLowerCase();
      const sub = (prog.txt_subtitulo ?? "").toLowerCase();
      const descs = (prog.lista_descripcion ?? [])
        .map((d) => (d.txt_descripcion ?? "").toLowerCase())
        .join(" ");
      const searchText = `${title} ${sub} ${descs}`;
      const matchesSearch = !q || normalizedSearch(searchText).includes(q);
      const matchesFilter =
        currentFilter === "todos" ||
        (currentFilter === "destacados" && !!prog.boolean_featured);
      return matchesSearch && matchesFilter;
    });
  }, [lista, searchQuery, currentFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / ITEMS_PER_PAGE)
  );
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);
  const hideFeatured =
    searchQuery.trim() !== "" || currentFilter === "destacados";

  if (!apiBase) {
    return (
      <main className="programas-page main-content">
        <section className="hero-page">
          <div className="container">
            <h1>Programas</h1>
            <p>PUBLIC_API_URL no configurada.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="programas-page main-content">
      <section className="hero-page">
        <div className="container">
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
      </section>

      {loading && (
        <section className="section-disclaimer">
          <div className="container">
            <div className="disclaimer-content">
              <p>Cargando programas…</p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="section-disclaimer">
          <div className="container">
            <div className="disclaimer-content">
              <p>{error}</p>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && lista.length > 0 && (
        <>
          <section className="filters-bar">
            <div className="container filters-flex">
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
                  placeholder="Buscar programas..."
                  className="search-input"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="categories-wrapper">
                <button
                  type="button"
                  className={`btn-cat ${currentFilter === "todos" ? "active" : ""}`}
                  onClick={() => {
                    setCurrentFilter("todos");
                    setCurrentPage(1);
                  }}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`btn-cat ${currentFilter === "destacados" ? "active" : ""}`}
                  onClick={() => {
                    setCurrentFilter("destacados");
                    setCurrentPage(1);
                  }}
                >
                  Destacados
                </button>
              </div>
            </div>
          </section>

          {programaDestacado && !hideFeatured && (
            <section className="featured-section" id="featuredSection">
              <div className="container">
                <a
                  href={`/programas/detalle?slug=${encodeURIComponent(
                    getProgramSlug(programaDestacado, indexDestacado)
                  )}`}
                  className="featured-card"
                  data-featured-id={programaDestacado.txt_titulo}
                >
                  <div className="featured-image">
                    {(() => {
                      const mainF = getPrimeraImagen(programaDestacado);
                      const logoF = (
                        programaDestacado.img_logo ?? ""
                      ).trim();
                      const showCorner =
                        !!mainF &&
                        !!logoF &&
                        logoF !== mainF;
                      return getPrimeraImagen(programaDestacado) ? (
                        <>
                          <img
                            src={mainF}
                            alt={programaDestacado.txt_titulo ?? ""}
                            loading="eager"
                          />
                          {showCorner && (
                            <img
                              src={logoF}
                              alt=""
                              className="program-card-logo-corner"
                              aria-hidden
                            />
                          )}
                        </>
                      ) : null;
                    })()}
                    {!getPrimeraImagen(programaDestacado) ? (
                      <div className="featured-placeholder">
                        <img
                          src={MUNI_ISOLOGO}
                          alt=""
                          className="program-muni-fallback program-muni-fallback--featured"
                          loading="eager"
                        />
                      </div>
                    ) : null}
                    {programaDestacado.boolean_featured && (
                      <span className="badge-destacada">Destacado</span>
                    )}
                  </div>
                  <div className="featured-info">
                    <h2>{programaDestacado.txt_titulo}</h2>
                    <p>
                      {programaDestacado.txt_subtitulo ??
                        getPrimerParrafo(programaDestacado)}
                    </p>
                    <div className="featured-footer">
                      <span className="read-more">Ver programa →</span>
                    </div>
                  </div>
                </a>
              </div>
            </section>
          )}

          <section className="programs-list-section">
            <div className="container">
              {filtered.length === 0 ? (
                <p className="no-results-message">
                  No se encontraron programas con los filtros aplicados.
                </p>
              ) : (
                <>
                  <div className="programs-grid" id="programsGrid">
                    {pageItems.map((prog, idx) => {
                      const globalIndex = lista.indexOf(prog);
                      const slug = getProgramSlug(prog, globalIndex >= 0 ? globalIndex : idx);
                      const isFeaturedCard =
                        programaDestacado !== null && prog === programaDestacado;
                      return (
                        <a
                          key={slug}
                          href={`/programas/detalle?slug=${encodeURIComponent(slug)}`}
                          className={`program-card ${isFeaturedCard ? "featured-card-item" : ""}`}
                          data-featured={prog.boolean_featured ? "true" : "false"}
                        >
                          <div className="card-image">
                            {(() => {
                              const mainImg = getPrimeraImagen(prog);
                              const logoP = (prog.img_logo ?? "").trim();
                              const showLogoCorner =
                                !!mainImg &&
                                !!logoP &&
                                logoP !== mainImg;
                              return mainImg ? (
                                <>
                                  <img
                                    src={mainImg}
                                    alt={prog.txt_titulo ?? ""}
                                    loading="lazy"
                                  />
                                  {showLogoCorner && (
                                    <img
                                      src={logoP}
                                      alt=""
                                      className="program-card-logo-corner"
                                      aria-hidden
                                    />
                                  )}
                                </>
                              ) : null;
                            })()}
                            {!getPrimeraImagen(prog) ? (
                              <div className="card-placeholder">
                                <img
                                  src={MUNI_ISOLOGO}
                                  alt=""
                                  className="program-muni-fallback program-muni-fallback--card"
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                            {prog.boolean_featured && (
                              <span className="card-badge">Destacado</span>
                            )}
                          </div>
                          <div className="card-content">
                            <h3>{prog.txt_titulo}</h3>
                            <p>{prog.txt_subtitulo ?? getPrimerParrafo(prog)}</p>
                            <span className="card-link">Ver programa →</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="pagination">
                      {Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                      ).map((i) => (
                        <button
                          key={i}
                          type="button"
                          className={i === page ? "active" : ""}
                          onClick={() => {
                            setCurrentPage(i);
                            document
                              .getElementById("programsGrid")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}

      {!loading && !error && lista.length === 0 && (
        <section className="section-disclaimer">
          <div className="container">
            <div className="disclaimer-content">
              <p>No hay programas cargados en este momento.</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

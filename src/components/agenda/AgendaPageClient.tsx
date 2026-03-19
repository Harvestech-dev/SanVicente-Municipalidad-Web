import { useEffect, useMemo, useState } from "react";
import agendaData from "../../data/agenda-cultural.json";
import { fetchEventosAdaptados } from "../../lib/api-vecino";
import "./agenda-page-client.css";

type Evento = {
  _orden?: number;
  _fechaISO?: string;
  txt_titulo?: string;
  txt_fecha?: string;
  txt_horario?: string;
  txt_ubicacion?: string;
  txt_categoria?: string;
  img_principal?: string;
  txt_descripcion?: string;
};

export default function AgendaPageClient() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentCategory, setCurrentCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");


  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEventosAdaptados()
      .then((data) => {
        if (cancelled) return;
        setEventos(data as unknown as Evento[]);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Error al cargar la agenda");
        setEventos([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    eventos.forEach((e) => {
      if (e.txt_categoria) set.add(e.txt_categoria);
    });
    return ["Todas", ...Array.from(set)];
  }, [eventos]);

  const filteredWithIdx = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return eventos
      .map((event, idx) => ({ event, idx }))
      .filter(({ event }) => {
        const matchCat =
          currentCategory === "Todas" ||
          (event.txt_categoria ?? "") === currentCategory;
        if (!matchCat) return false;
        if (!q) return true;
        const title = (event.txt_titulo ?? "").toLowerCase();
        const ubicacion = (event.txt_ubicacion ?? "").toLowerCase();
        const descripcion = (event.txt_descripcion ?? "").toLowerCase();
        return title.includes(q) || ubicacion.includes(q) || descripcion.includes(q);
      });
  }, [eventos, currentCategory, searchQuery]);

  const hayEventos = eventos.length > 0;


  const disclamerEventos = (agendaData.lista_disclamer_sin_eventos ??
    []) as Array<{ txt_parrafo?: string }>;

  return (
    <main className="main-content">
      <section className="hero-agenda">
        <div className="container">
          <h1>{agendaData.txt_titulo}</h1>
          <p>{agendaData.txt_subtitulo}</p>
        </div>
      </section>

      {loading && (
        <section className="section-disclaimer">
          <div className="container">
            <div className="disclaimer-content">
              <p>Cargando agenda…</p>
            </div>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="section-disclaimer">
          <div className="container">
            <div className="disclaimer-content">
              <p>{error}</p>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && hayEventos && (
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
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  id="agenda-search"
                  placeholder="Buscar eventos..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                />
              </div>
              <div className="categories-wrapper">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    className={`btn-cat ${cat === currentCategory ? "active" : ""}`}
                    type="button"
                    onClick={() => setCurrentCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="agenda-grid-section">
            <div className="container">
              <div className="events-grid" id="eventsGrid">
                {filteredWithIdx.map(({ event, idx }) => {
                  const eventId = Number(event._orden);
                  const hasDetailId =
                    Number.isFinite(eventId) && eventId > 0;
                  const detailHref = hasDetailId
                    ? `/agenda/detalle/${eventId}`
                    : undefined;
                  return (
                    <article
                      key={idx}
                      className="event-card"
                      id={
                        hasDetailId ? `evento-${eventId}` : `evento-${idx}`
                      }
                    >
                      {detailHref ? (
                        <a
                          href={detailHref}
                          className="event-card-detail-link"
                        >
                          <div className="image-container">
                            <img
                              src={event.img_principal ?? ""}
                              alt={event.txt_titulo ?? ""}
                              loading="lazy"
                            />
                            {event.txt_categoria && (
                              <span className="category-badge">
                                {event.txt_categoria}
                              </span>
                            )}
                          </div>
                          <div className="event-card-link-body">
                            <div className="text-group">
                              <h3>{event.txt_titulo}</h3>
                              <div className="info-list">
                                <div className="info-item">
                                  <span>{event.txt_fecha}</span>
                                </div>
                                {String(event.txt_horario ?? "").trim() && (
                                  <div className="info-item">
                                    <span>{event.txt_horario}</span>
                                  </div>
                                )}
                                {String(event.txt_ubicacion ?? "").trim() && (
                                  <div className="info-item info-item-ubicacion">
                                    <span>{event.txt_ubicacion}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <>
                          <div className="image-container">
                            <img
                              src={event.img_principal ?? ""}
                              alt={event.txt_titulo ?? ""}
                              loading="lazy"
                            />
                            {event.txt_categoria && (
                              <span className="category-badge">
                                {event.txt_categoria}
                              </span>
                            )}
                          </div>
                          <div className="event-card-link-body">
                            <div className="text-group">
                              <h3>{event.txt_titulo}</h3>
                              <div className="info-list">
                                <div className="info-item">
                                  <span>{event.txt_fecha}</span>
                                </div>
                                {String(event.txt_horario ?? "").trim() && (
                                  <div className="info-item">
                                    <span>{event.txt_horario}</span>
                                  </div>
                                )}
                                {String(event.txt_ubicacion ?? "").trim() && (
                                  <div className="info-item info-item-ubicacion">
                                    <span>{event.txt_ubicacion}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {!loading && !error && !hayEventos && (
        <section className="section-disclaimer">
          <div className="container">
            <div className="disclaimer-content">
              {disclamerEventos.map((p, i) => (
                <p key={i}>{p.txt_parrafo ?? ""}</p>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}


import { useEffect, useState, useRef } from "react";
import { SocialIcon } from "../SocialIcon";
import { ContactSearch } from "../ContactSearch";
import { fetchCMSComponentsInBrowser } from "../../lib/cms/fetch-cms-browser";
import { getComponentsByPage } from "../../lib/cms/fetch-cms";
import type { CMSComponent } from "../../lib/cms/types";
import {
  readContactoPageCache,
  saveContactoPageCache,
} from "../../lib/cms/page-components-cache";
import {
  getContactos,
  buildSearchIndex,
  type Edificio,
  type TelefonoItem,
  type Contacto,
} from "../../lib/contacto-cms-utils";
import "./contacto-page-client.css";

const PAGE_CONTACTO = "Contacto";
const STORAGE_KEY = "vecino-digital-tip-closed";

interface Props {
  clientSlug: string;
  isDevelopment: boolean;
}

function getComponentPayload(component?: CMSComponent): Record<string, unknown> {
  const content = component?.content;
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content as Record<string, unknown>;
  }
  const data = component?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {};
}

export default function ContactoPageClient({ clientSlug, isDevelopment }: Props) {
  const [loading, setLoading] = useState(true);
  const [contactComponents, setContactComponents] = useState<CMSComponent[]>([]);
  const tipRef = useRef<HTMLDivElement>(null);
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";

  useEffect(() => {
    if (!apiBase.trim()) {
      setLoading(false);
      return;
    }
    const context = { clientSlug, isDevelopment };
    const cached = readContactoPageCache(context);
    if (cached.length > 0) {
      setContactComponents(cached);
      setLoading(false);
    }
    let cancelled = false;
    (async () => {
      const all = await fetchCMSComponentsInBrowser(apiBase.trim(), { clientSlug, isDevelopment });
      if (cancelled) return;
      const filtered = getComponentsByPage(all, PAGE_CONTACTO);
      setContactComponents(filtered);
      saveContactoPageCache(filtered, context);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, clientSlug, isDevelopment]);

  useEffect(() => {
    const tipEl = tipRef.current;
    const closeBtn = tipEl?.querySelector(".vecino-digital-close");
    if (!tipEl || !closeBtn) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") tipEl.classList.add("hidden");
    } catch {
      /* noop */
    }
    const onClose = () => {
      tipEl.classList.add("hidden");
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* noop */
      }
    };
    closeBtn.addEventListener("click", onClose);
    return () => closeBtn.removeEventListener("click", onClose);
  }, [contactComponents]);

  if (loading) {
    return (
      <main className="contact-page">
        <div style={{ padding: "4rem", textAlign: "center" }}>Cargando…</div>
      </main>
    );
  }

  if (!apiBase.trim()) {
    return (
      <main className="contact-page">
        <div style={{ padding: "4rem", textAlign: "center" }}>PUBLIC_API_URL no configurada</div>
      </main>
    );
  }

  const apiCabecera = contactComponents.find((c) => c.type === "cabecera_contacto");
  const apiBanner = contactComponents.find((c) => c.type === "banner_flotante");
  const apiContactAreas = contactComponents.find((c) => c.type === "contact_areas");
  const apiTelefonos = contactComponents.find(
    (c) => c.type === "telefonos_utiles" || c.type === "telfonos_utiles_contacto"
  );
  const apiRedes = contactComponents.find((c) => c.type === "redes_sociales");

  const heroPayload = getComponentPayload(apiCabecera);
  const hero = {
    txt_titulo: (heroPayload.txt_titulo as string) ?? "",
    txt_descripcion: (heroPayload.txt_descripcion as string) ?? "",
  };

  const bannerPayload = getComponentPayload(apiBanner);
  const btnBanner = bannerPayload.btn_boton as
    | { txt_label?: string; link_destino?: string; link_url?: string }
    | undefined;
  const bannerDigital = {
    txt_titulo: (bannerPayload.txt_titulo as string) ?? "",
    txt_subtitulo: (bannerPayload.txt_subtitulo as string) ?? "",
    txt_badge: (bannerPayload.txt_badge as string) ?? "",
    txt_boton: btnBanner?.txt_label ?? "",
    link_url: btnBanner?.link_url ?? btnBanner?.link_destino ?? "",
  };
  const hasBannerContent = Boolean(bannerDigital.txt_titulo || bannerDigital.txt_subtitulo || bannerDigital.txt_badge);
  const hasBannerButton = Boolean(bannerDigital.link_url && bannerDigital.txt_boton);

  const areasData = getComponentPayload(apiContactAreas);
  const edificios = (areasData.lista_oficinas ?? []) as Edificio[];
  const sectionTitle = ((areasData.txt_title as string) ?? (areasData.txt_titulo as string) ?? "").trim();
  const sectionSubtitle = ((areasData.txt_subtitle as string) ?? (areasData.txt_subtitulo as string) ?? "").trim();

  const telefonosUtiles = getComponentPayload(apiTelefonos);
  const listaTelefonos = (telefonosUtiles.lista_telefonos ??
    telefonosUtiles.lista_contacto ??
    []) as TelefonoItem[];
  const redesData = getComponentPayload(apiRedes);
  const listaRedes = (redesData.lista_contacto ?? []) as Array<{
    icon_contacto?: string;
    link_destino?: string;
    txt_label?: string;
  }>;

  const searchIndex = buildSearchIndex(edificios, listaTelefonos);

  return (
    <main className="contact-page">
      {(hero.txt_titulo || hero.txt_descripcion || listaRedes.length > 0) && (
        <section className="hero-contact">
          <div className="container">
            {hero.txt_titulo && <h1>{hero.txt_titulo}</h1>}
            {hero.txt_descripcion && <p>{hero.txt_descripcion}</p>}
            <div className="hero-social-grid">
              {listaRedes
                .filter((r) => r.link_destino)
                .map((redItem, i) => (
                  <a
                    key={i}
                    href={redItem.link_destino}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-social-icon"
                    aria-label={redItem.txt_label ?? ""}
                  >
                    <SocialIcon iconName={redItem.icon_contacto ?? "FaLink"} size={22} />
                  </a>
                ))}
            </div>
          </div>
        </section>
      )}

      {apiBanner && (hasBannerContent || hasBannerButton) && (
        <div
          ref={tipRef}
          id="vecino-digital-tip"
          className="vecino-digital-floating"
          role="complementary"
          aria-label="Sugerencia Vecino Digital"
        >
          <button type="button" className="vecino-digital-close" aria-label="Cerrar sugerencia">
            &times;
          </button>
          <div className="digital-card digital-card-floating">
            <div className="digital-content">
              {bannerDigital.txt_badge && <div className="digital-badge">{bannerDigital.txt_badge}</div>}
              {bannerDigital.txt_titulo && <h3>{bannerDigital.txt_titulo}</h3>}
              {bannerDigital.txt_subtitulo && <p>{bannerDigital.txt_subtitulo}</p>}
            </div>
            {hasBannerButton && (
              <a href={bannerDigital.link_url} target="_blank" className="btn-digital-new" rel="noopener noreferrer">
                <span>{bannerDigital.txt_boton}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {(edificios.length > 0 || searchIndex.length > 0) && (
        <ContactSearch searchIndex={searchIndex} placeholder="Buscar contactos..." />
      )}

      {edificios.length > 0 && (
        <section className="section-offices">
          <div className="container">
            {sectionTitle && <h2 className="section-title">{sectionTitle}</h2>}
            {sectionSubtitle && <p className="section-desc section-desc-centered">{sectionSubtitle}</p>}
            <div className="edificios-list">
              {[...edificios]
                .sort((a, b) => (a._orden ?? 0) - (b._orden ?? 0))
                .map((edificio, ei) => (
                  <EdificioCard key={ei} edificio={edificio} />
                ))}
            </div>
          </div>
        </section>
      )}

      {apiTelefonos && listaTelefonos.length > 0 && (
        <section className="section-phones">
          <div className="container">
            {((telefonosUtiles.txt_titulo as string) ?? "").trim() && (
              <h2 className="section-subtitle section-subtitle-centered">{(telefonosUtiles.txt_titulo as string) ?? ""}</h2>
            )}
            {((telefonosUtiles.txt_subtitulo as string) ?? "").trim() && (
              <p className="section-desc section-desc-centered">{(telefonosUtiles.txt_subtitulo as string) ?? ""}</p>
            )}
            <div className="phones-grid">
              {[...listaTelefonos]
                .sort((a, b) => (a._orden ?? 0) - (b._orden ?? 0))
                .map((tel, ti) => (
                  <PhoneCard key={ti} tel={tel} />
                ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function ContactoLine({ c, size = "md" }: { c: Contacto; size?: "sm" | "xs" | "md" }) {
  const cls =
    size === "sm" ? "contacto-item contacto-item-sm" : size === "xs" ? "contacto-item contacto-item-xs" : "contacto-item";
  return (
    <div className={cls}>
      <span className="contact-icon">
        <SocialIcon iconName={c.icon_contacto ?? "FaLink"} size={size === "xs" ? 12 : size === "sm" ? 14 : 16} />
      </span>
      {c.link_destino ? (
        <a
          href={c.link_destino}
          target={c.link_destino.startsWith("http") ? "_blank" : undefined}
          rel={c.link_destino.startsWith("http") ? "noopener noreferrer" : undefined}
          className="contact-link"
        >
          {c.txt_valor ?? c.link_destino}
        </a>
      ) : (
        <span>{c.txt_valor ?? ""}</span>
      )}
    </div>
  );
}

function EdificioCard({ edificio }: { edificio: Edificio }) {
  const contactos = getContactos(edificio);
  return (
    <article
      className={`edificio-card ${edificio._boolean_isDefault ? "edificio-default" : ""}`}
    >
      <header className="edificio-header">
        <div className="edificio-icon">
          <SocialIcon iconName={edificio._icon ?? "FaBuilding"} size={24} />
        </div>
        <div className="edificio-titles">
          <h3 className="edificio-title">{edificio.txt_titulo}</h3>
          {edificio.txt_subtitulo && <p className="edificio-subtitle">{edificio.txt_subtitulo}</p>}
        </div>
      </header>
      <div className="edificio-contactos">
        {contactos.map((c, i) => (
          <ContactoLine key={i} c={c} />
        ))}
      </div>
      {(edificio.lista_dependencias ?? []).length > 0 && (
        <div className="dependencias-wrap">
          <details className="nivel-details secretarias-details">
            <summary className="nivel-label nivel-label-toggle">
              <span className="chevron" aria-hidden />
              Áreas
            </summary>
            <ul className="secretarias-list">
              {(edificio.lista_dependencias ?? [])
                .sort((a, b) => (a._orden ?? 0) - (b._orden ?? 0))
                .map((sec, si) => (
                  <li key={si} className="secretaria-item">
                    <div className="secretaria-header">
                      <SocialIcon iconName={sec._icon ?? "FaBuilding"} size={18} />
                      <h4 className="secretaria-title">{sec.txt_titulo}</h4>
                    </div>
                    <div className="secretaria-content">
                      <div className="secretaria-contactos">
                        {getContactos(sec).map((c, i) => (
                          <ContactoLine key={i} c={c} size="sm" />
                        ))}
                      </div>
                      {(sec.lista_dependencias ?? []).length > 0 && (
                        <div className="subsecretarias-wrap">
                          <details className="nivel-details subsecretarias-details">
                            <summary className="nivel-label nivel-label-sm nivel-label-toggle">
                              <span className="chevron chevron-sm" aria-hidden />
                              Subsecretarías
                            </summary>
                            <ul className="subsecretarias-list">
                              {(sec.lista_dependencias ?? [])
                                .sort((a, b) => (a._orden ?? 0) - (b._orden ?? 0))
                                .map((sub, sj) => (
                                  <li key={sj} className="subsecretaria-item">
                                    <div className="subsecretaria-header">
                                      <SocialIcon iconName={sub._icon ?? "FaLink"} size={16} />
                                      <h5 className="subsecretaria-title">{sub.txt_titulo}</h5>
                                    </div>
                                    <div className="subsecretaria-contactos">
                                      {getContactos(sub).map((c, i) => (
                                        <ContactoLine key={i} c={c} size="xs" />
                                      ))}
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </details>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </details>
        </div>
      )}
    </article>
  );
}

function PhoneCard({ tel }: { tel: TelefonoItem }) {
  const contactos = getContactos(tel);
  return (
    <article className="phone-card">
      <div className="phone-card-icon">
        <SocialIcon iconName={tel._icon ?? "FaPhone"} size={24} />
      </div>
      <div className="phone-card-content">
        <h3 className="phone-card-title">{tel.txt_nombre}</h3>
        <div className="phone-contacts">
          {contactos.map((c, i) => (
            <div key={i} className="phone-contact-item">
              <div className="phone-contact-content">
                <span className="phone-contact-label">{c.txt_label ?? ""}</span>
                {c.link_destino ? (
                  <a
                    href={c.link_destino}
                    target={c.link_destino.startsWith("http") ? "_blank" : undefined}
                    rel={c.link_destino.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="phone-contact-link"
                  >
                    <span className="phone-contact-icon">
                      <SocialIcon iconName={c.icon_contacto ?? tel._icon ?? "FaPhone"} size={12} />
                    </span>
                    <span>{c.txt_valor ?? ""}</span>
                  </a>
                ) : (
                  <span className="phone-contact-value">
                    <span className="phone-contact-icon">
                      <SocialIcon iconName={c.icon_contacto ?? tel._icon ?? "FaPhone"} size={12} />
                    </span>
                    <span>{c.txt_valor ?? ""}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

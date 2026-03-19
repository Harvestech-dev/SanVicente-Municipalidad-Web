import { useEffect, useState } from "react";
import { fetchCMSComponentsInBrowser } from "../../lib/cms/fetch-cms-browser";
import { getComponentsByPage } from "../../lib/cms/fetch-cms";
import type { CMSComponent } from "../../lib/cms/types";
import {
  readGobiernoPageCache,
  saveGobiernoPageCache,
} from "../../lib/cms/page-components-cache";
import {
  normalizeOrganigrama,
  getAreas,
  getDepartamentos,
  getSubsecretarias,
  type OrganigramaItem,
  type OrganigramaItemRaw,
} from "../../lib/gobierno-cms-normalize";
import "./gobierno-page-client.css";

const PAGE_GOBIERNO = "Gobierno";
const defaultProfile = "/profile.png";

interface Props {
  clientSlug: string;
  isDevelopment: boolean;
}

export default function GobiernoPageClient({ clientSlug, isDevelopment }: Props) {
  const [loading, setLoading] = useState(true);
  const [govComponents, setGovComponents] = useState<CMSComponent[]>([]);
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";

  useEffect(() => {
    if (!apiBase.trim()) {
      setLoading(false);
      return;
    }
    const context = { clientSlug, isDevelopment };
    const cached = readGobiernoPageCache(context);
    if (cached.length > 0) {
      setGovComponents(cached);
      setLoading(false);
    }
    let cancelled = false;
    (async () => {
      const all = await fetchCMSComponentsInBrowser(apiBase.trim(), { clientSlug, isDevelopment });
      if (cancelled) return;
      const filtered = getComponentsByPage(all, PAGE_GOBIERNO);
      setGovComponents(filtered);
      saveGobiernoPageCache(filtered, context);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, clientSlug, isDevelopment]);

  if (loading) {
    return (
      <main className="gobierno-cms-root">
        <div className="gobierno-cms-loading">Cargando…</div>
      </main>
    );
  }

  if (!apiBase.trim()) {
    return (
      <main className="gobierno-cms-root">
        <div className="gobierno-cms-loading">PUBLIC_API_URL no configurada</div>
      </main>
    );
  }

  const apiEncabezado = govComponents.find((c) => c.type === "gobierno_encabezado");
  const apiGabinete = govComponents.find((c) => c.type === "gabinete");
  const apiOrganigrama = govComponents.find((c) => c.type === "organigrama");

  const encabezadoData = (apiEncabezado?.data ?? {}) as Record<string, unknown>;
  const titulo = (encabezadoData.txt_titulo ?? "") as string;
  const descripcion = (encabezadoData.txt_subtitulo ?? encabezadoData.txt_descripcion ?? "") as string;

  const gabineteData = (apiGabinete?.data ?? {}) as Record<string, unknown>;
  const gabineteTitulo = (gabineteData.txt_titulo ?? "") as string;
  const gabineteSubtitulo = (gabineteData.txt_subtitulo ?? "") as string;
  const funcionariosRaw = (gabineteData.lista_funcionarios ?? []) as Array<{
    txt_nombre: string;
    txt_cargo: string;
    txt_area?: string;
    img_perfil?: string;
    txt_gestion?: string;
  }>;

  // Desde el CMS, el intendente ahora llega dentro de lista_funcionarios con área "Intendencia"
  // (y opcionalmente txt_gestion). Lo separamos para destacarlo y no duplicarlo en el gabinete.
  const intendenteFromGabinete =
    funcionariosRaw.find(
      (f) =>
        (f.txt_area ?? "").toLowerCase() === "intendencia" ||
        !!f.txt_gestion
    ) ?? null;

  const intendente = intendenteFromGabinete;
  const funcionarios = intendenteFromGabinete
    ? funcionariosRaw.filter((f) => f !== intendenteFromGabinete)
    : funcionariosRaw;

  const organigramaData = (apiOrganigrama?.data ?? {}) as Record<string, unknown>;
  const organigramaTitulo = (organigramaData.txt_titulo ?? "") as string;
  const organigramaSubtitulo = (organigramaData.txt_subtitulo ?? "") as string;
  const organigramaRaw = (organigramaData.lista_organigrama ?? []) as OrganigramaItemRaw[];
  const organigrama = normalizeOrganigrama(organigramaRaw);

  return (
    <main className="gobierno-cms-root">
      <div className="gobierno-container">
        <section className="hero-section">
          <div className="container">
            <h1>{titulo}</h1>
            <p>{descripcion}</p>
          </div>
        </section>

        {intendente && (
          <section className="autoridad-section">
            <div className="container">
              <div className="intendente-card">
                <div className="intendente-img">
                  <img src={intendente.img_perfil || defaultProfile} alt={intendente.txt_nombre} />
                </div>
                <div className="intendente-info">
                  <span className="badge">Intendencia</span>
                  <h2>{intendente.txt_nombre}</h2>
                  <p className="role">{intendente.txt_cargo}</p>
                  {intendente.txt_gestion && (
                    <p className="gestion">
                      <strong>Gestión:</strong> {intendente.txt_gestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="gabinete-section">
{ /*         <div className="container">
            <h2 className="section-title">{gabineteTitulo}</h2>*/}
            <div className="funcionarios-flex">
              {funcionarios.map((func, i) => (
                <div key={i} className="funcionario-card">
                  <img
                  className="funcionario-img"
                    src={func.img_perfil || defaultProfile}
                    alt={func.txt_nombre}
                  />
                  <div className="funcionario-details">
                    <h3>{func.txt_nombre}</h3>
                    <p>{func.txt_cargo}</p>
                  </div>
                </div>
              ))}
            </div>
         {/* </div>*/}
        </section>

        <section className="organigrama-section">
          <div className="container">
            <h2 className="section-title">{organigramaTitulo}</h2>
            {organigramaSubtitulo && <p className="organigrama-intro">{organigramaSubtitulo}</p>}
            <div className="organigrama-cards">
              {organigrama.map((sec, si) => (
                <OrganigramaCard key={si} sec={sec} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OrganigramaCard({ sec }: { sec: OrganigramaItem }) {
  const subsecretarias = getSubsecretarias(sec);
  const departamentosTop = getDepartamentos(sec);
  const areasSec = getAreas(sec);
  return (
    <article className="organigrama-card">
      <h3 className="organigrama-card-title">{sec.txt_nombre}</h3>
      <div className="organigrama-card-body">
        {subsecretarias.map((sub, sj) => {
          const deptos = getDepartamentos(sub);
          const areasSub = getAreas(sub);
          return (
            <details key={sj} className="organigrama-level organigrama-level-2">
              <summary className="organigrama-summary organigrama-summary-2">
                <span className="organigrama-name">{sub.txt_nombre}</span>
              </summary>
              <div className="organigrama-children">
                {areasSub.length > 0 && (
                  <ul className="organigrama-areas organigrama-areas-2">
                    {areasSub.map((area, i) => (
                      <li key={i}>
                        <span className="bullet" />
                        {area}
                      </li>
                    ))}
                  </ul>
                )}
                {deptos.map((depto, dk) => {
                  const areasDepto = getAreas(depto);
                  return (
                    <details key={dk} className="organigrama-level organigrama-level-3">
                      <summary className="organigrama-summary organigrama-summary-3">
                        <span className="organigrama-name">{depto.txt_nombre}</span>
                      </summary>
                      {areasDepto.length > 0 && (
                        <ul className="organigrama-areas organigrama-areas-4">
                          {areasDepto.map((area, i) => (
                            <li key={i}>
                              <span className="bullet" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })}
        {departamentosTop.map((depto, dk) => {
          const areasDepto = getAreas(depto);
          return (
            <details key={`t-${dk}`} className="organigrama-level organigrama-level-3">
              <summary className="organigrama-summary organigrama-summary-3">
                <span className="organigrama-name">{depto.txt_nombre}</span>
              </summary>
              {areasDepto.length > 0 && (
                <ul className="organigrama-areas organigrama-areas-4">
                  {areasDepto.map((area, i) => (
                    <li key={i}>
                      <span className="bullet" />
                      {area}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          );
        })}
        {areasSec.length > 0 && (
          <div className="organigrama-areas-secretaria">
            <p className="organigrama-areas-secretaria-title">Áreas</p>
            <ul className="organigrama-areas organigrama-areas-1">
              {areasSec.map((area, i) => (
                <li key={i}>
                  <span className="bullet" />
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

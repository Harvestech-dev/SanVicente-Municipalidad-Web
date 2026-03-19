import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetchCMSComponentsInBrowser } from "../../lib/cms/fetch-cms-browser";
import { getRedesFromComponents, getContactAreasFromComponents } from "../../lib/cms/fetch-cms";
import { SocialIcon } from "../SocialIcon";
import { readContactoPageCache } from "../../lib/cms/page-components-cache";

interface Props {
  clientSlug: string;
  isDevelopment: boolean;
}

type RedItem = { icon_contacto?: string; link_destino?: string; txt_label?: string };
type Oficina = {
  _boolean_isDefault?: boolean;
  lista_contacto?: Array<{ icon_contacto?: string; txt_valor?: string; link_destino?: string }>;
  lista_contactos?: Array<{ icon_contacto?: string; txt_valor?: string; link_destino?: string }>;
};

function buildContactRows(listaOficinas: Oficina[]) {
  const edificioDefault = listaOficinas.find((o) => o._boolean_isDefault);
  const contactosDefault =
    edificioDefault?.lista_contacto ?? edificioDefault?.lista_contactos ?? [];
  const getContacto = (icon: string) =>
    contactosDefault.find((c) => c.icon_contacto === icon);
  const u = getContacto("FaMapMarkerAlt");
  const t = getContacto("FaPhone");
  const e = getContacto("FaEnvelope");
  const h = getContacto("FaClock");
  return {
    txt_direccion: u?.txt_valor ?? "",
    link_direccion:
      u?.link_destino ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(u?.txt_valor ?? "")}`,
    txt_telefono: t?.txt_valor ?? "",
    link_telefono: t?.link_destino || `tel:${(t?.txt_valor ?? "").replace(/\D/g, "")}`,
    txt_email: e?.txt_valor ?? "",
    link_email: e?.link_destino || `mailto:${e?.txt_valor ?? ""}`,
    txt_horario: h?.txt_valor ?? "",
  };
}

function FooterRedesGrid({ items }: { items: RedItem[] }) {
  const list = items.filter((r) => r.link_destino);
  if (!list.length) return <p className="footer-cms-muted">Sin redes configuradas</p>;
  return (
    <>
      {list.map((redItem, i) => (
        <a
          key={i}
          href={redItem.link_destino}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          aria-label={redItem.txt_label ?? ""}
        >
          <SocialIcon iconName={redItem.icon_contacto ?? "FaLink"} size={20} />
        </a>
      ))}
    </>
  );
}

function FooterContactUl({
  contacto,
}: {
  contacto: ReturnType<typeof buildContactRows>;
}) {
  return (
    <ul className="contact-list">
      <li>
        <span className="contact-icon">
          <SocialIcon value="ubicacion" size={18} />
        </span>
        <a href={contacto.link_direccion} target="_blank" rel="noopener noreferrer" className="contact-link">
          {contacto.txt_direccion || "—"}
        </a>
      </li>
      <li>
        <span className="contact-icon">
          <SocialIcon value="telefono" size={18} />
        </span>
        <a href={contacto.link_telefono} className="contact-link">
          {contacto.txt_telefono || "—"}
        </a>
      </li>
      <li>
        <span className="contact-icon">
          <SocialIcon value="mail" size={18} />
        </span>
        <a href={contacto.link_email} className="contact-link">
          {contacto.txt_email || "—"}
        </a>
      </li>
      <li>
        <span className="contact-icon">
          <SocialIcon value="horario" size={18} />
        </span>
        <span>{contacto.txt_horario || "—"}</span>
      </li>
    </ul>
  );
}

export default function CmsLayoutHydrator({ clientSlug, isDevelopment }: Props) {
  const rootsRef = useRef<Root[]>([]);
  const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "";

  useEffect(() => {
    const elRedes = document.getElementById("cms-footer-redes-root");
    const elContact = document.getElementById("cms-footer-contact-root");
    if (!elRedes || !elContact) return;

    const mount = (redes: RedItem[], oficinas: Oficina[]) => {
      rootsRef.current.forEach((r) => {
        try {
          r.unmount();
        } catch {
          /* noop */
        }
      });
      rootsRef.current = [];
      const rootR = createRoot(elRedes);
      rootR.render(<FooterRedesGrid items={redes} />);
      rootsRef.current.push(rootR);
      const rootC = createRoot(elContact);
      rootC.render(<FooterContactUl contacto={buildContactRows(oficinas)} />);
      rootsRef.current.push(rootC);
    };

    if (!apiBase.trim()) {
      mount([], []);
      return () => {
        rootsRef.current.forEach((r) => {
          try {
            r.unmount();
          } catch {
            /* noop */
          }
        });
        rootsRef.current = [];
      };
    }

    let cancelled = false;
    const context = { clientSlug, isDevelopment };
    const contactCached = readContactoPageCache(context);
    if (contactCached.length > 0) {
      mount(
        getRedesFromComponents(contactCached),
        getContactAreasFromComponents(contactCached) as Oficina[]
      );
    }
    (async () => {
      const components = await fetchCMSComponentsInBrowser(apiBase.trim(), {
        clientSlug,
        isDevelopment,
      });
      if (cancelled) return;
      const redes = getRedesFromComponents(components);
      const oficinas = getContactAreasFromComponents(components) as Oficina[];
      mount(redes, oficinas);
    })();

    return () => {
      cancelled = true;
      rootsRef.current.forEach((r) => {
        try {
          r.unmount();
        } catch {
          /* noop */
        }
      });
      rootsRef.current = [];
    };
  }, [apiBase, clientSlug, isDevelopment]);

  return null;
}

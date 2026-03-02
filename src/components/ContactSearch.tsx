/**
 * Buscador de contactos con resultados que usan SocialIcon (react-icons/fa).
 * Mantiene la misma estructura de clases que el markup anterior para los estilos.
 */

import { useState, useMemo } from "react";
import { SocialIcon } from "./SocialIcon";

export interface SearchResultItem {
  titulo: string;
  label: string;
  valor: string;
  link: string;
  icon: string;
}

interface ContactSearchProps {
  searchIndex: SearchResultItem[];
  placeholder?: string;
}

function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function ContactSearch({ searchIndex, placeholder = "Buscar contactos..." }: ContactSearchProps) {
  const [query, setQuery] = useState("");

  const hits = useMemo(() => {
    const q = normalize(query);
    if (!q || q.length < 2) return [];
    return searchIndex.filter(
      (item) =>
        normalize(item.titulo).includes(q) ||
        normalize(item.label).includes(q) ||
        normalize(item.valor).includes(q)
    );
  }, [query, searchIndex]);

  return (
    <section className="filters-bar">
      <div className="container filters-flex">
        <div className="search-wrapper">
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            id="contact-search"
            className="search-input"
            placeholder={placeholder}
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar contactos"
          />
        </div>
      </div>
      <div className="container">
        <div
          id="search-results"
          className="search-results"
          aria-live="polite"
          hidden={query.length < 2}
        >
          {hits.length === 0 && query.length >= 2 ? (
            <p className="search-no-results">No se encontraron resultados.</p>
          ) : (
            hits.map((item, i) => {
              const hasLink = item.link && item.link.trim() !== "";
              const target = hasLink && item.link.startsWith("http") ? "_blank" : undefined;
              const rel = hasLink && item.link.startsWith("http") ? "noopener noreferrer" : undefined;
              const href = hasLink ? item.link : "#";
              const iconName = item.icon && item.icon.trim() ? item.icon : "FaLink";

              return (
                <div key={`${item.titulo}-${item.valor}-${i}`} className="search-result-item">
                  <h4 className="search-result-titulo">{item.titulo}</h4>
                  <div className="search-result-contact">
                    <span className="search-result-icon">
                      <SocialIcon iconName={iconName} size={16} />
                    </span>
                    <div className="search-result-content">
                      {item.label ? (
                        <span className="search-result-label">{item.label}</span>
                      ) : null}
                      {hasLink ? (
                        <a
                          href={href}
                          target={target}
                          rel={rel}
                          className="search-result-link"
                        >
                          {item.valor}
                        </a>
                      ) : (
                        <span className="search-result-value">{item.valor}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

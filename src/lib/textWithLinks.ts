/**
 * Detecta URLs http(s) en texto plano o fragmentos HTML y las convierte en enlaces.
 */

export const URL_IN_TEXT_RE = /\bhttps?:\/\/[^\s<>"')\]]+/gi;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Quita signos de puntuación final que suelen pegarse al URL en oraciones. */
export function normalizeUrlForHref(raw: string): string {
  let u = raw;
  while (
    u.length > 0 &&
    /[.,;:!?)\]}>'"»«“”]|…$/.test(u.slice(-1))
  ) {
    u = u.slice(0, -1);
  }
  return u;
}

export type LinkPart =
  | { type: "text"; text: string }
  | { type: "url"; href: string; raw: string };

export function splitTextToLinkParts(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  const re = new RegExp(URL_IN_TEXT_RE.source, "gi");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", text: text.slice(last, m.index) });
    }
    const raw = m[0];
    const href = normalizeUrlForHref(raw);
    parts.push(
      /^https?:\/\//i.test(href)
        ? { type: "url", href, raw }
        : { type: "text", text: raw }
    );
    last = m.lastIndex;
  }
  if (last < text.length) {
    parts.push({ type: "text", text: text.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: "text", text }];
}

export function plainTextToHtmlWithLinks(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(URL_IN_TEXT_RE, (match) => {
    const href = normalizeUrlForHref(match);
    if (!/^https?:\/\//i.test(href)) return escapeHtml(match);
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(match)}</a>`;
  });
}

export function plainTextWithNewlinesToParagraphHtml(text: string): string {
  const blocks = text.split(/\n+/).filter((b) => b.length > 0);
  if (blocks.length === 0) return "";
  return blocks.map((b) => `<p>${plainTextToHtmlWithLinks(b)}</p>`).join("");
}

/**
 * Recorre texto en nodos del DOM (excl. ya enlaces y scripts) y envuelve URLs sueltas.
 * Solo ejecutar en el navegador.
 */
export function linkifyUrlsInHtml(html: string): string {
  if (typeof document === "undefined" || !html.trim()) return html;
  try {
    const tmpl = document.createElement("template");
    tmpl.innerHTML = html.trim();

    const skipParents = new Set([
      "A",
      "SCRIPT",
      "STYLE",
      "PRE",
      "CODE",
      "TEXTAREA",
    ]);

    const textNodes: Text[] = [];
    const collect = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node as Text;
        const p = t.parentElement;
        if (
          p &&
          !skipParents.has(p.tagName) &&
          /\bhttps?:\/\//i.test(t.data)
        ) {
          textNodes.push(t);
        }
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (skipParents.has(el.tagName)) return;
        el.childNodes.forEach(collect);
      }
    };
    tmpl.content.childNodes.forEach(collect);

    const re = new RegExp(URL_IN_TEXT_RE.source, "gi");
    for (const textNode of textNodes) {
      const parent = textNode.parentNode;
      if (!parent) continue;
      const text = textNode.data;
      re.lastIndex = 0;
      if (!re.test(text)) continue;
      re.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        }
        const raw = m[0];
        const href = normalizeUrlForHref(raw);
        if (/^https?:\/\//i.test(href)) {
          const a = document.createElement("a");
          a.href = href;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = raw;
          frag.appendChild(a);
        } else {
          frag.appendChild(document.createTextNode(raw));
        }
        last = m.lastIndex;
      }
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      parent.replaceChild(frag, textNode);
    }

    return tmpl.innerHTML;
  } catch {
    return html;
  }
}

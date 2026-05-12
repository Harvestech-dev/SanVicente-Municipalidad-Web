import { splitTextToLinkParts } from "../../lib/textWithLinks";

type Props = { text: string };

/**
 * Texto plano con URLs http(s) renderizadas como enlaces (sin HTML crudo).
 */
export default function TextWithLinks({ text }: Props) {
  const parts = splitTextToLinkParts(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === "url" ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.raw}
          </a>
        ) : (
          part.text
        )
      )}
    </>
  );
}

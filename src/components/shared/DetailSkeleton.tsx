import React from "react";

type Props = {
  titleHeightPx?: number;
  imageHeightPx?: number;
  lines?: number;
};

/**
 * Skeleton liviano para páginas de detalle (noticias/agenda/programas).
 * Se renderiza en loading sin bloquear UX.
 */
export function DetailSkeleton({
  titleHeightPx = 28,
  imageHeightPx = 320,
  lines = 4,
}: Props) {
  return (
    <div className="detail-skeleton" aria-busy="true" aria-live="polite">
      <div
        style={{
          height: titleHeightPx,
          width: "65%",
          background: "#e5e7eb",
          borderRadius: 10,
          marginBottom: 16,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
      <div
        style={{
          height: imageHeightPx,
          width: "100%",
          maxWidth: 920,
          background: "#f1f5f9",
          borderRadius: 16,
          marginLeft: "auto",
          marginRight: "auto",
          overflow: "hidden",
        }}
      />
      <div style={{ maxWidth: 920, margin: "18px auto 0", padding: "0 1rem" }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 14,
              width: `${80 - i * 8}%`,
              background: "#e5e7eb",
              borderRadius: 10,
              marginTop: 12,
            }}
          />
        ))}
      </div>
    </div>
  );
}


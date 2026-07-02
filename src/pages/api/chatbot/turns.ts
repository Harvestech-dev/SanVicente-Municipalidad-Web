import type { APIRoute } from "astro";

// Proxy servidor→servidor del turnero. Necesario porque el chatbot es HTML
// estático servido por HTTPS y el backend de turnos está en HTTP + IP (mixed
// content) y requiere una API key que no puede exponerse en el cliente.
export const prerender = false;

const UPSTREAM =
  import.meta.env.TURNS_API_URL ||
  process.env.TURNS_API_URL ||
  "http://72.60.156.83/api/appointments/chatbot/turns";

const KEY = import.meta.env.TURNS_API_KEY || process.env.TURNS_API_KEY;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const GET: APIRoute = async ({ url }) => {
  if (!KEY) return json({ error: "Turnero no configurado (falta TURNS_API_KEY)." }, 500);

  const procedureId = url.searchParams.get("procedure_id") || "2";
  const upstream = `${UPSTREAM}?procedure_id=${encodeURIComponent(procedureId)}`;

  try {
    const r = await fetch(upstream, {
      headers: { "X-Api-Key": KEY, Accept: "application/json" },
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // cache corto: los cupos cambian, pero evita golpear el upstream en cada swipe de mes
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch {
    return json({ error: "No se pudo conectar con el turnero." }, 502);
  }
};

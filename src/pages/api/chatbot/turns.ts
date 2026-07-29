import type { APIRoute } from "astro";

// Proxy servidor→servidor del turnero. Necesario porque el chatbot es HTML
// estático servido por HTTPS y la API key no puede exponerse en el cliente.
export const prerender = false;

const BASE =
  (import.meta.env.PUBLIC_API_VECINO_URL || process.env.PUBLIC_API_VECINO_URL || "").replace(/\/$/, "");

const UPSTREAM = BASE
  ? `${BASE}/appointments/chatbot/turns`
  : "http://72.60.156.83/api/appointments/chatbot/turns";

const KEY = import.meta.env.TURNS_API_KEY || process.env.TURNS_API_KEY;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const GET: APIRoute = async ({ url }) => {
  if (!KEY) return json({ error: "Turnero no configurado (falta TURNS_API_KEY)." }, 500);

  const upstream = new URL(UPSTREAM);
  // Forwardear todos los query params que mande el cliente
  url.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  try {
    const r = await fetch(upstream.toString(), {
      headers: { "X-Api-Key": KEY, Accept: "application/json" },
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch {
    return json({ error: "No se pudo conectar con el turnero." }, 502);
  }
};

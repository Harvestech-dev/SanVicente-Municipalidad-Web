import type { APIRoute } from "astro";

// Proxy servidor→servidor para reservar el turno (POST).
// Oculta la API key y evita mixed-content desde el chatbot estático (HTTPS→HTTP).
export const prerender = false;

const BASE =
  (import.meta.env.PUBLIC_API_VECINO_URL || process.env.PUBLIC_API_VECINO_URL || "").replace(/\/$/, "");

const BOOK_URL = BASE
  ? `${BASE}/appointments/chatbot`
  : "http://72.60.156.83/api/appointments/chatbot";

const KEY = import.meta.env.TURNS_API_KEY || process.env.TURNS_API_KEY;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const POST: APIRoute = async ({ request }) => {
  if (!KEY) return json({ error: "Turnero no configurado (falta TURNS_API_KEY)." }, 500);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }

  console.log("[chatbot/appointments] POST", BOOK_URL, "body:", JSON.stringify(body));

  try {
    const r = await fetch(BOOK_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    console.log("[chatbot/appointments] status:", r.status, "response:", text);
    return new Response(text, {
      status: r.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.error("[chatbot/appointments] error:", err);
    return json({ error: "No se pudo conectar con el turnero." }, 502);
  }
};

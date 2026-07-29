import type { APIRoute } from "astro";

// DEBUG ONLY — no usar en producción.
// Llama a /appointments/chatbot/procedures para verificar trámites disponibles y sus IDs.
export const prerender = false;

const BASE =
  (import.meta.env.PUBLIC_API_VECINO_URL || process.env.PUBLIC_API_VECINO_URL || "").replace(/\/$/, "");

const UPSTREAM = BASE
  ? `${BASE}/appointments/chatbot/procedures`
  : "http://72.60.156.83/api/appointments/chatbot/procedures";

const KEY = import.meta.env.TURNS_API_KEY || process.env.TURNS_API_KEY;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const GET: APIRoute = async () => {
  if (!KEY) return json({ error: "Falta TURNS_API_KEY." }, 500);

  console.log("[chatbot/procedures] GET", UPSTREAM);

  try {
    const r = await fetch(UPSTREAM, {
      headers: { "X-Api-Key": KEY, Accept: "application/json" },
    });
    const text = await r.text();
    console.log("[chatbot/procedures] status:", r.status, "response:", text);
    return new Response(text, {
      status: r.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.error("[chatbot/procedures] error:", err);
    return json({ error: "No se pudo conectar." }, 502);
  }
};

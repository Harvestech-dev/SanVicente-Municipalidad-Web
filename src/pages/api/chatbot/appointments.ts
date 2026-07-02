import type { APIRoute } from "astro";

// Proxy servidor→servidor para reservar el turno (POST). Igual que turns.ts:
// oculta la API key y evita mixed-content desde el chatbot estático (HTTPS→HTTP).
// Upstream: POST http://<host>/api/appointments/chatbot
//   body: { Dni, Firstname, Lastname, turn_id }
//   resp: { appointment_id, appointment_code }
export const prerender = false;

const TURNS_URL =
  import.meta.env.TURNS_API_URL ||
  process.env.TURNS_API_URL ||
  "http://72.60.156.83/api/appointments/chatbot/turns";

// La reserva vive en el path padre de /turns.
const BOOK_URL = TURNS_URL.replace(/\/turns\/?$/, "");

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
    return new Response(text, {
      status: r.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return json({ error: "No se pudo conectar con el turnero." }, 502);
  }
};

/* Mercado Pago avisa aquí cuando cambia un pago (notification_url de api/checkout.js).
   No se le cree al aviso: solo trae el número del pago. Se le pregunta a Mercado Pago,
   con nuestro token, cómo quedó ese pago, y con ESA respuesta se marca el pedido en la
   hoja. Un aviso inventado, a lo sumo, hace que se consulte un pago real.
   Responder 200 le dice que no reintente; cualquier otro código hace que repita.

   Variables en Vercel: MP_ACCESS_TOKEN y NANDEZ_CLAVE. */
import { catalogo, hoja, leerCuerpo, registroDe } from "./_tienda.js";

const ESTADOS = { approved: "aprobado", rejected: "rechazado", cancelled: "rechazado",
  refunded: "anulado", charged_back: "anulado" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const token = process.env.MP_ACCESS_TOKEN || "";
  if (!token) return res.status(503).json({ ok: false, error: "sin-token" });
  const b = leerCuerpo(req), q = req.query || {};
  const tipo = b.type || b.topic || q.type || q.topic;
  const id = String(b.data?.id || q["data.id"] || q.id || "").replace(/\D/g, "");
  if (tipo !== "payment" || !id) return res.status(200).json({ ok: true, ignorado: tipo || "nada" });
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return res.status(r.status === 404 ? 200 : 502).json({ ok: r.status === 404, error: "pago" });
    const p = await r.json(), estado = ESTADOS[p.status];
    /* pendiente o en proceso: el resultado llega en otro aviso */
    if (!estado || !p.external_reference || p.currency_id !== "COP") return res.status(200).json({ ok: true, ignorado: p.status });
    const cat = await catalogo(req);
    const h = await hoja(registroDe(cat), { accion: "pago", clave: process.env.NANDEZ_CLAVE, id: String(p.external_reference),
      estado, monto: Math.round(Number(p.transaction_amount)), transaccion: String(p.id),
      metodo: String(p.payment_type_id || ""), pasarela: "mercadopago" });
    /* un pedido que la hoja no conoce no se va a arreglar reintentando */
    if (!h.ok && h.error !== "no") return res.status(502).json({ ok: false, error: h.error });
    return res.status(200).json({ ok: true, ...h });
  } catch {
    return res.status(502).json({ ok: false, error: "hoja" });
  }
}

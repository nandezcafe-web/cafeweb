/* Abre un cobro de Mercado Pago (Checkout Pro) para el carrito. Igual que api/pago.js:
   el navegador solo dice QUÉ quiere comprar; aquí se vuelve a hacer la cuenta con los
   precios del catálogo, se apartan las bolsas en la hoja (en preventa, el cupo) y la
   preferencia se crea con el monto del servidor. Nadie puede cambiar el precio.

   Variables en Vercel (Settings → Environment Variables), NUNCA en el repositorio:
   - MP_ACCESS_TOKEN   el Access Token de producción (APP_USR-…) o de pruebas (TEST-…)
   - NANDEZ_CLAVE      la clave del panel (la que deja "configurar" en Apps Script)
   - REGISTRO_URL      opcional: por defecto se usa CONFIG.registro del catálogo

   Quien marca el pedido como pagado es api/webhook.js, no lo que diga la página. */
import { abrirPedido, leerCuerpo } from "./_tienda.js";

/* El cobro vence a la media hora: después, la hoja libera la reserva */
const VENCE_MIN = 30;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "metodo" });
  const token = process.env.MP_ACCESS_TOKEN || "";
  if (!token) return res.status(503).json({ ok: false, error: "sin-pasarela" });
  const b = leerCuerpo(req);
  const o = await abrirPedido(req, b, "mercadopago");
  if (!o.ok) return res.status(o.status).json(o.cuerpo);
  const { id: pedido, q, c, bono, idioma } = o;
  try {
    const en = idioma === "en", base = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
    /* Mercado Pago no recibe líneas negativas: con bono, el pedido va en una sola línea
       por el total exacto; sin bono, una línea por café y el envío aparte. */
    const unica = q.descuento > 0;
    const preferencia = {
      items: unica
        ? [{ id: pedido, title: `${en ? "Order" : "Pedido"} ${pedido} · Nandez Coffee`, quantity: 1, unit_price: q.total, currency_id: "COP" }]
        : q.lineas.map((l) => ({ id: `${l.id}-${l.g}`, title: l.nombre.slice(0, 250), quantity: l.n, unit_price: l.precio, currency_id: "COP" })),
      ...(unica ? {} : { shipments: { mode: "not_specified", cost: q.envio } }),
      payer: { name: c.nombre, surname: c.apellidos, email: c.correo,
        phone: { number: c.tel.replace(/\D/g, "").slice(-10) },
        identification: { type: /-/.test(c.documento) ? "NIT" : "CC", number: c.documento.replace(/[^\dA-Za-z]/g, "") } },
      external_reference: pedido,
      statement_descriptor: "NANDEZ COFFEE",
      /* sin efectivo: un cobro en corresponsal tarda días y la reserva se libera a las 2 h */
      payment_methods: { excluded_payment_types: [{ id: "ticket" }], installments: 1 },
      back_urls: { success: `${base}/?pago=ok&pedido=${pedido}`, pending: `${base}/?pago=pendiente&pedido=${pedido}`, failure: `${base}/?pago=fallo&pedido=${pedido}` },
      auto_return: "approved",
      notification_url: `${base}/api/webhook`,
      expires: true, expiration_date_to: new Date(Date.now() + VENCE_MIN * 60 * 1000).toISOString(),
    };
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(preferencia),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.init_point) {
      console.error("checkout MP", r.status, data.message || "");
      return res.status(502).json({ ok: false, error: "pasarela" });
    }
    return res.status(200).json({ ok: true, reference: pedido, url: data.init_point,
      subtotal: q.subtotal, descuento: q.descuento, envio: q.envio, total: q.total, iva: q.iva, bono, lineas: q.lineas });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "pasarela" });
  }
}

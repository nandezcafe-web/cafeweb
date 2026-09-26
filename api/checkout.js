/* Crea una preferencia de pago en Mercado Pago (Checkout Pro) y devuelve el link.
   Requiere la variable de entorno MP_ACCESS_TOKEN en Vercel (Settings → Environment Variables).
   El token NUNCA va en el repositorio. */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: "Falta MP_ACCESS_TOKEN" });

  try {
    const { items = [], pedido = "", comprador = {} } = req.body || {};
    if (!items.length) return res.status(400).json({ error: "Pedido vacío" });

    const base = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
    const preferencia = {
      items: items.map((i) => ({
        id: String(i.id), title: String(i.title).slice(0, 250),
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        unit_price: Math.round(Number(i.unit_price) || 0),
        currency_id: "COP",
      })),
      payer: { name: comprador.nombre || "", phone: { number: comprador.tel || "" } },
      external_reference: String(pedido),
      statement_descriptor: "NANDEZ CAFE",
      back_urls: { success: `${base}/?pago=ok`, pending: `${base}/?pago=pendiente`, failure: `${base}/?pago=fallo` },
      auto_return: "approved",
      notification_url: `${base}/api/webhook`,
    };

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(preferencia),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message || "Mercado Pago rechazó la preferencia" });
    res.status(200).json({ id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });
  } catch (e) {
    res.status(500).json({ error: "No se pudo crear el pago" });
  }
}

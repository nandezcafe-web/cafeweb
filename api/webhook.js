/* Mercado Pago avisa aquí cuando cambia un pago.
   Por ahora solo confirma la recepción y deja el registro en los logs de Vercel.
   Siguiente paso: guardar el pedido en una base de datos y enviar el correo de confirmación. */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const token = process.env.MP_ACCESS_TOKEN;
  try {
    const id = req.body?.data?.id || req.query?.["data.id"];
    const tipo = req.body?.type || req.query?.type;
    if (tipo === "payment" && id && token) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const pago = await r.json();
      console.log("pago", pago.id, pago.status, pago.external_reference, pago.transaction_amount);
    }
  } catch (e) {
    console.error("webhook", e.message);
  }
  res.status(200).json({ ok: true });   // Mercado Pago reintenta si no recibe 200
}

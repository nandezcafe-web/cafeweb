/* Cobra con tarjeta DENTRO de la página (Checkout Bricks de Mercado Pago). La tarjeta
   nunca llega aquí: el navegador manda un token de un solo uso que generó Mercado Pago
   en sus propios campos. Igual que api/checkout.js, la cuenta la hace el servidor con
   el catálogo y la hoja aparta las bolsas, todo o nada; el monto que se cobra es el del
   servidor, nunca el que diga la página.

   Variables en Vercel: MP_ACCESS_TOKEN y NANDEZ_CLAVE (las mismas de api/checkout.js).
   En la página: CONFIG.pagos.mp.llavePublica (la llave pública, que no es secreta). */
import { abrirPedido, catalogo, hoja, leerCuerpo, registroDe } from "./_tienda.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "metodo" });
  const token = process.env.MP_ACCESS_TOKEN || "", clave = process.env.NANDEZ_CLAVE || "";
  if (!token) return res.status(503).json({ ok: false, error: "sin-pasarela" });
  const b = leerCuerpo(req), t = b.tarjeta || {};
  if (!/^[\w-]{8,}$/.test(String(t.token || "")) || !t.payment_method_id) return res.status(400).json({ ok: false, error: "tarjeta" });

  const o = await abrirPedido(req, b, "mercadopago");
  if (!o.ok) return res.status(o.status).json(o.cuerpo);
  const { id: pedido, q, c, bono } = o;
  const registro = registroDe(await catalogo(req));
  const aHoja = (cuerpo) => hoja(registro, { clave, id: pedido, pasarela: "mercadopago", ...cuerpo }).catch(() => null);

  /* Lo que la persona vio en el botón. Si el catálogo cambió desde que abrió la página,
     no se le cobra otro valor en silencio: se suelta la reserva y se le muestra el nuevo. */
  if (Number(b.total) !== q.total) {
    await aHoja({ accion: "pedido", estado: "cancelado", soloReserva: true });
    return res.status(409).json({ ok: false, error: "total-cambio", total: q.total });
  }

  const resumen = { reference: pedido, subtotal: q.subtotal, descuento: q.descuento, envio: q.envio, total: q.total, iva: q.iva, bono, lineas: q.lineas };
  const base = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
  const doc = t.identificacion?.number
    ? { type: String(t.identificacion.type || "CC").slice(0, 10), number: String(t.identificacion.number).replace(/[^\dA-Za-z]/g, "") }
    : { type: /-/.test(c.documento) ? "NIT" : "CC", number: c.documento.replace(/[^\dA-Za-z]/g, "") };
  const pago = {
    transaction_amount: q.total, token: String(t.token), installments: 1,
    payment_method_id: String(t.payment_method_id), ...(t.issuer_id ? { issuer_id: String(t.issuer_id) } : {}),
    description: `Pedido ${pedido} · Nandez Coffee`,
    payer: { email: c.correo, first_name: c.nombre, last_name: c.apellidos, identification: doc },
    external_reference: pedido, notification_url: `${base}/api/webhook`, statement_descriptor: "NANDEZ COFFEE",
    /* Aprobado o rechazado de una vez, sin «en revisión»: una reserva no queda colgada
       esperando a un analista. */
    binary_mode: true,
    /* Lo que ayuda al banco a aprobar: qué se compra, quién y a dónde va */
    additional_info: {
      items: q.lineas.map((l) => ({ id: `${l.id}-${l.g}`, title: l.nombre.slice(0, 250), quantity: l.n, unit_price: l.precio })),
      payer: { first_name: c.nombre, last_name: c.apellidos, phone: { number: c.tel.replace(/\D/g, "").slice(-10) }, address: { street_name: c.direccion } },
      shipments: { receiver_address: { street_name: c.direccion, city_name: c.ciudad, state_name: c.departamento } },
    },
  };
  let r, p;
  try {
    r = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      /* La llave de idempotencia es el número de la reserva: si la página repite la llamada,
         Mercado Pago devuelve el mismo pago en vez de cobrar dos veces. */
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Idempotency-Key": pedido },
      body: JSON.stringify(pago),
    });
    p = await r.json().catch(() => ({}));
  } catch {
    return res.status(502).json({ ok: false, error: "pasarela", reference: pedido });
  }
  if (!r.ok || !p.status) {
    console.error("tarjeta MP", r.status, p.message || "");
    return res.status(502).json({ ok: false, error: "pasarela", reference: pedido });
  }
  const datosPago = { monto: Math.round(Number(p.transaction_amount) || 0), transaccion: String(p.id || ""), metodo: String(p.payment_type_id || "credit_card") };
  if (p.status === "approved") {
    /* La respuesta viene de Mercado Pago con nuestro token: se marca pagado ya, sin
       esperar el aviso. Cuando el aviso llegue a api/webhook.js, la hoja ve que ya
       estaba pagado y no repite nada (ni los correos). */
    await aHoja({ accion: "pago", estado: "aprobado", ...datosPago });
    return res.status(200).json({ ok: true, estado: "aprobado", ...resumen });
  }
  if (p.status === "in_process" || p.status === "pending") return res.status(200).json({ ok: true, estado: "pendiente", ...resumen });
  /* Rechazado: la reserva sigue para que pruebe con otra tarjeta; si no, se libera sola */
  await aHoja({ accion: "pago", estado: "rechazado", ...datosPago });
  return res.status(402).json({ ok: false, error: "rechazado", detalle: String(p.status_detail || ""), reference: pedido });
}

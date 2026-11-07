/* Abre un cobro de Wompi para el carrito. Vuelve a hacer la cuenta con los precios
   del catálogo, aparta las bolsas en la hoja y firma el monto con el secreto de
   integridad: así nadie puede cambiar desde el navegador lo que se cobra.

   Variables en Vercel (Settings → Environment Variables), NUNCA en el repositorio:
   - WOMPI_INTEGRIDAD  test_integrity_… para pruebas, prod_integrity_… para vender
   - NANDEZ_CLAVE      la clave del panel (la que deja "configurar" en Apps Script)
   - REGISTRO_URL      opcional: por defecto se usa CONFIG.registro del catálogo */
import { abrirPedido, leerCuerpo, sha256 } from "./_tienda.js";

/* El cobro vence a la media hora: después, la hoja libera la reserva */
const VENCE_MIN = 30;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "metodo" });
  const secreto = process.env.WOMPI_INTEGRIDAD || "";
  if (!secreto) return res.status(503).json({ ok: false, error: "sin-pasarela" });
  const b = leerCuerpo(req);
  /* llave pública de pruebas con secreto de producción (o al revés) = cobro que falla */
  const llave = String(b.llavePublica || "");
  if (llave && llave.startsWith("pub_test_") !== secreto.startsWith("test_"))
    return res.status(500).json({ ok: false, error: "llaves-cruzadas" });
  const o = await abrirPedido(req, b, "wompi");
  if (!o.ok) return res.status(o.status).json(o.cuerpo);
  const { id: pedido, q, bono } = o;
  try {
    const amountInCents = q.total * 100, currency = "COP";
    const expirationTime = new Date(Date.now() + VENCE_MIN * 60 * 1000).toISOString();
    /* Firma de integridad de Wompi: referencia, monto, moneda, vencimiento y secreto, en ese orden */
    const integrity = sha256(`${pedido}${amountInCents}${currency}${expirationTime}${secreto}`);
    return res.status(200).json({ ok: true, reference: pedido, amountInCents, currency, expirationTime,
      signature: { integrity }, taxInCents: { vat: q.iva * 100, consumption: 0 },
      subtotal: q.subtotal, descuento: q.descuento, envio: q.envio, total: q.total, iva: q.iva, bono, lineas: q.lineas });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "hoja" });
  }
}

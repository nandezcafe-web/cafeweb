/* Abre un cobro de Wompi para el carrito. Vuelve a hacer la cuenta con los precios
   del catálogo, aparta las bolsas en la hoja y firma el monto con el secreto de
   integridad: así nadie puede cambiar desde el navegador lo que se cobra.

   Variables en Vercel (Settings → Environment Variables), NUNCA en el repositorio:
   - WOMPI_INTEGRIDAD  test_integrity_… para pruebas, prod_integrity_… para vender
   - NANDEZ_CLAVE      la clave del panel (la que deja "configurar" en Apps Script)
   - REGISTRO_URL      opcional: por defecto se usa CONFIG.registro del catálogo */
import { catalogo, cotizar, comprador, hoja, hojaGet, leerCuerpo, numeroPedido, registroDe, sha256 } from "./_tienda.js";

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
  try {
    const cat = await catalogo(req), registro = registroDe(cat);
    if (!registro) return res.status(503).json({ ok: false, error: "sin-hoja" });
    const c = comprador(b.comprador);
    if (c.error) return res.status(400).json({ ok: false, error: c.error });

    let pct = 0, bono = "";
    if (b.bono) {
      const v = await hojaGet(registro, { accion: "bono", codigo: String(b.bono).trim().toUpperCase().slice(0, 20) });
      if (!v.ok) return res.status(400).json({ ok: false, error: "bono", motivo: v.error || "no" });
      pct = Number(v.pct) || 0; bono = v.codigo;
    }
    const q = cotizar(cat, b.items, pct);
    if (q.error) return res.status(400).json({ ok: false, ...q });

    /* Si la persona reintenta, la reserva anterior que no pagó se suelta primero.
       La hoja solo la cancela si sigue sin pagar y es de la pasarela. */
    if (b.reemplaza && process.env.NANDEZ_CLAVE)
      await hoja(registro, { accion: "pedido", clave: process.env.NANDEZ_CLAVE, id: String(b.reemplaza).slice(0, 40),
        estado: "cancelado", soloReserva: true }).catch(() => null);

    const id = numeroPedido(), idioma = b.idioma === "en" ? "en" : "es";
    const r = await hoja(registro, { tipo: "pedido", id, canal: "wompi", idioma,
      nombre: `${c.d.nombre} ${c.d.apellidos}`, documento: c.d.documento, tel: c.d.tel, correo: c.d.correo,
      direccion: c.d.direccion, detalle: c.d.detalle, ciudad: c.d.ciudad, departamento: c.d.departamento,
      items: q.lineas, subtotal: q.subtotal, descuento: q.descuento, bono, envio: q.envio, total: q.total, iva: q.iva });
    if (!r || !r.ok) return res.status(502).json({ ok: false, error: "hoja" });
    /* Con pasarela es todo o nada: si falta una bolsa, la hoja no aparta ninguna */
    if (r.faltan && r.faltan.length) return res.status(409).json({ ok: false, error: "agotado", faltan: r.faltan });

    const amountInCents = q.total * 100, currency = "COP";
    const expirationTime = new Date(Date.now() + VENCE_MIN * 60 * 1000).toISOString();
    /* Firma de integridad de Wompi: referencia, monto, moneda, vencimiento y secreto, en ese orden */
    const integrity = sha256(`${r.pedido}${amountInCents}${currency}${expirationTime}${secreto}`);
    return res.status(200).json({ ok: true, reference: r.pedido, amountInCents, currency, expirationTime,
      signature: { integrity }, taxInCents: { vat: q.iva * 100, consumption: 0 },
      subtotal: q.subtotal, descuento: q.descuento, envio: q.envio, total: q.total, iva: q.iva, bono, lineas: q.lineas });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "hoja" });
  }
}

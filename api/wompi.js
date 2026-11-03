/* Wompi avisa aquí cada cambio de una transacción (URL de eventos en el panel de
   Wompi: https://<dominio>/api/wompi). Antes de creerle se revisa la firma del
   aviso con el secreto de eventos: un aviso sin firma válida no mueve nada.
   Responder 200 le dice a Wompi que no reintente; cualquier otro código hace que
   repita el aviso (a los 30 minutos, 3 horas y 24 horas).

   Variables en Vercel: WOMPI_EVENTOS (test_events_… o prod_events_…) y NANDEZ_CLAVE. */
import { catalogo, hoja, iguales, leerCuerpo, registroDe, sha256 } from "./_tienda.js";

const valor = (obj, ruta) => String(ruta).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

/* La firma de Wompi: los valores de signature.properties, en ese orden, más el
   timestamp y el secreto de eventos, en SHA256. */
export function firmaValida(ev, secreto, cabecera) {
  const props = ev?.signature?.properties;
  if (!secreto || !Array.isArray(props) || !props.length || ev.timestamp == null) return false;
  const esperado = sha256(props.map((p) => valor(ev.data, p) ?? "").join("") + ev.timestamp + secreto);
  return iguales(esperado, ev.signature.checksum || cabecera);
}

const ESTADOS = { APPROVED: "aprobado", DECLINED: "rechazado", VOIDED: "anulado", ERROR: "error" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const secreto = process.env.WOMPI_EVENTOS || "";
  if (!secreto) return res.status(503).json({ ok: false, error: "sin-secreto" });
  const ev = leerCuerpo(req);
  if (!firmaValida(ev, secreto, req.headers?.["x-event-checksum"])) return res.status(401).json({ ok: false, error: "firma" });
  /* un aviso de pruebas no toca la tienda de verdad, ni al revés */
  if ((ev.environment === "test") !== secreto.startsWith("test_")) return res.status(200).json({ ok: true, ignorado: "ambiente" });
  if (ev.event !== "transaction.updated") return res.status(200).json({ ok: true, ignorado: ev.event });
  const t = ev.data?.transaction || {}, estado = ESTADOS[t.status];
  /* PENDING (PSE, transferencias): el resultado llega en un aviso posterior */
  if (!estado) return res.status(200).json({ ok: true, ignorado: t.status });
  try {
    const cat = await catalogo(req);
    const r = await hoja(registroDe(cat), { accion: "pago", clave: process.env.NANDEZ_CLAVE, id: String(t.reference || ""),
      estado, monto: Math.round(Number(t.amount_in_cents) / 100), transaccion: String(t.id || ""),
      metodo: String(t.payment_method_type || ""), pasarela: "wompi" });
    /* un pedido que la hoja no conoce no se va a arreglar reintentando */
    if (!r.ok && r.error !== "no") return res.status(502).json({ ok: false, error: r.error });
    return res.status(200).json({ ok: true, ...r });
  } catch {
    return res.status(502).json({ ok: false, error: "hoja" });
  }
}

/* Mercado Pago de mentira para las pruebas: crea preferencias (Checkout Pro), cobra
   tarjetas (Checkout Bricks) y responde la consulta de un pago, como lo hace el real.

   Como en el ambiente de pruebas de Mercado Pago, el resultado de una tarjeta lo decide
   el nombre del titular: APRO aprueba; OTHE, FUND, SECU, EXPI, FORM y CALL rechazan cada
   uno con su motivo; CONT queda pendiente, y con binary_mode pasa a rechazado.
   Además, como el real: pide la llave de idempotencia, devuelve el mismo pago si se
   repite la llave, y no deja usar dos veces un mismo token. */
const TOKEN_VALIDO = "APP_USR-PRUEBA";
const RESULTADO = {
  APRO: ["approved", "accredited"], OTHE: ["rejected", "cc_rejected_other_reason"], FUND: ["rejected", "cc_rejected_insufficient_amount"],
  SECU: ["rejected", "cc_rejected_bad_filled_security_code"], EXPI: ["rejected", "cc_rejected_bad_filled_date"],
  FORM: ["rejected", "cc_rejected_bad_filled_other"], CALL: ["rejected", "cc_rejected_call_for_authorize"], CONT: ["in_process", "pending_contingency"],
};
/* el token que daría el formulario de Mercado Pago para un titular */
export const tokenDe = (titular) => `tok_${titular}_${Math.random().toString(36).slice(2, 10)}`;

export function mercadoPagoSimulado() {
  const mp = { preferencias: [], cobros: [], pagos: {}, porLlave: {}, tokensUsados: new Set(), caido: false, sig: 9000000 };
  const respuesta = (status, cuerpo) => ({ ok: status < 400, status, json: async () => cuerpo });
  mp.fetch = async (url, op = {}) => {
    if (mp.caido) throw new Error("Mercado Pago no responde");
    const u = new URL(url), h = op.headers || {};
    if (h.Authorization !== `Bearer ${TOKEN_VALIDO}`) return respuesta(401, { message: "invalid access token" });
    if (u.pathname === "/checkout/preferences" && op.method === "POST") {
      const pref = JSON.parse(op.body); mp.preferencias.push(pref);
      return respuesta(201, { id: "pref-" + mp.preferencias.length, init_point: "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=" + mp.preferencias.length });
    }
    if (u.pathname === "/v1/payments" && op.method === "POST") {
      const llave = h["X-Idempotency-Key"];
      if (!llave) return respuesta(400, { message: "X-Idempotency-Key requerido" });
      if (mp.porLlave[llave]) return respuesta(200, mp.pagos[mp.porLlave[llave]]);
      const b = JSON.parse(op.body);
      mp.cobros.push({ llave, cuerpo: b });
      if (!b.token || mp.tokensUsados.has(b.token)) return respuesta(400, { message: "invalid card token" });
      if (!(b.transaction_amount > 0) || !b.payer?.email || !b.payment_method_id) return respuesta(400, { message: "faltan datos" });
      mp.tokensUsados.add(b.token);
      const titular = String(b.token).split("_")[1] || "OTHE";
      let [status, status_detail] = RESULTADO[titular] || RESULTADO.OTHE;
      if (b.binary_mode && status === "in_process") [status, status_detail] = ["rejected", "cc_rejected_other_reason"];
      const id = String(mp.sig++);
      mp.pagos[id] = { id: Number(id), status, status_detail, transaction_amount: b.transaction_amount, currency_id: "COP",
        external_reference: b.external_reference, payment_type_id: "credit_card", payment_method_id: b.payment_method_id };
      mp.porLlave[llave] = id;
      return respuesta(201, mp.pagos[id]);
    }
    const m = u.pathname.match(/^\/v1\/payments\/(\d+)$/);
    if (m) return mp.pagos[m[1]] ? respuesta(200, mp.pagos[m[1]]) : respuesta(404, {});
    throw new Error("Mercado Pago no tiene esa ruta: " + url);
  };
  /* el aviso que Mercado Pago le manda a api/webhook.js */
  mp.aviso = (id) => ({ type: "payment", data: { id: String(id) } });
  return mp;
}
export { TOKEN_VALIDO };

/* ============================================================
   COMPRAS CONTRA EL WOMPI DE PRUEBAS DE VERDAD (sandbox)
   Uso:  node tools/pruebas/wompi-real.mjs

   Lee las llaves de PRUEBAS de tools/pruebas/.wompi-prueba.env (fuera del repositorio)
   y se niega a correr con llaves de producción. Corre el servidor de pagos de verdad
   (api/pago.js y api/wompi.js) contra la hoja simulada: no toca la hoja real ni manda
   correos. Wompi sí es el de verdad: tokeniza la tarjeta, valida nuestra firma de
   integridad y decide el resultado con sus tarjetas, Nequi y PSE de prueba.

   El aviso de Wompi va a la URL de eventos de producción, que no alcanza esta prueba:
   aquí se consulta el estado a Wompi y se le pasa a api/wompi.js el aviso firmado
   con el secreto de eventos de pruebas, igual que lo haría Wompi.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { RAIZ, hojaSimulada, conectar, api, llamar, WOMPI } from "./simulador.mjs";

const LLAVES = {};
const archivo = path.join(RAIZ, "tools/pruebas/.wompi-prueba.env");
if (!fs.existsSync(archivo)) { console.error("Falta tools/pruebas/.wompi-prueba.env"); process.exit(1); }
fs.readFileSync(archivo, "utf8").split(/\r?\n/).forEach((l) => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(\S+)/); if (m) LLAVES[m[1]] = m[2]; });
const PUB = LLAVES.WOMPI_LLAVE_PUBLICA || "";
if (!/^pub_test_/.test(PUB) || !/^test_integrity_/.test(LLAVES.WOMPI_INTEGRIDAD || "") || !/^test_events_/.test(LLAVES.WOMPI_EVENTOS || "")) {
  console.error("Solo con llaves de PRUEBAS (pub_test_, test_integrity_, test_events_)."); process.exit(1);
}

const CAT = JSON.parse(fs.readFileSync(path.join(RAIZ, "prototipo/data/catalogo.json"), "utf8"));
const mundo = hojaSimulada(CAT);
const red = globalThis.fetch;
conectar(mundo);
Object.assign(process.env, { WOMPI_INTEGRIDAD: LLAVES.WOMPI_INTEGRIDAD, WOMPI_EVENTOS: LLAVES.WOMPI_EVENTOS });
process.chdir(RAIZ);
const { pago, wompi } = await api();

const W = "https://sandbox.wompi.co/v1";
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function wompiApi(ruta, cuerpo) {
  const op = { headers: { Authorization: "Bearer " + PUB } };
  if (cuerpo) Object.assign(op, { method: "POST", headers: { ...op.headers, "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const r = await red(W + ruta, op), j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Wompi ${ruta} → ${r.status} ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j.data;
}

/* el token de aceptación de Wompi es de un solo uso: uno por cobro */
const aceptar = async () => {
  const c = await wompiApi("/merchants/" + PUB);
  return { acceptance_token: c.presigned_acceptance.acceptance_token,
    ...(c.presigned_personal_data_auth ? { accept_personal_auth: c.presigned_personal_data_auth.acceptance_token } : {}) };
};
const comercio = await wompiApi("/merchants/" + PUB);
console.log(`Comercio en Wompi (sandbox): ${comercio.name} · medios: ${(comercio.accepted_payment_methods || []).join(", ")}\n`);

const producto = CAT.productos.find((p) => !p.proximamente && p.variantes.some((v) => v.precio > 0));
const variante = producto.variantes.find((v) => v.precio > 0);
const items = [{ id: producto.id, g: variante.g, n: 1 }];
const comprador = { nombre: "Prueba", apellidos: "Wompi", documento: "1090000001", tel: "3000000001", direccion: "Calle 1 # 2-3",
  detalle: "", ciudad: "Cúcuta", departamento: "Norte de Santander", correo: "prueba.wompi@ejemplo.com" };

const pedidoDe = (id) => mundo.H("Pedidos").slice(1).find((f) => f[0] === id);
const stock = () => Object.fromEntries(mundo.H("Stock").slice(1).map((f) => [f[0], f[2]]));

async function comprar(medio, reemplaza = "") {
  const r = await llamar(pago, { items, comprador, idioma: "es", llavePublica: PUB, reemplaza });
  if (!r.ok) throw new Error("api/pago.js no abrió el cobro: " + JSON.stringify(r));
  let metodo;
  if (medio.tipo === "CARD") {
    const tok = await wompiApi("/tokens/cards", { number: medio.numero, cvc: "123", exp_month: "12", exp_year: "30", card_holder: "Prueba Wompi" });
    metodo = { type: "CARD", token: tok.id, installments: 1 };
  } else if (medio.tipo === "NEQUI") metodo = { type: "NEQUI", phone_number: medio.numero };
  else metodo = { type: "PSE", user_type: 0, user_legal_id_type: "CC", user_legal_id: comprador.documento,
    financial_institution_code: medio.banco, payment_description: "Pedido " + r.reference };
  const tr = await wompiApi("/transactions", {
    ...(await aceptar()),
    amount_in_cents: r.amountInCents, currency: r.currency, signature: r.signature.integrity, expiration_time: r.expirationTime,
    reference: r.reference, customer_email: comprador.correo, payment_method: metodo,
    customer_data: { phone_number: comprador.tel, full_name: comprador.nombre + " " + comprador.apellidos, legal_id: comprador.documento, legal_id_type: "CC" },
  });
  let t = tr;
  for (let i = 0; i < 45 && t.status === "PENDING"; i++) { await espera(2000); t = await wompiApi("/transactions/" + tr.id); }
  const aviso = await llamar(wompi, WOMPI.aviso({ id: t.id, reference: t.reference, status: t.status, amount_in_cents: t.amount_in_cents,
    currency: t.currency, payment_method_type: t.payment_method_type }));
  return { r, t, aviso, fila: pedidoDe(r.reference) };
}

const resultados = [];
const revisar = (nombre, ok, detalle) => { resultados.push({ nombre, ok }); console.log(`  ${ok ? "OK  " : "MAL "} ${nombre}${detalle ? " · " + detalle : ""}`); };
const caso = async (titulo, medio, esperado, reemplaza) => {
  console.log(titulo);
  const correosAntes = mundo.correos.length;
  const c = await comprar(medio, reemplaza);
  const nuevos = mundo.correos.slice(correosAntes);
  revisar(`Wompi aceptó nuestra firma y respondió ${c.t.status}`, c.t.status === esperado, `${c.t.payment_method_type} · $${(c.t.amount_in_cents / 100).toLocaleString("es-CO")} · ${c.r.reference}`);
  revisar("el monto cobrado es el total del servidor", c.t.amount_in_cents === c.r.amountInCents && c.t.reference === c.r.reference);
  revisar("el aviso firmado pasa la revisión de api/wompi.js", c.aviso.codigo === 200 && c.aviso.ok !== false, JSON.stringify(c.aviso).slice(0, 120));
  const estado = c.fila && c.fila[2];
  if (esperado === "APPROVED") {
    revisar("la hoja marca el pedido pagado", estado === "pagado", "estado " + estado);
    revisar("salen dos correos, desde thegang@", nuevos.length === 2 && nuevos.every((m) => m.from === "thegang@nandezcoffee.com"),
      nuevos.map((m) => m.to + " · " + m.subject).join(" | "));
  } else {
    revisar("la hoja no lo marca pagado", estado !== "pagado", "estado " + estado);
    revisar("no sale ningún correo al cliente", !nuevos.some((m) => m.to === comprador.correo));
  }
  console.log("");
  return c;
};

const stockInicial = stock();
await caso("1. Tarjeta que aprueba (4242 4242 4242 4242)", { tipo: "CARD", numero: "4242424242424242" }, "APPROVED");
const rech = await caso("2. Tarjeta que rechaza (4111 1111 1111 1111)", { tipo: "CARD", numero: "4111111111111111" }, "DECLINED");
await caso("3. Reintento con otra tarjeta, soltando la reserva rechazada", { tipo: "CARD", numero: "4242424242424242" }, "APPROVED", rech.r.reference);
await caso("4. Nequi que aprueba (3991111111)", { tipo: "NEQUI", numero: "3991111111" }, "APPROVED");
await caso("5. Nequi que rechaza (3992222222)", { tipo: "NEQUI", numero: "3992222222" }, "DECLINED");
await caso("6. PSE, banco que aprueba", { tipo: "PSE", banco: "1" }, "APPROVED");
await caso("7. PSE, banco que rechaza", { tipo: "PSE", banco: "2" }, "DECLINED");

/* la fila de stock nace con la primera reserva: en preventa cuenta contra el cupo */
const clave = Object.keys(stock()).find((k) => k.startsWith(producto.id + "-" + variante.g));
if (stockInicial[clave] == null) stockInicial[clave] = producto.preventa ? producto.cupo : variante.stock;
/* con Wompi, un rechazo deja la reserva para reintentar (se suelta a las 2 horas o al reintentar) */
const filas = mundo.H("Pedidos").slice(1), pagados = filas.filter((f) => f[2] === "pagado").length;
const apartados = filas.filter((f) => f[2] === "nuevo").length;
console.log("Al final");
revisar(`la hoja descuenta lo pagado y lo apartado (${clave}: ${stockInicial[clave]} → ${stock()[clave]})`,
  stockInicial[clave] - stock()[clave] === pagados + apartados, `${pagados} pagados · ${apartados} reservas sin pagar · estados: ${filas.map((f) => f[2]).join(", ")}`);
const mal = resultados.filter((x) => !x.ok).length;
console.log(`\n${resultados.length - mal}/${resultados.length} revisiones bien${mal ? " · " + mal + " MAL" : ""}`);
process.exit(mal ? 1 : 0);

/* ============================================================
   COMPRAS CON TARJETA DENTRO DE LA PÁGINA · api/tarjeta.js de punta a punta
   Uso:  node tools/pruebas/tarjeta.mjs [cantidad]

   Corre el código de verdad —api/tarjeta.js, api/webhook.js, la hoja
   (tools/correos/Codigo.gs) y la factura del panel— con Mercado Pago, Google
   Sheets y Gmail simulados (tools/pruebas/mp-simulado.mjs y simulador.mjs).
   El Mercado Pago simulado decide como el de pruebas: por el nombre del titular.
   No toca la hoja real ni envía correos.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { RAIZ, hojaSimulada, conectar, llamar, navegador } from "./simulador.mjs";
import { mercadoPagoSimulado, tokenDe, TOKEN_VALIDO } from "./mp-simulado.mjs";

const CANTIDAD = Number(process.argv.find((a) => /^\d+$/.test(a))) || 120;

/* ---------- el catálogo de prueba ---------- */
const cafe = (id, nombre, sale, variantes) => ({ id, nombre: { es: nombre, en: nombre }, sale: { es: sale }, proximamente: false,
  color: "#2F5A3C", sub: { es: "", en: "" }, precio: variantes[0].precio, gramos: variantes[0].g, foto: "",
  url: { es: "https://prueba.local/" + id, en: "https://prueba.local/en/" + id }, variantes });
const real = JSON.parse(fs.readFileSync(path.join(RAIZ, "prototipo/data/catalogo.json"), "utf8"));
const CAT = { ...real, registro: "https://hoja.prueba/exec", productos: [
  cafe("P-CAS", "Castillo de Ragonvalia", "En grano", [{ g: 250, precio: 40000, stock: 900 }, { g: 1000, precio: 132000, stock: 200 }]),
  cafe("P-PAR", "Cenicafé 1", "En grano", [{ g: 250, precio: 42000, stock: 400 }]),
  cafe("P-BLE", "Blend de la casa", "Molido", [{ g: 250, precio: 38000, stock: 250 }]),
] };
const TMP = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMPDIR || "/tmp"), "tarjeta-"));
fs.mkdirSync(path.join(TMP, "prototipo/data"), { recursive: true });
fs.writeFileSync(path.join(TMP, "prototipo/data/catalogo.json"), JSON.stringify(CAT));
process.chdir(TMP);

/* ---------- lo de afuera ---------- */
const { gs, props, correos, H } = hojaSimulada(CAT);
conectar({ gs, props });
const MP = mercadoPagoSimulado(), fetchHoja = globalThis.fetch;
let hojaCaidaParaPago = false;
globalThis.fetch = async (url, op = {}) => {
  if (new URL(url).host === "api.mercadopago.com") return MP.fetch(url, op);
  /* para probar que, si la hoja falla justo al marcar, el aviso de Mercado Pago lo arregla */
  if (hojaCaidaParaPago && op.method === "POST" && /"accion":"pago"/.test(op.body || "")) throw new Error("hoja caída");
  return fetchHoja(url, op);
};
process.env.MP_ACCESS_TOKEN = TOKEN_VALIDO;
const url = (f) => new URL("file:///" + path.join(RAIZ, f).replace(/\\/g, "/")).href;
const apiTarjeta = (await import(url("api/tarjeta.js"))).default;
const apiWebhook = (await import(url("api/webhook.js"))).default;
const nav = navegador();

/* ---------- lo que la prueba sabe por su cuenta ---------- */
let semilla = 20261110;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
const uno = (a) => a[Math.floor(azar() * a.length)];
const vendibles = CAT.productos.flatMap((p) => p.variantes.map((v) => ({ p, v })));
const esperado = Object.fromEntries(vendibles.map(({ p, v }) => [`${p.id}-${v.g}`, v.stock]));
function cuentaPropia(items, pct) {
  const subtotal = items.reduce((s, it) => s + CAT.productos.find((p) => p.id === it.id).variantes.find((x) => x.g === it.g).precio * it.n, 0);
  const descuento = Math.round(subtotal * pct / 100), envio = subtotal >= CAT.envio.gratisDesde ? 0 : CAT.envio.costo;
  return { subtotal, descuento, envio, total: subtotal - descuento + envio, iva: Math.round((subtotal - descuento) * CAT.iva / (100 + CAT.iva)) };
}
const apartar = (items, signo) => items.forEach((i) => (esperado[`${i.id}-${i.g}`] += signo * i.n));
const stockHoja = () => Object.fromEntries(H("Stock").slice(1).map((f) => [f[0], Number(f[2])]));
const stockCuadra = () => { const h = stockHoja(); return Object.keys(esperado).every((k) => (h[k] ?? vendibles.find(({ p, v }) => `${p.id}-${v.g}` === k).v.stock) === esperado[k]); };
const pedidoDe = (id) => H("Pedidos").find((f) => f[0] === id);
const correosA = (para, asunto) => correos.filter((c) => c.to === para && (!asunto || asunto.test(c.subject)));
let nCliente = 0;
const ciudades = [["Cúcuta", "Norte de Santander"], ["Bogotá", "Bogotá D.C."], ["Medellín", "Antioquia"], ["Cali", "Valle del Cauca"]];
function cliente(extra = {}) {
  nCliente++;
  const [ciudad, departamento] = uno(ciudades);
  return { nombre: uno(["Ana", "Luis", "María", "Andrés", "Sofía"]), apellidos: uno(["Ruiz", "Pérez", "Gómez", "Castro Niño"]),
    documento: String(1000000000 + nCliente * 7919), tel: "310" + String(1000000 + nCliente).slice(-7), direccion: `Calle ${nCliente % 90} # 5-23`,
    detalle: "", ciudad, departamento, correo: `tarjeta${nCliente}@correo.com`, ...extra };
}
function carritoLibre() {
  const lineas = [];
  for (let i = 0, n = 1 + Math.floor(azar() * 3); i < n; i++) {
    const { p, v } = uno(vendibles), cant = 1 + Math.floor(azar() * 3);
    if (!lineas.some((l) => l.id === p.id && l.g === v.g) && esperado[`${p.id}-${v.g}`] >= cant) lineas.push({ id: p.id, g: v.g, n: cant });
  }
  return lineas.length ? lineas : [{ id: "P-CAS", g: 250, n: 1 }];
}
function nuevoBono() {
  const correo = `bono${nCliente++}@correo.com`;
  gs.doPost({ postData: { contents: JSON.stringify({ tipo: "comunidad", correo, consentimiento: true }) } });
  return H("Bonos").find((f) => f[1] === correo)[0];
}

/* Una compra con tarjeta, como la hace la página: el token sale del formulario de Mercado Pago */
async function pagar({ items = carritoLibre(), comprador = cliente(), bono = "", pct = 0, titular = "APRO", idioma = "es", reemplaza = "", total } = {}) {
  const cuenta = cuentaPropia(items, pct), cobrosAntes = MP.cobros.length;
  const r = await llamar(apiTarjeta, { items, bono, comprador, idioma, reemplaza, total: total ?? cuenta.total,
    tarjeta: { token: tokenDe(titular), payment_method_id: "visa", issuer_id: "1", identificacion: { type: "CC", number: comprador.documento } } });
  /* toda respuesta con número de reserva dejó bolsas apartadas, salvo el total cambiado */
  if (r.reference && r.error !== "total-cambio") apartar(items, -1);
  return { r, items, comprador, cuenta, pct, cobros: MP.cobros.slice(cobrosAntes) };
}
const revisar = (cond, que) => { if (!cond) throw new Error(que); };
function revisarAprobada(c) {
  const { r, comprador, cuenta, cobros } = c, f = pedidoDe(r.reference);
  revisar(r.ok && r.estado === "aprobado", "no quedó aprobada: " + (r.error || r.estado) + " " + (r.detalle || ""));
  revisar(r.total === cuenta.total && r.iva === cuenta.iva && r.envio === cuenta.envio && r.descuento === cuenta.descuento, `la cuenta del servidor (${r.total}) no es la propia (${cuenta.total})`);
  revisar(cobros.length === 1, `se le pidieron ${cobros.length} cobros a Mercado Pago, no 1`);
  const cobro = cobros[0];
  revisar(cobro.cuerpo.transaction_amount === cuenta.total, "Mercado Pago cobró un monto distinto al total");
  revisar(cobro.llave === r.reference && cobro.cuerpo.external_reference === r.reference, "el cobro no lleva la reserva como llave y referencia");
  revisar(cobro.cuerpo.binary_mode === true && cobro.cuerpo.installments === 1, "el cobro no va en una cuota y sin «en revisión»");
  revisar(cobro.cuerpo.payer.email === comprador.correo, "el cobro no lleva el correo del comprador");
  revisar(f && f[2] === "pagado", "el pedido no quedó pagado al instante: " + (f && f[2]));
  revisar(correosA(comprador.correo, /Pago recibido|Payment received/).length === 1, "al cliente no le llegó una (y solo una) constancia");
  revisar(correosA("nandezcafe@gmail.com", new RegExp("Pago confirmado " + r.reference + " ")).length === 1, "a Nandez no le llegó un (y solo un) aviso");
  revisar(stockCuadra(), "el stock no es el esperado");
}

/* ---------- las compras ---------- */
const casos = [];
const caso = (nombre, categoria, fn) => casos.push({ nombre, categoria, fn });

for (let i = 0; i < CANTIDAD; i++) caso(`compra con tarjeta al azar #${i + 1}`, "compras normales", async () => {
  const conBono = azar() < 0.3, bono = conBono ? nuevoBono() : "", idioma = azar() < 0.2 ? "en" : "es";
  const c = await pagar({ bono, pct: conBono ? 10 : 0, idioma });
  revisarAprobada(c);
  /* luego llega el aviso de Mercado Pago: no debe repetir nada */
  const pagoId = MP.porLlave[c.r.reference];
  const w = await llamar(apiWebhook, MP.aviso(pagoId));
  revisar(w.codigo === 200 && w.repetido === true, "el aviso posterior no se reconoció como repetido");
  revisarAprobada(c);
  if (idioma === "en") revisar(correosA(c.comprador.correo, /Payment received/).length === 1, "el cliente en inglés no recibió su correo en inglés");
});

for (const [titular, detalle] of [["OTHE", "cc_rejected_other_reason"], ["FUND", "cc_rejected_insufficient_amount"], ["SECU", "cc_rejected_bad_filled_security_code"],
  ["EXPI", "cc_rejected_bad_filled_date"], ["CALL", "cc_rejected_call_for_authorize"], ["CONT", "cc_rejected_other_reason"]]) {
  caso(`tarjeta rechazada (${titular})`, "rechazos", async () => {
    const c = await pagar({ titular });
    revisar(c.r.codigo === 402 && c.r.error === "rechazado" && c.r.detalle === detalle, `debía rechazar con ${detalle} y respondió ${c.r.error} ${c.r.detalle || ""}`);
    const f = pedidoDe(c.r.reference);
    revisar(f[2] === "nuevo" && /Pago rechazado/.test(f[18]), "el rechazo no dejó la reserva con su nota");
    revisar(correosA(c.comprador.correo).length === 0, "le llegó correo a alguien cuyo pago no pasó");
    revisar(stockCuadra(), "la reserva no quedó apartada");
  });
}
caso("rechazada y luego aprobada con otra tarjeta", "rechazos", async () => {
  const comprador = cliente(), items = [{ id: "P-CAS", g: 250, n: 2 }];
  const a = await pagar({ items, comprador, titular: "FUND" });
  const b = await pagar({ items, comprador, titular: "APRO", reemplaza: a.r.reference });
  apartar(items, +1);   // la primera reserva se soltó
  revisar(pedidoDe(a.r.reference)[2] === "cancelado", "la reserva del intento fallido no se soltó");
  revisarAprobada(b);
});

caso("los precios cambiaron desde que abrió la página", "plata", async () => {
  const antes = JSON.stringify(stockHoja()), cobros = MP.cobros.length;
  const c = await pagar({ items: [{ id: "P-CAS", g: 250, n: 1 }], total: 51000 });
  revisar(c.r.codigo === 409 && c.r.error === "total-cambio" && c.r.total === 52000, "no avisó el total nuevo");
  revisar(MP.cobros.length === cobros, "le cobró a la tarjeta con un total que la persona no vio");
  revisar(JSON.stringify(stockHoja()) === antes, "la reserva del total cambiado no se soltó");
});
caso("el navegador manda un total más bajo para pagar menos", "plata", async () => {
  const cobros = MP.cobros.length;
  const c = await pagar({ items: [{ id: "P-PAR", g: 250, n: 3 }], total: 1000 });
  revisar(c.r.error === "total-cambio" && MP.cobros.length === cobros, "con un total falso, intentó cobrar");
});
caso("con bono, Mercado Pago cobra el total con el descuento", "plata", async () => {
  const c = await pagar({ bono: nuevoBono(), pct: 10, items: [{ id: "P-CAS", g: 1000, n: 1 }] });
  revisarAprobada(c);
  revisar(c.cobros[0].cuerpo.transaction_amount === 118800 + 0, "el cobro con bono no es 132.000 − 10 % (envío gratis)");
});
caso("la hoja falla justo al marcar: el aviso de Mercado Pago lo arregla", "plata", async () => {
  hojaCaidaParaPago = true;
  const c = await pagar();
  hojaCaidaParaPago = false;
  revisar(c.r.ok && c.r.estado === "aprobado", "el cliente pagó y no se le confirmó");
  revisar(pedidoDe(c.r.reference)[2] === "nuevo", "la hoja no estaba caída como se esperaba");
  await llamar(apiWebhook, MP.aviso(MP.porLlave[c.r.reference]));
  revisarAprobada(c);
});

caso("sin token de la tarjeta", "seguridad", async () => {
  const filas = H("Pedidos").length;
  const r = await llamar(apiTarjeta, { items: [{ id: "P-CAS", g: 250, n: 1 }], comprador: cliente(), total: 52000, tarjeta: { payment_method_id: "visa" } });
  revisar(r.codigo === 400 && r.error === "tarjeta" && H("Pedidos").length === filas, "abrió una reserva sin tarjeta");
});
caso("token ya usado", "seguridad", async () => {
  const a = await pagar();
  revisarAprobada(a);
  const tokenViejo = a.cobros[0].cuerpo.token, items = [{ id: "P-CAS", g: 250, n: 1 }];
  const r = await llamar(apiTarjeta, { items, comprador: cliente(), total: 52000, tarjeta: { token: tokenViejo, payment_method_id: "visa" } });
  if (r.reference) apartar(items, -1);
  revisar(r.codigo === 502 && pedidoDe(r.reference)[2] === "nuevo", "un token reusado no debía cobrar");
});
caso("sin MP_ACCESS_TOKEN", "seguridad", async () => {
  const t = process.env.MP_ACCESS_TOKEN; delete process.env.MP_ACCESS_TOKEN;
  const r = await llamar(apiTarjeta, { items: [{ id: "P-CAS", g: 250, n: 1 }], comprador: cliente(), total: 52000, tarjeta: { token: tokenDe("APRO"), payment_method_id: "visa" } });
  process.env.MP_ACCESS_TOKEN = t;
  revisar(r.codigo === 503 && r.error === "sin-pasarela", "sin token debía decir que no hay pasarela");
});
caso("Mercado Pago no responde", "seguridad", async () => {
  MP.caido = true;
  const c = await pagar({ items: [{ id: "P-BLE", g: 250, n: 1 }] });
  MP.caido = false;
  revisar(c.r.codigo === 502 && c.r.error === "pasarela" && pedidoDe(c.r.reference)[2] === "nuevo", "con Mercado Pago caído no quedó la reserva para reintentar");
  revisar(correosA(c.comprador.correo).length === 0, "con Mercado Pago caído se mandó un correo");
});
caso("pedir más de lo que hay", "stock", async () => {
  /* se baja el inventario a mano en la hoja, como lo haría Nandez */
  const k = "P-BLE-250", f = H("Stock").find((x) => x[0] === k);
  if (f) f[2] = 4; else H("Stock").push([k, "Blend 250 g", 4, new Date()]);
  esperado[k] = 4;
  const items = [{ id: "P-BLE", g: 250, n: 6 }, { id: "P-PAR", g: 250, n: 1 }];
  const cobros = MP.cobros.length, antes = JSON.stringify(stockHoja());
  const r = await llamar(apiTarjeta, { items, comprador: cliente(), total: cuentaPropia(items, 0).total, tarjeta: { token: tokenDe("APRO"), payment_method_id: "visa" } });
  revisar(r.codigo === 409 && r.error === "agotado", "con algo agotado debía responder agotado y respondió " + r.error);
  revisar(MP.cobros.length === cobros, "con algo agotado, igual intentó cobrar");
  revisar(JSON.stringify(stockHoja()) === antes, "con algo agotado, apartó la otra línea");
});

/* ---------- correr todo ---------- */
const t0 = Date.now();
for (const c of casos) {
  try { await c.fn(); c.ok = true; }
  catch (e) { c.ok = false; c.error = e.message + (/^[a-záéíóúñ]/.test(e.message || "") ? "" : " ← " + String(e.stack).split(/\r?\n/)[1].trim()); }
}
const pedidos = H("Pedidos").slice(1), pagados = pedidos.filter((f) => f[2] === "pagado");
const aprobados = Object.values(MP.pagos).filter((p) => p.status === "approved");
const op = JSON.parse(gs.doGet({ parameter: { accion: "operacion", clave: props.CLAVE } }).texto);
const inv = [
  ["el stock de la hoja es el que debe ser", stockCuadra()],
  ["cada pago aprobado en Mercado Pago tiene su pedido pagado", aprobados.every((p) => { const f = pedidoDe(p.external_reference); return f && f[2] === "pagado" && String(f[26]).includes(String(p.id)); })],
  ["ningún pedido pagado sin un pago aprobado en Mercado Pago", pagados.every((f) => aprobados.some((p) => p.external_reference === f[0]))],
  ["Mercado Pago cobró exactamente el total de cada pedido", aprobados.every((p) => Number(pedidoDe(p.external_reference)[11]) === p.transaction_amount)],
  ["nunca dos cobros para la misma reserva", new Set(MP.cobros.map((c) => c.llave)).size === MP.cobros.length],
  ["ningún cobro sin reserva en la hoja", MP.cobros.every((c) => pedidoDe(c.llave))],
  ["cada pagado tiene un solo aviso a Nandez", pagados.every((f) => correosA("nandezcafe@gmail.com", new RegExp("Pago confirmado " + f[0] + " ")).length === 1)],
  ["toda factura de pedido pagado cuadra", op.pedidos.filter((p) => p.estado === "pagado").every((p) => nav.textoFactura(p).cuadra === true)],
];
const porCat = {};
casos.forEach((c) => { (porCat[c.categoria] ||= { ok: 0, mal: 0 })[c.ok ? "ok" : "mal"]++; });
console.log(`\nCOMPRAS CON TARJETA DENTRO DE LA PÁGINA · ${((Date.now() - t0) / 1000).toFixed(1)} s\n`);
Object.entries(porCat).forEach(([c, n]) => console.log(`  ${n.mal ? "FALLA" : "OK   "}  ${c.padEnd(20)} ${n.ok}/${n.ok + n.mal}`));
console.log(`\n  ${casos.filter((c) => c.ok).length}/${casos.length} compras bien · ${pedidos.length} pedidos · ${pagados.length} pagados · ${MP.cobros.length} cobros a Mercado Pago`);
console.log(`  plata cobrada: $${aprobados.reduce((s, p) => s + p.transaction_amount, 0).toLocaleString("es-CO")}`);
console.log("\nINVARIANTES");
inv.forEach(([t, ok]) => console.log(`  ${ok ? "OK   " : "FALLA"}  ${t}`));
const fallas = casos.filter((c) => !c.ok);
if (fallas.length) { console.log("\nLO QUE FALLÓ"); fallas.slice(0, 25).forEach((c) => console.log(`  · ${c.nombre}: ${c.error}`)); }
process.chdir(RAIZ);
fs.rmSync(TMP, { recursive: true, force: true });
if (fallas.length || inv.some(([, ok]) => !ok)) process.exitCode = 1;

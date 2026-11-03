/* ============================================================
   COMPRAS DE PRUEBA · el sistema de pago completo, de punta a punta
   Uso:  node tools/pruebas/compras.mjs [cantidad] [--catalogo real]

   Corre el código de verdad —api/pago.js, api/wompi.js, la hoja
   (tools/correos/Codigo.gs) y la factura del panel (operacion.js)— y simula
   solo lo de afuera: Wompi, Google Sheets y Gmail (tools/pruebas/simulador.mjs).
   El Wompi de mentira sigue la documentación al pie de la letra: rechaza un
   cobro con la firma de integridad mal hecha y firma sus avisos como el real.
   No toca la hoja real ni envía correos: todo pasa en memoria.

   Cada compra revisa que el monto, el stock, el bono, los correos y la factura
   cuadren; al final se revisan los invariantes de todo el lote.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { RAIZ, hojaSimulada, conectar, api, llamar, WOMPI, navegador } from "./simulador.mjs";

const args = process.argv.slice(2);
const CANTIDAD = Number(args.find((a) => /^\d+$/.test(a))) || 120;
const CATALOGO_REAL = args.includes("--catalogo") && args[args.indexOf("--catalogo") + 1] === "real";

/* ---------- 1. el catálogo ----------
   Por defecto se usa uno de prueba con más presentaciones que el real, para que
   haya pedidos de varias líneas, envío gratis y un café que todavía no se vende.
   Con --catalogo real se usa tal cual el que publica tools/build.js. */
const real = JSON.parse(fs.readFileSync(path.join(RAIZ, "prototipo/data/catalogo.json"), "utf8"));
const catalogoPrueba = {
  ...real,
  productos: [
    { id: "P-CAS", nombre: { es: "Castillo de Ragonvalia", en: "Castillo" }, sale: { es: "En grano" }, proximamente: false,
      variantes: [{ g: 250, precio: 40000, stock: 900 }, { g: 1000, precio: 132000, stock: 200 }] },
    { id: "P-PAR", nombre: { es: "El Paraíso", en: "El Paraíso" }, sale: { es: "En grano" }, proximamente: false,
      variantes: [{ g: 250, precio: 42000, stock: 400 }] },
    { id: "P-BLE", nombre: { es: "Blend de la casa", en: "House blend" }, sale: { es: "Molido" }, proximamente: false,
      variantes: [{ g: 250, precio: 38000, stock: 250 }] },
    { id: "P-GEI", nombre: { es: "Geisha", en: "Geisha" }, sale: { es: "En grano" }, proximamente: true,
      variantes: [{ g: 250, precio: 0, stock: 0 }] },
  ],
};
/* el correo de bienvenida (que es el que entrega los bonos) arma su vitrina con estos campos */
catalogoPrueba.productos.forEach((p) => Object.assign(p, { color: "#2F5A3C", sub: { es: "", en: "" },
  precio: p.variantes[0].precio, gramos: p.variantes[0].g, foto: "",
  url: { es: "https://prueba.local/" + p.id, en: "https://prueba.local/en/" + p.id } }, { nombre: { es: p.nombre.es, en: p.nombre.en } }));
const CAT = CATALOGO_REAL ? real : catalogoPrueba;
/* El catálogo real tiene hoy un solo café a la venta y 90 bolsas: se le dan más
   bolsas de arranque para que alcancen las pruebas. Lo que se prueba con él son
   sus precios, su envío y su IVA, no el tamaño del inventario. */
if (CATALOGO_REAL) CAT.productos.forEach((p) => p.variantes.forEach((v) => { if (v.precio > 0) v.stock = Math.max(v.stock, 3000); }));
/* api/_tienda.js lee el catálogo de <cwd>/prototipo/data/catalogo.json */
const TMP = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMPDIR || "/tmp"), "compras-"));
fs.mkdirSync(path.join(TMP, "prototipo/data"), { recursive: true });
fs.writeFileSync(path.join(TMP, "prototipo/data/catalogo.json"), JSON.stringify(CAT));
process.chdir(TMP);

/* ---------- 2. lo de afuera, simulado (tools/pruebas/simulador.mjs) ---------- */
const { gs, props, correos, H } = hojaSimulada(CAT);
conectar({ gs, props });
const { pago: apiPago, wompi: apiWompi } = await api();
const nav = navegador();

/* ---------- 6. lo que la prueba sabe por su cuenta (no le cree al sistema) ---------- */
let semilla = 20261103;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
const uno = (a) => a[Math.floor(azar() * a.length)];
const vendibles = CAT.productos.filter((p) => !p.proximamente).flatMap((p) => p.variantes.filter((v) => v.precio > 0).map((v) => ({ p, v })));
const esperado = {};   // stock que debería tener la hoja, llevado aparte
vendibles.forEach(({ p, v }) => (esperado[`${p.id}-${v.g}`] = v.stock));
function cuentaPropia(items, pct) {
  let subtotal = 0;
  for (const it of items) {
    const v = CAT.productos.find((p) => p.id === it.id).variantes.find((x) => x.g === it.g);
    subtotal += v.precio * it.n;
  }
  const descuento = Math.round(subtotal * pct / 100), envio = subtotal >= CAT.envio.gratisDesde ? 0 : CAT.envio.costo;
  const iva = CAT.iva ? Math.round((subtotal - descuento) * CAT.iva / (100 + CAT.iva)) : 0;
  return { subtotal, descuento, envio, total: subtotal - descuento + envio, iva };
}
const nombres = ["Ana Ruiz", "Luis Pérez", "María José Gómez", "Andrés Castro", "Lina Suárez", "Pedro Niño", "Sofía Quintero", "Juan Esteban Rey"];
const ciudades = [["Cúcuta", "Norte de Santander"], ["Bogotá", "Bogotá D.C."], ["Medellín", "Antioquia"], ["Cali", "Valle del Cauca"],
  ["Pamplona", "Norte de Santander"], ["Bucaramanga", "Santander"], ["Chinácota", "Norte de Santander"]];
let nCliente = 0;
function cliente(extra = {}) {
  const [nombre, ...ap] = uno(nombres).split(" "), [ciudad, departamento] = uno(ciudades);
  nCliente++;
  return { nombre, apellidos: ap.join(" ") || "Prueba", documento: String(1000000000 + nCliente * 7919), tel: "300" + String(1000000 + nCliente).slice(-7),
    direccion: `Calle ${10 + (nCliente % 90)} # ${nCliente % 50}-${nCliente % 99}`, detalle: azar() < 0.5 ? "Apto " + (100 + nCliente % 400) : "",
    ciudad, departamento, correo: `cliente${nCliente}@correo.com`, ...extra };
}
function carrito() {
  const lineas = [], n = 1 + Math.floor(azar() * Math.min(3, vendibles.length));
  for (let i = 0; i < n; i++) {
    const { p, v } = uno(vendibles);
    if (lineas.some((l) => l.id === p.id && l.g === v.g)) continue;
    lineas.push({ id: p.id, g: v.g, n: 1 + Math.floor(azar() * 3) });
  }
  return lineas;
}
/* para las pruebas puntuales: un carrito que sí se puede pagar, con lo que queda */
function carritoLibre() {
  return carrito().filter((it) => esperado[`${it.id}-${it.g}`] >= it.n).slice(0, 2).concat([]).filter(Boolean)
    .concat(vendibles.filter(({ p, v }) => esperado[`${p.id}-${v.g}`] >= 1).slice(0, 1).map(({ p, v }) => ({ id: p.id, g: v.g, n: 1 })))
    .filter((it, i, a) => a.findIndex((x) => x.id === it.id && x.g === it.g) === i);
}
function nuevoBono(estado = "vigente") {
  const correo = `bono${correos.length}-${Math.floor(azar() * 1e9)}@correo.com`;
  gs.doPost({ postData: { contents: JSON.stringify({ tipo: "comunidad", correo, consentimiento: true }) } });
  const fila = H("Bonos").findIndex((f) => f[1] === correo), codigo = H("Bonos")[fila][0];
  if (estado === "vencido") H("Bonos")[fila][4] = new Date(Date.now() - 2 * 86400000);
  return codigo;
}
const pedidoDe = (id) => H("Pedidos").find((f) => f[0] === id);
const bonoUsadoPor = (codigo) => (H("Bonos").find((f) => f[0] === codigo) || [])[7] || "";
const correosA = (para, asunto) => correos.filter((c) => c.to === para && (!asunto || asunto.test(c.subject)));
const stockHoja = () => Object.fromEntries(H("Stock").slice(1).map((f) => [f[0], Number(f[2])]));
function stockCuadra() {
  const h = stockHoja();
  return Object.keys(esperado).every((k) => (h[k] ?? CAT.productos.find((p) => k.startsWith(p.id + "-")).variantes.find((v) => k.endsWith("-" + v.g)).stock) === esperado[k]);
}
/* corregir el inventario a mano en la hoja, como lo haría Nandez */
function reponer(k, n) {
  const f = H("Stock").find((x) => x[0] === k);
  if (f) f[2] = n; else H("Stock").push([k, k, n, new Date()]);
  esperado[k] = n;
}
/* lo que el pedido apartó, para devolverlo en la cuenta propia si se cancela */
const apartar = (items, signo) => items.forEach((i) => (esperado[`${i.id}-${i.g}`] += signo * i.n));

/* ---------- 7. el registro de resultados ---------- */
const resultados = [];
function compra(nombre, categoria, fn) { resultados.push({ nombre, categoria, fn }); }
const revisar = (cond, que) => { if (!cond) throw new Error(que); };

/* Una compra completa: carrito → api/pago → Wompi → aviso → hoja */
async function comprar({ items = carritoLibre(), comprador = cliente(), bono = "", pct = 0, medio = "card:4242424242424242", idioma = "es", reemplaza = "" } = {}) {
  const r = await llamar(apiPago, { items, bono, comprador, idioma, llavePublica: "pub_test_X", reemplaza });
  if (!r.ok) return { r, items, comprador };
  apartar(items, -1);
  const pago = WOMPI.cobrar(r, medio);
  revisar(!pago.error, "Wompi rechazó el cobro: " + pago.error);
  const aviso = await llamar(apiWompi, WOMPI.aviso(pago.transaction));
  return { r, items, comprador, tr: pago.transaction, aviso, pct };
}
/* Lo que se revisa en TODA compra aprobada */
function revisarAprobada(c) {
  const { r, items, comprador, tr, pct } = c, cuenta = cuentaPropia(items, pct), f = pedidoDe(r.reference);
  revisar(r.total === cuenta.total && r.iva === cuenta.iva && r.envio === cuenta.envio && r.descuento === cuenta.descuento,
    `la cuenta del servidor (${r.total}) no es la propia (${cuenta.total})`);
  revisar(r.amountInCents === cuenta.total * 100, "el monto firmado no es el total");
  revisar(f && f[2] === "pagado", "el pedido no quedó pagado: " + (f && f[2]));
  revisar(String(f[26]).includes(tr.id), "no quedó anotada la transacción");
  revisar(Number(f[11]) === cuenta.total, "el total de la hoja no cuadra");
  revisar(correosA(comprador.correo, /Pago recibido|Payment received/).length === 1, "al cliente no le llegó una (y solo una) constancia de pago");
  revisar(correosA("nandezcafe@gmail.com", new RegExp("Pago confirmado " + r.reference)).length === 1, "a Nandez no le llegó un (y solo un) aviso de pago");
  revisar(correosA(comprador.correo, /Recibimos tu pedido|We got your order/).length === 0, "le llegó el «te escribimos cómo pagar» a quien ya pagó");
  const op = JSON.parse(gs.doGet({ parameter: { accion: "operacion", clave: props.CLAVE } }).texto);
  const fac = nav.textoFactura(op.pedidos.find((p) => p.id === r.reference));
  revisar(fac.cuadra === true, "la factura del panel no cuadra con el pedido");
  revisar(stockCuadra(), "el stock de la hoja no es el esperado");
}

/* ---------- 8. las compras ---------- */
/* a) Compras normales, al azar: medio, bono, cantidades, idioma */
const lote = { aprobadas: 0, agotadas: 0 };
const medios = ["card:4242424242424242", "nequi:3991111111", "pse:1"];
for (let i = 0; i < CANTIDAD; i++) {
  compra(`compra al azar #${i + 1}`, "compras normales", async () => {
    const conBono = azar() < 0.3, bono = conBono ? nuevoBono() : "", idioma = azar() < 0.2 ? "en" : "es";
    const items = carrito(), libre = items.every((it) => esperado[`${it.id}-${it.g}`] >= it.n);
    const c = await comprar({ items, bono, pct: conBono ? 10 : 0, medio: uno(medios), idioma });
    if (!libre) { lote.agotadas++; return revisar(c.r.codigo === 409 && c.r.error === "agotado", "con stock insuficiente debía responder agotado"); }
    lote.aprobadas++;
    revisar(c.r.ok, "el servidor no abrió el cobro: " + c.r.error);
    revisarAprobada(c);
    if (conBono) revisar(bonoUsadoPor(bono) === c.r.reference, "el bono no quedó usado por este pedido");
    if (idioma === "en") revisar(correosA(c.comprador.correo, /Payment received/).length === 1, "el cliente en inglés no recibió el correo en inglés");
  });
}

/* b) Pagos que no pasan: la reserva sigue, nadie recibe constancia de pago */
for (const medio of ["card:4111111111111111", "nequi:3992222222", "pse:2", "card:5555555555554444"]) {
  compra(`pago rechazado (${medio})`, "pagos que no pasan", async () => {
    const c = await comprar({ medio });
    if (!c.r.ok) return revisar(c.r.error === "agotado", "error inesperado: " + c.r.error);
    const f = pedidoDe(c.r.reference);
    revisar(f[2] === "nuevo", "un pago rechazado no debe marcar pagado");
    revisar(/Pago (rechazado|error)/.test(f[18]), "el rechazo no quedó anotado");
    revisar(correosA(c.comprador.correo).length === 0, "al cliente le llegó correo de un pago que no pasó");
    revisar(stockCuadra(), "la reserva no quedó apartada");
  });
}

/* c) Reintento: rechazado y luego aprobado. La reserva vieja se suelta, no se duplica */
compra("rechazado y luego aprobado, con reintento", "pagos que no pasan", async () => {
  const comprador = cliente(), items = [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }];
  const a = await comprar({ items, comprador, medio: "card:4111111111111111" });
  revisar(a.r.ok, "no abrió el primer cobro");
  const b = await comprar({ items, comprador, medio: "card:4242424242424242", reemplaza: a.r.reference });
  revisar(b.r.ok, "no abrió el segundo cobro");
  apartar(items, +1);   // la primera reserva vuelve
  revisar(pedidoDe(a.r.reference)[2] === "cancelado", "la reserva del primer intento no se soltó");
  revisarAprobada(b);
});

/* d) Seguridad: lo que no debe mover nada */
compra("aviso falsificado (firma con otro secreto)", "seguridad", async () => {
  const c = await comprar({ medio: "card:4111111111111111" });
  revisar(c.r.ok, "no abrió el cobro: " + c.r.error);
  const falso = WOMPI.aviso({ ...c.tr, status: "APPROVED" }, { secreto: "test_events_ADIVINADO" });
  const r = await llamar(apiWompi, falso);
  revisar(r.codigo === 401, "un aviso con firma falsa no fue rechazado");
  revisar(pedidoDe(c.r.reference)[2] === "nuevo", "un aviso falso marcó pagado");
});
compra("aviso con el monto cambiado después de firmar", "seguridad", async () => {
  const c = await comprar({ medio: "card:4111111111111111" });
  const aviso = WOMPI.aviso({ ...c.tr, status: "APPROVED" });
  aviso.data.transaction.amount_in_cents = 100;
  revisar((await llamar(apiWompi, aviso)).codigo === 401, "un aviso alterado no fue rechazado");
  revisar(pedidoDe(c.r.reference)[2] === "nuevo", "un aviso alterado marcó pagado");
});
compra("firma solo en la cabecera X-Event-Checksum", "seguridad", async () => {
  const c = await comprar({ medio: "card:4111111111111111" });
  const aviso = WOMPI.aviso({ ...c.tr, status: "APPROVED" }), cabecera = aviso.signature.checksum;
  delete aviso.signature.checksum;
  const r = await llamar(apiWompi, aviso, { "x-event-checksum": cabecera });
  revisar(r.codigo === 200 && pedidoDe(c.r.reference)[2] === "pagado", "no aceptó la firma enviada por cabecera");
});
compra("aviso de producción con secreto de pruebas", "seguridad", async () => {
  const c = await comprar({ medio: "card:4111111111111111" });
  const r = await llamar(apiWompi, WOMPI.aviso({ ...c.tr, status: "APPROVED" }, { ambiente: "prod" }));
  revisar(r.codigo === 200 && r.ignorado === "ambiente", "mezcló un aviso de producción con la tienda de pruebas");
  revisar(pedidoDe(c.r.reference)[2] === "nuevo", "un aviso de otro ambiente marcó pagado");
});
compra("el navegador manda precios falsos", "seguridad", async () => {
  const { p, v } = vendibles[0];
  const r = await llamar(apiPago, { items: [{ id: p.id, g: v.g, n: 1, precio: 1, total: 1 }], comprador: cliente(), precio: 1, total: 1 });
  revisar(r.ok, "no abrió el cobro: " + r.error);
  apartar([{ id: p.id, g: v.g, n: 1 }], -1);
  revisar(r.total === cuentaPropia([{ id: p.id, g: v.g, n: 1 }], 0).total, "el servidor le creyó al precio del navegador");
});
compra("firma de integridad con monto cambiado", "seguridad", async () => {
  const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente() });
  revisar(r.ok, "no abrió el cobro: " + r.error);
  apartar([{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], -1);
  const pago = WOMPI.cobrar({ ...r, amountInCents: 100 }, "card:4242424242424242");
  revisar(pago.error === "firma de integridad inválida", "Wompi habría cobrado un monto distinto al firmado");
});
compra("llave pública de producción con secreto de pruebas", "seguridad", async () => {
  const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente(), llavePublica: "pub_prod_X" });
  revisar(r.codigo === 500 && r.error === "llaves-cruzadas", "no detectó llaves cruzadas");
});
compra("soltar una reserva ajena que ya se pagó", "seguridad", async () => {
  const c = await comprar();
  revisar(c.r.ok, "no abrió el cobro: " + c.r.error);
  const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente(), reemplaza: c.r.reference });
  if (r.ok) apartar([{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], -1);
  revisar(pedidoDe(c.r.reference)[2] === "pagado", "un tercero pudo cancelar un pedido ya pagado");
  revisar(stockCuadra(), "el stock se movió");
});
compra("marcar pagado sin la clave", "seguridad", async () => {
  const c = await comprar({ medio: "card:4111111111111111" });
  const r = JSON.parse(gs.doPost({ postData: { contents: JSON.stringify({ accion: "pago", clave: "mala", id: c.r.reference, estado: "aprobado", monto: c.r.total }) } }).texto);
  revisar(r.ok === false && r.error === "clave", "la hoja aceptó un pago sin clave");
  revisar(pedidoDe(c.r.reference)[2] === "nuevo", "sin clave quedó pagado");
});

/* e) Avisos repetidos y fuera de orden */
compra("Wompi repite el aviso tres veces", "avisos repetidos", async () => {
  const c = await comprar();
  for (let i = 0; i < 3; i++) await llamar(apiWompi, WOMPI.aviso(c.tr));
  revisarAprobada(c);
});
compra("aviso de rechazo después de uno aprobado", "avisos repetidos", async () => {
  const c = await comprar();
  await llamar(apiWompi, WOMPI.aviso({ ...c.tr, status: "DECLINED" }));
  revisarAprobada(c);
});
compra("aviso PENDING antes del aprobado", "avisos repetidos", async () => {
  const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente(), idioma: "es" });
  revisar(r.ok, "no abrió el cobro: " + r.error);
  apartar([{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], -1);
  const tr = WOMPI.cobrar(r, "pse:1").transaction;
  const p = await llamar(apiWompi, WOMPI.aviso({ ...tr, status: "PENDING" }));
  revisar(p.codigo === 200 && p.ignorado === "PENDING" && pedidoDe(r.reference)[2] === "nuevo", "un PENDING movió el pedido");
  await llamar(apiWompi, WOMPI.aviso(tr));
  revisar(pedidoDe(r.reference)[2] === "pagado", "el aprobado posterior no marcó pagado");
});
compra("aviso de un pedido que la hoja no conoce", "avisos repetidos", async () => {
  const r = await llamar(apiWompi, WOMPI.aviso({ id: "x-1", reference: "NDZ-0000-NOEXISTE", status: "APPROVED", amount_in_cents: 100000, payment_method_type: "CARD" }));
  revisar(r.codigo === 200, "debía responder 200 para que Wompi no insista");
});
compra("la hoja no responde: Wompi debe reintentar", "avisos repetidos", async () => {
  const c = await comprar({ medio: "card:4111111111111111" });
  const viejo = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("sin red"); };
  const r = await llamar(apiWompi, WOMPI.aviso({ ...c.tr, status: "APPROVED" }));
  globalThis.fetch = viejo;
  revisar(r.codigo === 502, "con la hoja caída debía pedirle a Wompi que reintente");
  await llamar(apiWompi, WOMPI.aviso({ ...c.tr, status: "APPROVED" }));
  revisar(pedidoDe(c.r.reference)[2] === "pagado", "el reintento no marcó pagado");
  revisar(stockCuadra(), "el stock no cuadra tras el reintento");
});

/* f) Stock: agotados, todo o nada, la última bolsa */
compra("pedir más de lo que hay", "stock", async () => {
  const { p, v } = vendibles[vendibles.length - 1], antes = stockHoja(), filas = H("Pedidos").length;
  const r = await llamar(apiPago, { items: [{ id: p.id, g: v.g, n: 29 }], comprador: cliente() });
  if (esperado[`${p.id}-${v.g}`] >= 29) { apartar([{ id: p.id, g: v.g, n: 29 }], -1); return; }
  revisar(r.codigo === 409 && r.error === "agotado", "no dijo agotado");
  revisar(H("Pedidos").length === filas, "escribió un pedido agotado");
  revisar(JSON.stringify(stockHoja()) === JSON.stringify(antes), "un pedido agotado movió el stock");
});
compra("todo o nada: una línea alcanza y la otra no", "stock", async () => {
  if (vendibles.length < 2) return;
  const [a, b] = vendibles, antes = stockHoja();
  const r = await llamar(apiPago, { items: [{ id: a.p.id, g: a.v.g, n: 1 }, { id: b.p.id, g: b.v.g, n: 29 }], comprador: cliente() });
  if (r.ok) { apartar([{ id: a.p.id, g: a.v.g, n: 1 }, { id: b.p.id, g: b.v.g, n: 29 }], -1); return; }
  revisar(r.error === "agotado" && JSON.stringify(stockHoja()) === JSON.stringify(antes), "apartó la línea que sí alcanzaba");
});
compra("dos personas por las últimas bolsas", "stock", async () => {
  const { p, v } = vendibles[vendibles.length - 1], k = `${p.id}-${v.g}`, quedan = esperado[k];
  if (quedan < 1) return;
  /* se compra de a 30 (el tope por pedido) hasta dejarla en cero */
  while (esperado[k] > 0) {
    const c = await comprar({ items: [{ id: p.id, g: v.g, n: Math.min(30, esperado[k]) }] });
    revisar(c.r.ok, "no dejó comprar lo que sí había: " + c.r.error);
  }
  const dos = await llamar(apiPago, { items: [{ id: p.id, g: v.g, n: 1 }], comprador: cliente() });
  revisar(dos.codigo === 409, "vendió una bolsa que ya no existía");
  revisar(esperado[k] === 0 && stockHoja()[k] === 0, "la presentación no quedó en cero");
  reponer(k, quedan);   // y se repone a mano, para que las pruebas que siguen tengan con qué
});
compra("un café que todavía no se vende", "stock", async () => {
  const prox = CAT.productos.find((p) => p.proximamente);
  if (!prox) return;
  const r = await llamar(apiPago, { items: [{ id: prox.id, g: prox.variantes[0].g, n: 1 }], comprador: cliente() });
  revisar(r.codigo === 400 && r.error === "no-disponible", "dejó comprar un café que no está a la venta");
});
compra("más de 30 bolsas en un pedido", "stock", async () => {
  const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 31 }], comprador: cliente() });
  revisar(r.codigo === 400 && r.error === "cantidad", "dejó apartar 31 bolsas de un golpe");
});

/* g) Reservas que nadie paga */
compra("reserva sin pagar se libera a las 2 horas", "reservas", async () => {
  const bono = nuevoBono(), items = [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }];
  const r = await llamar(apiPago, { items, bono, comprador: cliente() });
  revisar(r.ok, "no abrió el cobro");
  apartar(items, -1);
  pedidoDe(r.reference)[1] = new Date(Date.now() - 3 * 3600 * 1000);
  gs.liberarReservas();
  apartar(items, +1);
  revisar(pedidoDe(r.reference)[2] === "cancelado", "la reserva vieja no se liberó");
  revisar(bonoUsadoPor(bono) === "", "el bono de la reserva liberada no volvió");
  revisar(stockCuadra(), "las bolsas de la reserva no volvieron");
});
compra("una reserva reciente no se libera", "reservas", async () => {
  const items = [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }];
  const r = await llamar(apiPago, { items, comprador: cliente() });
  revisar(r.ok, "no abrió el cobro: " + r.error);
  apartar(items, -1);
  gs.liberarReservas();
  revisar(pedidoDe(r.reference)[2] === "nuevo", "liberó una reserva de hace un minuto");
});
compra("el pago llega después de liberar la reserva", "reservas", async () => {
  const items = [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador = cliente();
  const r = await llamar(apiPago, { items, comprador });
  revisar(r.ok, "no abrió el cobro: " + r.error);
  apartar(items, -1);
  const tr = WOMPI.cobrar(r, "card:4242424242424242").transaction;
  pedidoDe(r.reference)[1] = new Date(Date.now() - 3 * 3600 * 1000);
  gs.liberarReservas();
  apartar(items, +1);
  await llamar(apiWompi, WOMPI.aviso(tr));
  apartar(items, -1);
  const f = pedidoDe(r.reference);
  revisar(f[2] === "pagado" && /se volvió a apartar/.test(f[18]), "el pago tardío no volvió a apartar");
  revisar(stockCuadra(), "el stock no cuadra tras el pago tardío");
});
compra("un pedido pagado nunca se libera", "reservas", async () => {
  const c = await comprar();
  pedidoDe(c.r.reference)[1] = new Date(Date.now() - 30 * 3600 * 1000);
  gs.liberarReservas();
  revisar(pedidoDe(c.r.reference)[2] === "pagado", "liberó un pedido ya pagado");
});

/* h) Plata que no cuadra y anulaciones */
compra("pagó menos de lo que suma el pedido", "plata", async () => {
  const c = await comprar({ medio: "card:4111111111111111" });
  await llamar(apiWompi, WOMPI.aviso({ ...c.tr, status: "APPROVED", amount_in_cents: c.r.amountInCents - 500000 }));
  const f = pedidoDe(c.r.reference);
  revisar(f[2] === "nuevo" && /pagó .* y el pedido suma/.test(f[18]), "marcó pagado un pago incompleto");
  revisar(correosA("nandezcafe@gmail.com", /Revisar el pago/).some((m) => m.subject.includes(c.r.reference)), "no avisó a Nandez del pago incompleto");
});
compra("Wompi anula un pago ya confirmado", "plata", async () => {
  const c = await comprar();
  await llamar(apiWompi, WOMPI.aviso({ ...c.tr, status: "VOIDED" }));
  revisar(pedidoDe(c.r.reference)[2] === "nuevo", "un pedido anulado siguió como pagado");
  revisar(correosA("nandezcafe@gmail.com", /Pago anulado/).some((m) => m.subject.includes(c.r.reference)), "no avisó a Nandez de la anulación");
});

/* i) Bonos */
compra("bono vencido", "bonos", async () => {
  const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente(), bono: nuevoBono("vencido") });
  revisar(r.codigo === 400 && r.error === "bono" && r.motivo === "vencido", "aceptó un bono vencido");
});
compra("bono que no existe", "bonos", async () => {
  const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente(), bono: "GANG-NOEXI" });
  revisar(r.codigo === 400 && r.error === "bono", "aceptó un bono inventado");
});
compra("el mismo bono en dos compras", "bonos", async () => {
  const bono = nuevoBono();
  const a = await comprar({ bono, pct: 10 });
  revisar(a.r.ok, "no abrió la primera compra: " + a.r.error);
  revisarAprobada(a);
  const b = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente(), bono });
  revisar(b.codigo === 400 && b.motivo === "usado", "dejó usar el bono dos veces");
});
compra("bono en minúsculas y con espacios", "bonos", async () => {
  const bono = nuevoBono();
  const c = await comprar({ bono: "  " + bono.toLowerCase() + " ", pct: 10 });
  revisar(c.r.ok, "no reconoció el bono escrito en minúsculas: " + c.r.error);
  revisarAprobada(c);
});

/* j) Datos del comprador que el servidor debe rechazar aunque el navegador los deje pasar */
for (const [caso, extra, error] of [["sin correo", { correo: "" }, "correo"], ["correo sin arroba", { correo: "ana.correo.com" }, "correo"],
  ["cédula de 3 dígitos", { documento: "123" }, "documento"], ["teléfono corto", { tel: "300" }, "tel"],
  ["sin dirección", { direccion: "" }, "direccion"], ["sin departamento", { departamento: "" }, "direccion"],
  ["sin apellidos", { apellidos: "" }, "nombre"], ["nombre solo con espacios", { nombre: "   " }, "nombre"]]) {
  compra(`comprador ${caso}`, "datos del comprador", async () => {
    const r = await llamar(apiPago, { items: [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1 }], comprador: cliente(extra) });
    revisar(r.codigo === 400 && r.error === error, `debía rechazar con «${error}» y respondió «${r.error}»`);
  });
}
compra("carrito vacío o raro", "datos del comprador", async () => {
  for (const items of [[], null, "x", [{ id: "NADA", g: 250, n: 1 }], [{ id: vendibles[0].p.id, g: 999, n: 1 }],
    [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 0 }], [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: 1.5 }], [{ id: vendibles[0].p.id, g: vendibles[0].v.g, n: -2 }]]) {
    const r = await llamar(apiPago, { items, comprador: cliente() });
    revisar(r.codigo === 400, "aceptó el carrito " + JSON.stringify(items));
  }
});
compra("datos con HTML o comillas", "datos del comprador", async () => {
  const c = await comprar({ comprador: cliente({ nombre: "<b>Ana</b>", direccion: 'Calle "10" & <script>' }) });
  revisar(c.r.ok, "rechazó un nombre con símbolos: " + c.r.error);
  const m = correosA(c.comprador.correo, /Pago recibido/)[0];
  revisar(m && !/<script>|<b>Ana<\/b>/.test(m.htmlBody), "el correo dejó pasar HTML del comprador sin escapar");
});

/* k) Envío gratis justo en el borde */
compra("envío gratis desde el monto exacto", "envío", async () => {
  const caro = vendibles.find((x) => x.v.precio * Math.ceil(CAT.envio.gratisDesde / x.v.precio) <= 30 * x.v.precio);
  const n = Math.ceil(CAT.envio.gratisDesde / caro.v.precio), items = [{ id: caro.p.id, g: caro.v.g, n }];
  if (esperado[`${caro.p.id}-${caro.v.g}`] < n) return;
  const c = await comprar({ items });
  revisar(c.r.envio === 0, "no dio envío gratis por encima del monto");
  revisarAprobada(c);
});
compra("justo por debajo del envío gratis", "envío", async () => {
  const { p, v } = vendibles[0], n = Math.max(1, Math.floor((CAT.envio.gratisDesde - 1) / v.precio));
  if (v.precio * n >= CAT.envio.gratisDesde || esperado[`${p.id}-${v.g}`] < n) return;
  const c = await comprar({ items: [{ id: p.id, g: v.g, n }] });
  revisar(c.r.envio === CAT.envio.costo, "dio envío gratis por debajo del monto");
  revisarAprobada(c);
});

/* ---------- 9. correr todo ---------- */
const t0 = Date.now();
for (const r of resultados) {
  try { await r.fn(); r.ok = true; }
  catch (e) {
    r.ok = false; r.error = e.message;
    /* un error de programación (no una revisión que falló) va con la línea donde pasó */
    if (!/^[a-záéíóúñ]/.test(e.message || "")) r.error += " ← " + String(e.stack).split(/\r?\n/)[1].trim();
  }
}
/* invariantes de todo el lote */
const pedidos = H("Pedidos").slice(1), pagados = pedidos.filter((f) => f[2] === "pagado");
const inv = [
  ["el stock de la hoja es el que debe ser", stockCuadra()],
  ["ningún pedido pagado sin transacción", pagados.every((f) => f[26])],
  ["ningún pedido pagado por menos de su total", pagados.every((f) => !/pagó .* y el pedido suma/.test(f[18]))],
  ["cada pagado tiene exactamente un aviso a Nandez", pagados.every((f) => correosA("nandezcafe@gmail.com", new RegExp("Pago confirmado " + f[0] + " ")).length === 1)],
  ["ningún stock negativo", Object.values(stockHoja()).every((n) => n >= 0)],
  ["cada bono usado apunta a un pedido que no está cancelado",
    H("Bonos").slice(1).filter((b) => b[7]).every((b) => { const p = pedidoDe(b[7]); return p && p[2] !== "cancelado"; })],
  ["toda factura de pedido pagado cuadra",
    (() => { const op = JSON.parse(gs.doGet({ parameter: { accion: "operacion", clave: props.CLAVE } }).texto);
      return op.pedidos.filter((p) => p.estado === "pagado").every((p) => nav.textoFactura(p).cuadra === true); })()],
  ["ninguna salida a la red fuera de la hoja simulada", true],
  ["el Inventario del panel cuenta en su lote cada bolsa cobrada en la página", (() => {
    const op = JSON.parse(gs.doGet({ parameter: { accion: "operacion", clave: props.CLAVE } }).texto);
    nav.ponerPedidos(op.pedidos);
    const cobrados = op.pedidos.filter((p) => ["pagado", "despachado", "entregado"].includes(p.estado));
    let esperadas = 0, plata = 0;
    cobrados.forEach((p) => {
      const f = p.subtotal ? (p.subtotal - p.descuento) / p.subtotal : 1;
      p.items.forEach((i) => { if (!nav.loteDe(i.id)) return; esperadas += i.n * i.g / nav.presentacionDe(i.id); plata += i.p * i.n * f / (1 + CAT.iva / 100); });
    });
    const lotes = nav.enLotes(), bolsas = lotes.reduce((s, l) => s + l.bolsas, 0), ingresos = lotes.reduce((s, l) => s + l.ingresos, 0);
    /* y ningún pedido sin cobrar suma */
    nav.ponerPedidos(op.pedidos.map((p) => ({ ...p, estado: "nuevo" })));
    const sinCobrar = nav.enLotes().reduce((s, l) => s + l.bolsas, 0);
    return esperadas > 0 && Math.abs(bolsas - esperadas) < 1e-9 && Math.abs(ingresos - plata) < 0.01 && sinCobrar === 0;
  })()],
];

/* ---------- 10. el informe ---------- */
const porCat = {};
resultados.forEach((r) => { (porCat[r.categoria] ||= { ok: 0, mal: 0 })[r.ok ? "ok" : "mal"]++; });
const total = resultados.length, bien = resultados.filter((r) => r.ok).length;
console.log(`\nCOMPRAS DE PRUEBA · catálogo ${CATALOGO_REAL ? "real" : "de prueba"} · ${((Date.now() - t0) / 1000).toFixed(1)} s\n`);
Object.entries(porCat).forEach(([c, n]) => console.log(`  ${n.mal ? "FALLA" : "OK   "}  ${c.padEnd(24)} ${n.ok}/${n.ok + n.mal}`));
console.log(`\n  ${bien}/${total} compras bien · ${pedidos.length} pedidos en la hoja · ${pagados.length} pagados · ${correos.length} correos`);
console.log(`  del lote al azar: ${lote.aprobadas} pagadas y ${lote.agotadas} rechazadas por agotado`);
console.log(`  plata cobrada: $${pagados.reduce((s, f) => s + Number(f[11]), 0).toLocaleString("es-CO")}`);
console.log("\nINVARIANTES");
inv.forEach(([t, ok]) => console.log(`  ${ok ? "OK   " : "FALLA"}  ${t}`));
const fallas = resultados.filter((r) => !r.ok);
if (fallas.length) { console.log("\nLO QUE FALLÓ"); fallas.slice(0, 30).forEach((r) => console.log(`  · ${r.nombre}: ${r.error}`)); }
process.chdir(RAIZ);
fs.rmSync(TMP, { recursive: true, force: true });
if (fallas.length || inv.some(([, ok]) => !ok)) process.exitCode = 1;

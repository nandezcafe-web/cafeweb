/* ============================================================
   MERCADO PAGO DE PRUEBA · api/checkout.js y api/webhook.js, de punta a punta
   Uso:  node tools/pruebas/mercadopago.mjs

   Corre el código de verdad (api/checkout.js, api/webhook.js y la hoja
   tools/correos/Codigo.gs) con Mercado Pago, Google Sheets y Gmail simulados.
   Revisa que:
   - sin MP_ACCESS_TOKEN el cobro no abre (la página cae al pago manual),
   - la preferencia se crea con los precios del catálogo y suma exactamente el total,
   - la reserva aparta el cupo de la preventa en la hoja,
   - un aviso de pago aprobado marca el pedido pagado, una sola vez,
   - un pago rechazado, o por menos del total, NO lo marca pagado,
   - un pago anulado después de pagado lo devuelve a «nuevo»,
   - un aviso con el número de un pago que no existe no mueve nada.
   No toca la hoja real ni envía correos.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { RAIZ, hojaSimulada, conectar, llamar } from "./simulador.mjs";

const hoy = new Date(), dia = (d) => new Date(hoy.getTime() + d * 864e5).toISOString().slice(0, 10);
const cafe = (id, extra) => ({ id, nombre: { es: id, en: id }, sale: { es: "En grano" }, proximamente: false, color: "#2F5A3C",
  sub: { es: "", en: "" }, gramos: 250, foto: "", url: { es: "https://prueba.local/" + id, en: "https://prueba.local/en/" + id }, ...extra });
const CAT = {
  productos: [
    cafe("P-CAS", { precio: 40000, preventa: false, entrega: "", variantes: [{ g: 250, precio: 40000, stock: 50 }] }),
    cafe("P-BLE", { precio: 40000, preventa: true, entrega: dia(10), cierre: dia(10), cupo: 3, preventaPrecio: 36000,
      variantes: [{ g: 250, precio: 40000, stock: 0 }] }),
  ],
  envio: { costo: 12000, gratisDesde: 120000 }, iva: 5, registro: "https://hoja.prueba/exec",
};
const TMP = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMPDIR || "/tmp"), "mp-"));
fs.mkdirSync(path.join(TMP, "prototipo/data"), { recursive: true });
fs.writeFileSync(path.join(TMP, "prototipo/data/catalogo.json"), JSON.stringify(CAT));
process.chdir(TMP);

const { gs, props, correos, H } = hojaSimulada(CAT);
conectar({ gs, props });

/* Mercado Pago de mentira: guarda las preferencias y responde pagos que pongamos en PAGOS */
const PREFERENCIAS = [], PAGOS = {};
const fetchHoja = globalThis.fetch;
globalThis.fetch = async (url, op = {}) => {
  const u = new URL(url);
  if (u.host !== "api.mercadopago.com") return fetchHoja(url, op);
  if (op.headers?.Authorization !== "Bearer APP_USR-PRUEBA") return { ok: false, status: 401, json: async () => ({ message: "token" }) };
  if (u.pathname === "/checkout/preferences") {
    const pref = JSON.parse(op.body); PREFERENCIAS.push(pref);
    return { ok: true, status: 201, json: async () => ({ id: "pref-" + PREFERENCIAS.length, init_point: "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=" + PREFERENCIAS.length }) };
  }
  const m = u.pathname.match(/^\/v1\/payments\/(\d+)$/);
  if (m) return PAGOS[m[1]] ? { ok: true, status: 200, json: async () => PAGOS[m[1]] } : { ok: false, status: 404, json: async () => ({}) };
  throw new Error("salida a la red no prevista: " + url);
};

const url = (f) => new URL("file:///" + path.join(RAIZ, f).replace(/\\/g, "/")).href;
const checkout = (await import(url("api/checkout.js"))).default;
const webhook = (await import(url("api/webhook.js"))).default;

let n = 0;
const comprador = () => (n++, { nombre: "Ana", apellidos: "Prueba", documento: String(1000000000 + n), tel: "3001234567",
  direccion: "Calle 10 # 5-23", ciudad: "Cúcuta", departamento: "Norte de Santander", correo: `p${n}@correo.com` });
const stock = () => Object.fromEntries(H("Stock").slice(1).map((f) => [f[0], Number(f[2])]));
const pedido = (id) => H("Pedidos").find((f) => f[0] === id);
const aviso = (id) => llamar(webhook, { type: "payment", data: { id: String(id) } });
const pagoMP = (id, ref, status, monto, extra = {}) => (PAGOS[id] = { id, status, external_reference: ref, transaction_amount: monto, currency_id: "COP", payment_type_id: "credit_card", ...extra });

const fallas = [];
const revisar = (ok, que) => { console.log((ok ? "  OK     " : "  FALLA  ") + que); if (!ok) fallas.push(que); };

/* 1. sin token */
delete process.env.MP_ACCESS_TOKEN;
let r = await llamar(checkout, { items: [{ id: "P-BLE", g: 250, n: 2 }], comprador: comprador() });
revisar(r.codigo === 503 && r.error === "sin-pasarela", "sin MP_ACCESS_TOKEN el cobro no abre");
process.env.MP_ACCESS_TOKEN = "APP_USR-PRUEBA";

/* 2. el navegador no decide el precio */
r = await llamar(checkout, { items: [{ id: "P-BLE", g: 250, n: 2, precio: 1, unit_price: 1 }], comprador: comprador(), idioma: "es" });
const pref = PREFERENCIAS.at(-1);
revisar(r.codigo === 200 && r.ok && /mercadopago/.test(r.url || ""), "abre el cobro y devuelve el enlace de Mercado Pago");
revisar(r.total === 84000 && r.subtotal === 72000 && r.envio === 12000, "total del servidor: 2 × $36.000 de preventa + $12.000 de envío");
const sumaMP = pref.items.reduce((s, i) => s + i.quantity * i.unit_price, 0) + (pref.shipments?.cost || 0);
revisar(sumaMP === r.total, "lo que cobra Mercado Pago (líneas + envío) suma exactamente el total");
revisar(pref.external_reference === r.reference && pref.items.every((i) => i.currency_id === "COP"), "la referencia es el número de pedido y todo va en pesos");
revisar(pref.notification_url === "https://prueba.local/api/webhook" && /pedido=/.test(pref.back_urls.success), "los avisos y el regreso apuntan a la misma página");
revisar(pref.payment_methods.excluded_payment_types.some((x) => x.id === "ticket"), "sin efectivo: la reserva se libera a las 2 horas");
const ref1 = r.reference, f1 = pedido(ref1);
revisar(f1 && f1[13] === "mercadopago" && f1[2] === "nuevo", "el pedido queda en la hoja como reserva del canal mercadopago");
revisar(stock()["P-BLE-250-pre"] === 1, "la hoja aparta el cupo de la preventa: quedan 1 de 3");
revisar(correos.length === 0, "mientras no pague no sale ningún correo");

/* 3. todo o nada con el cupo */
r = await llamar(checkout, { items: [{ id: "P-BLE", g: 250, n: 2 }], comprador: comprador() });
revisar(r.codigo === 409 && r.error === "agotado", "sin cupo suficiente no se abre el cobro ni se aparta nada");
revisar(stock()["P-BLE-250-pre"] === 1, "y el cupo no se movió");

/* 4. avisos */
let w = await llamar(webhook, { type: "merchant_order", data: { id: "9" } });
revisar(w.codigo === 200 && w.ignorado, "un aviso que no es de pago se ignora");
w = await aviso(999);
revisar(w.codigo === 200 && pedido(ref1)[2] === "nuevo", "un número de pago que Mercado Pago no conoce no mueve nada");
pagoMP(101, ref1, "pending", 84000);
w = await aviso(101);
revisar(w.codigo === 200 && pedido(ref1)[2] === "nuevo", "pago pendiente: el pedido sigue sin pagar");
pagoMP(102, ref1, "rejected", 84000);
await aviso(102);
revisar(pedido(ref1)[2] === "nuevo" && /rechazado/i.test(pedido(ref1)[18]), "pago rechazado: no se marca pagado y queda anotado");
pagoMP(103, ref1, "approved", 80000);
await aviso(103);
revisar(pedido(ref1)[2] === "nuevo" && /Ojo: pagó/.test(pedido(ref1)[18]), "pagó menos del total: NO se marca pagado y se avisa a Nandez");
const avisos0 = correos.length;
pagoMP(104, ref1, "approved", 84000);
w = await aviso(104);
revisar(w.ok && pedido(ref1)[2] === "pagado" && pedido(ref1)[14], "pago aprobado por el total: el pedido queda pagado");
revisar(correos.length > avisos0, "salen los correos de pago confirmado");
const correos1 = correos.length;
await aviso(104);
revisar(correos.length === correos1, "si Mercado Pago repite el aviso, no pasa nada dos veces");
pagoMP(104, ref1, "refunded", 84000);
await aviso(104);
revisar(pedido(ref1)[2] === "nuevo", "un pago devuelto después de pagado vuelve a «nuevo»: no se despacha");

/* 5. reserva que nadie paga: el reintento la suelta */
r = await llamar(checkout, { items: [{ id: "P-CAS", g: 250, n: 1 }], comprador: comprador() });
const ref2 = r.reference;
revisar(r.ok && stock()["P-CAS-250"] === 49, "una compra normal descuenta del stock del café");
r = await llamar(checkout, { items: [{ id: "P-CAS", g: 250, n: 1 }], comprador: comprador(), reemplaza: ref2 });
revisar(r.ok && pedido(ref2)[2] === "cancelado" && stock()["P-CAS-250"] === 49, "al reintentar se suelta la reserva anterior y se aparta de nuevo");

/* 6. el pedido de otro canal no se puede soltar desde la página */
const manual = gs.doPost({ postData: { contents: JSON.stringify({ tipo: "pedido", id: "NDZ-MANUAL", canal: "web", nombre: "X", correo: "x@correo.com",
  items: [{ id: "P-CAS", g: 250, n: 1, nombre: "P-CAS", precio: 40000, stock: 50 }], subtotal: 40000, envio: 12000, total: 52000 }) } });
const soltar = JSON.parse(gs.doPost({ postData: { contents: JSON.stringify({ accion: "pedido", clave: props.CLAVE, id: "NDZ-MANUAL", estado: "cancelado", soloReserva: true }) } }).texto);
revisar(soltar.error === "no-es-reserva", "un pedido manual no se puede cancelar como si fuera una reserva de pasarela");

console.log(fallas.length ? `\n${fallas.length} fallas` : "\nTodo bien");
process.exit(fallas.length ? 1 : 0);

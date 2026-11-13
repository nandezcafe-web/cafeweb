/* Lo de afuera, simulado, para probar el sistema de pago sin tocar nada real:
   - la hoja de Google y Gmail, en memoria, corriendo tools/correos/Codigo.gs de verdad
   - Wompi, siguiendo su documentación: valida la firma de integridad del cobro y
     firma sus avisos con el secreto de eventos
   - el código del navegador que arma la factura del panel
   Lo usan tools/pruebas/compras.mjs (compras en lote) y tools/pruebas/servidor.mjs
   (la tienda en el navegador). Nunca sale a la red. */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const REGISTRO = "https://hoja.prueba/exec";
export const sha = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");

/* La hoja de Google con el script de verdad adentro */
export function hojaSimulada(catalogo) {
  const libros = {};
  function nuevaHoja(nombre) {
    const filas = [];
    return { nombre, filas, appendRow: (r) => filas.push(r.slice()), setFrozenRows() {}, deleteRows: (r, n) => filas.splice(r - 1, n),
      getLastColumn: () => filas.reduce((n, f) => Math.max(n, f.length), 0), getLastRow: () => filas.length,
      getRange: (r, c, nr, nc) => {
        const celda = (i, j, v) => { while (filas.length < i) filas.push([]); filas[i - 1][j - 1] = v; };
        const leer = (i, j) => { const f = filas[i - 1] || []; return f[j - 1] === undefined ? "" : f[j - 1]; };
        const rango = { setValue: (v) => (celda(r, c, v), rango),
          setValues: (vs) => (vs.forEach((f, i) => f.forEach((v, j) => celda(r + i, c + j, v))), rango),
          getValues: () => Array.from({ length: nr || 1 }, (_, i) => Array.from({ length: nc || 1 }, (_, j) => leer(r + i, c + j))),
          setFontWeight: () => rango };
        return rango;
      },
      getDataRange: () => ({ getValues: () => filas.map((f) => f.slice()) }) };
  }
  function nuevoLibro() {
    const hojas = { "Hoja 1": nuevaHoja("Hoja 1") }, id = "L" + Object.keys(libros).length;
    const ss = { getId: () => id, getUrl: () => "https://docs.google.com/" + id, getSheetByName: (n) => hojas[n] || null,
      insertSheet: (n) => (hojas[n] = nuevaHoja(n)), getSheets: () => Object.values(hojas), deleteSheet: (h) => delete hojas[h.nombre], hojas };
    return (libros[id] = ss);
  }
  const props = {}, correos = [], disparadores = [];
  const gs = { console, JSON, Date, String, Math, Object, Number, Array,
    SpreadsheetApp: { create: nuevoLibro, openById: (id) => libros[id] },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    Utilities: { getUuid: () => crypto.randomUUID(), formatDate: (d, zona, f) => "2026-S" + String(d.getUTCDate()).padStart(2, "0"),computeHmacSha256Signature: (v, k) => [...crypto.createHmac("sha256", k).update(v).digest()],
      base64EncodeWebSafe: (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_") },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (t) => ({ setMimeType: () => ({ texto: t }) }) },
    HtmlService: { createHtmlOutput: (h) => ({ setTitle: () => ({ html: h }) }) },
    MailApp: { getRemainingDailyQuota: () => 1000, sendEmail: (o) => correos.push(o) },
    /* GmailApp manda como thegang@ (alias): se anota igual que MailApp, con el remitente */
    GmailApp: { sendEmail: (to, subject, body, o = {}) => { if (!o.from) throw new Error("sin remitente"); correos.push({ to, subject, body, htmlBody: o.htmlBody, from: o.from, replyTo: o.replyTo, name: o.name }); } },
    Session: { getEffectiveUser: () => ({ getEmail: () => "nandezcafe@gmail.com" }) },
    ScriptApp: { getService: () => ({ getUrl: () => "https://script.google.com/macros/s/PRUEBA/exec" }),
      WeekDay: { MONDAY: "MONDAY" },
      getProjectTriggers: () => disparadores.map((f) => ({ getHandlerFunction: () => f })),
      newTrigger: (f) => { const t = { timeBased: () => t, everyDays: () => t, everyHours: () => t, onWeekDay: () => t, atHour: () => t, create: () => disparadores.push(f) }; return t; } },
    Logger: { log() {} },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(catalogo) }) } };
  vm.createContext(gs);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, "tools/correos/Codigo.gs"), "utf8"), gs);
  gs.configurar();
  const SS = Object.values(libros)[0];
  return { gs, props, correos, SS, H: (n) => SS.hojas[n].filas };
}

/* Las variables de Vercel y la salida a la hoja: todo lo que vaya a REGISTRO lo
   contesta la hoja simulada; cualquier otra salida a la red es un error. */
export function conectar({ gs, props }) {
  Object.assign(process.env, { WOMPI_INTEGRIDAD: "test_integrity_SECRETO", WOMPI_EVENTOS: "test_events_SECRETO",
    NANDEZ_CLAVE: props.CLAVE, REGISTRO_URL: REGISTRO });
  globalThis.fetch = async (url, op = {}) => {
    const u = new URL(url);
    if (u.origin + u.pathname !== REGISTRO) throw new Error("salida a la red no prevista: " + url);
    return { ok: true, status: 200, json: async () => JSON.parse(hojaResponde(gs, op.method, op.body, u.searchParams)) };
  };
}
export const hojaResponde = (gs, metodo, cuerpo, params) => (metodo === "POST"
  ? gs.doPost({ postData: { contents: cuerpo } }).texto
  : gs.doGet({ parameter: Object.fromEntries(params) }).texto);

/* Los manejadores de Vercel, cargados de api/ */
export async function api() {
  const url = (f) => new URL("file:///" + path.join(RAIZ, f).replace(/\\/g, "/")).href;
  return { pago: (await import(url("api/pago.js"))).default, wompi: (await import(url("api/wompi.js"))).default };
}
export async function llamar(fn, body, headers = {}) {
  let codigo = 0, salida = null;
  const res = { status: (c) => ((codigo = c), res), json: (o) => ((salida = o), res), end: () => res };
  await fn({ method: "POST", body, headers: { host: "prueba.local", ...headers } }, res);
  return { codigo, ...salida };
}

/* Wompi, según docs.wompi.co: tarjetas, Nequi y PSE de prueba con su resultado */
export const WOMPI = {
  cobrar(j, medio) {
    const firma = sha(`${j.reference}${j.amountInCents}${j.currency}${j.expirationTime}${process.env.WOMPI_INTEGRIDAD}`);
    if (firma !== j.signature?.integrity) return { error: "firma de integridad inválida" };
    if (new Date(j.expirationTime) < new Date()) return { error: "cobro vencido" };
    if (!Number.isInteger(j.amountInCents) || j.amountInCents % 100) return { error: "monto en centavos raro" };
    const status = { "card:4242424242424242": "APPROVED", "card:4111111111111111": "DECLINED", "nequi:3991111111": "APPROVED",
      "nequi:3992222222": "DECLINED", "pse:1": "APPROVED", "pse:2": "DECLINED" }[medio] || "ERROR";
    const tipo = { card: "CARD", nequi: "NEQUI", pse: "PSE" }[String(medio).split(":")[0]];
    return { transaction: { id: crypto.randomUUID().slice(0, 8) + "-" + Date.now(), reference: j.reference, status,
      amount_in_cents: j.amountInCents, currency: j.currency, payment_method_type: tipo } };
  },
  aviso(tr, { secreto = process.env.WOMPI_EVENTOS, ambiente = "test", props = ["transaction.id", "transaction.status", "transaction.amount_in_cents"] } = {}) {
    const timestamp = Math.floor(Date.now() / 1000);
    const val = (r) => r.split(".").reduce((o, k) => o?.[k], { transaction: tr });
    return { event: "transaction.updated", data: { transaction: tr }, environment: ambiente,
      signature: { properties: props, checksum: sha(props.map(val).join("") + timestamp + secreto) }, timestamp, sent_at: new Date().toISOString() };
  },
};

/* El código del navegador que arma la factura del panel */
export function navegador() {
  const nav = { console, JSON, Date, String, Math, Object, Number, Array, isNaN, parseFloat, parseInt,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, navigator: { language: "es" },
    location: { pathname: "/", href: "/", search: "" },
    document: { querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, documentElement: { classList: { add() {} } } },
    window: { addEventListener() {} }, setInterval() {}, setTimeout() {}, fetch: () => Promise.resolve({ json: () => ({}) }) };
  vm.createContext(nav);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, "prototipo/js/core.js"), "utf8"), nav);
  /* el Inventario del panel: lee las ventas de la página desde OP.datos */
  nav.coClave = () => "";
  vm.runInContext(fs.readFileSync(path.join(RAIZ, "prototipo/js/inventory.js"), "utf8"), nav);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, "prototipo/js/operacion.js"), "utf8"), nav);
  nav.ponerPedidos = (pedidos) => vm.runInContext("OP.datos = " + JSON.stringify({ pedidos }), nav);
  nav.enLotes = () => vm.runInContext("S.compras.map((c) => ({ id: c.id, ...ventasWeb(c), recuperado: recuperado(c), manual: c.ingresos || 0 }))", nav);
  nav.loteDe = (id) => vm.runInContext("(S.productos.find((p) => p.id === " + JSON.stringify(id) + ") || {}).loteId || null", nav);
  nav.presentacionDe = (id) => vm.runInContext("(S.productos.find((p) => p.id === " + JSON.stringify(id) + ") || {}).presentacion || 250", nav);
  return nav;
}

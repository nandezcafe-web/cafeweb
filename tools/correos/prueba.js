/* Prueba del script de correos sin Google: imita la Hoja, Gmail y las propiedades en memoria.
   Uso:  node tools/correos/prueba.js tools/correos/Codigo.gs */
const fs = require("fs"), vm = require("vm"), crypto = require("crypto");
const codigo = fs.readFileSync(process.argv[2], "utf8");

const libros = {};
function nuevaHoja(nombre) {
  const filas = [];
  return { nombre, filas,
    appendRow: (r) => filas.push(r.slice()), setFrozenRows() {},
    getRange: (r, c, nr, nc) => ({ setValue: (v) => { while (filas.length < r) filas.push([]); filas[r - 1][c - 1] = v; }, setFontWeight() { return this; } }),
    getDataRange: () => ({ getValues: () => filas.map((f) => f.slice()) }) };
}
function nuevoLibro(nombre) {
  const hojas = { "Hoja 1": nuevaHoja("Hoja 1") }, id = "L" + Object.keys(libros).length;
  const ss = { getId: () => id, getUrl: () => "https://docs.google.com/" + id, getSheetByName: (n) => hojas[n] || null,
    insertSheet: (n) => (hojas[n] = nuevaHoja(n)), getSheets: () => Object.values(hojas), deleteSheet: (h) => delete hojas[h.nombre], hojas };
  return (libros[id] = ss);
}
const props = {}, enviados = []; let cuota = 3;
const ctx = {
  console, JSON, Date, String, Math, Object,
  SpreadsheetApp: { create: nuevoLibro, openById: (id) => libros[id] },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  Utilities: { getUuid: () => crypto.randomUUID(), computeHmacSha256Signature: (v, k) => [...crypto.createHmac("sha256", k).update(v).digest()],
    base64EncodeWebSafe: (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_") },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: (t) => ({ setMimeType: () => ({ texto: t }) }) },
  HtmlService: { createHtmlOutput: (h) => ({ setTitle: () => ({ html: h }) }) },
  MailApp: { getRemainingDailyQuota: () => cuota, sendEmail: (o) => { enviados.push(o); cuota--; } },
  Session: { getEffectiveUser: () => ({ getEmail: () => "nandezcafe@gmail.com" }) },
  ScriptApp: { getService: () => ({ getUrl: () => "https://script.google.com/macros/s/X/exec" }) },
  Logger: { log: (m) => console.log("  log:", m) },
};
vm.createContext(ctx); vm.runInContext(codigo, ctx);
const post = (d) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(d) } }).texto);
const get = (q) => ctx.doGet({ parameter: q });
const ok = (cond, txt) => { console.log((cond ? "OK   " : "FALLA") + "  " + txt); if (!cond) process.exitCode = 1; };

ctx.configurar();
const ss = Object.values(libros)[0];
ok(!ss.hojas["Hoja 1"] && ss.hojas["Contactos"] && ss.hojas["Registros"] && ss.hojas["Envíos"] && ss.hojas["Entregas"], "configurar crea las hojas y quita la vacía");
ok(/^[0-9a-f]{32}$/.test(props.CLAVE), "configurar genera una clave de 32 caracteres");

ok(post({ tipo: "comunidad", correo: "Ana@Correo.com", consentimiento: true }).ok, "la comunidad se registra");
post({ tipo: "espera", correo: "ana@correo.com", producto: "Tibo B" });
post({ tipo: "suscripcion", mail: "luis@correo.com", plan: "cosecha", ciudad: "Cúcuta" });
post({ tipo: "comunidad", correo: "sin-casilla@correo.com" });
post({ tipo: "comunidad", correo: "no es un correo", consentimiento: true });
ok(JSON.parse(post.length ? ctx.doPost({ postData: { contents: "{roto" } }).texto : "{}").ok === false, "un cuerpo roto se rechaza sin romper");

const c = ss.hojas["Contactos"].filas;
ok(c.length === 4, "tres contactos únicos (más el encabezado); el correo inválido no entra: " + (c.length - 1));
const ana = c.find((f) => f[0] === "ana@correo.com");
ok(ana && ana[2] === "comunidad, espera: Tibo B" && ana[3] === true, "un mismo correo junta etiquetas y conserva su autorización");
const luis = c.find((f) => f[0] === "luis@correo.com");
ok(luis && luis[2] === "suscripción: cosecha" && luis[3] === false && luis[7] === "Cúcuta", "la suscripción llega como 'mail', no acepta publicidad y guarda la ciudad");
ok(c.find((f) => f[0] === "sin-casilla@correo.com")[3] === false, "sin la casilla no acepta correos");
ok(ss.hojas["Registros"].filas.length === 6, "cada registro queda en la bitácora, también el inválido");

ok(JSON.parse(get({ accion: "lista", clave: "mala" }).texto).ok === false, "la lista pide la clave");
const lista = JSON.parse(get({ accion: "lista", clave: props.CLAVE }).texto);
ok(lista.ok && lista.contactos.length === 3 && lista.cuota === 3, "con la clave, la lista trae los contactos y la cuota");

ok(post({ accion: "enviar", clave: "mala", asunto: "a", mensaje: "b" }).ok === false, "enviar pide la clave");
const prueba = post({ accion: "enviar", clave: props.CLAVE, prueba: true, asunto: "Hola", mensaje: "Uno\n\nDos <b>" });
ok(prueba.ok && enviados.length === 1 && enviados[0].to === "nandezcafe@gmail.com", "la prueba solo va al Gmail de Nandez");
ok(enviados[0].htmlBody.includes("&lt;b&gt;") && enviados[0].htmlBody.includes("accion=baja"), "el mensaje se escapa y trae enlace de baja");
const real = post({ accion: "enviar", clave: props.CLAVE, asunto: "Salió el Tibo B", mensaje: "Ya está." });
ok(real.ok && real.enviados === 1 && enviados[1].to === "ana@correo.com", "la campaña solo va a quien aceptó (Ana)");

const enlace = enviados[1].htmlBody.match(/href="([^"]*accion=baja[^"]*)"/)[1];
const q = Object.fromEntries(new URL(enlace).searchParams);
ok(get({ ...q, f: "falsa" }).html.includes("no es válido"), "una baja con firma falsa no hace nada");
ok(get(q).html.includes("no te vamos a escribir"), "la baja firmada funciona");
const ana2 = ss.hojas["Contactos"].filas.find((f) => f[0] === "ana@correo.com");
ok(ana2[3] === false && ana2[6] instanceof Date, "tras la baja ya no acepta correos y queda la fecha");
const otra = post({ accion: "enviar", clave: props.CLAVE, asunto: "Otra", mensaje: "x" });
ok(otra.ok && otra.enviados === 0, "después de la baja, la campaña no le llega");
post({ tipo: "comunidad", correo: "ana@correo.com", consentimiento: true });
ok(ss.hojas["Contactos"].filas.find((f) => f[0] === "ana@correo.com")[3] === true, "si vuelve a unirse con la casilla, se reactiva");

cuota = 0;
const sinCuota = post({ accion: "enviar", clave: props.CLAVE, asunto: "Sin cuota", mensaje: "x" });
ok(sinCuota.ok && sinCuota.enviados === 0 && sinCuota.pendientes === 1, "sin cuota, nada se envía y queda contado para mañana");
ok(ss.hojas["Envíos"].filas.length === 5, "cada envío queda en la hoja de envíos");
cuota = 10;
post({ tipo: "comunidad", correo: "sara@correo.com", consentimiento: true });
const n0 = enviados.length;
const repetida = post({ accion: "enviar", clave: props.CLAVE, asunto: "Salió el Tibo B", mensaje: "Ya está." });
ok(repetida.ok && repetida.enviados === 1 && enviados[n0].to === "sara@correo.com", "reenviar la misma campaña solo les llega a quienes faltan (Sara, no Ana)");

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
const props = {}, enviados = [], disparadores = []; let cuota = 3;
const ctx = {
  console, JSON, Date, String, Math, Object, Number, Array,
  SpreadsheetApp: { create: nuevoLibro, openById: (id) => libros[id] },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  Utilities: { getUuid: () => crypto.randomUUID(), computeHmacSha256Signature: (v, k) => [...crypto.createHmac("sha256", k).update(v).digest()],
    base64EncodeWebSafe: (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_") },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: (t) => ({ setMimeType: () => ({ texto: t }) }) },
  HtmlService: { createHtmlOutput: (h) => ({ setTitle: () => ({ html: h }) }) },
  MailApp: { getRemainingDailyQuota: () => cuota, sendEmail: (o) => { if (cuota < 1) throw new Error("sin cuota"); enviados.push(o); cuota--; } },
  Session: { getEffectiveUser: () => ({ getEmail: () => "nandezcafe@gmail.com" }) },
  ScriptApp: { getService: () => ({ getUrl: () => "https://script.google.com/macros/s/X/exec" }),
    getProjectTriggers: () => disparadores.map((f) => ({ getHandlerFunction: () => f })),
    newTrigger: (f) => { const t = { timeBased: () => t, everyDays: () => t, atHour: () => t, create: () => disparadores.push(f) }; return t; } },
  Logger: { log: (m) => console.log("  log:", m) },
};
vm.createContext(ctx); vm.runInContext(codigo, ctx);
const post = (d) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(d) } }).texto);
const get = (q) => ctx.doGet({ parameter: q });
const getJ = (q) => JSON.parse(get(q).texto);
const ok = (cond, txt) => { console.log((cond ? "OK   " : "FALLA") + "  " + txt); if (!cond) process.exitCode = 1; };
const ultimo = () => enviados[enviados.length - 1];
const haceDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

ctx.configurar();
ctx.configurar();
const ss = Object.values(libros)[0];
ok(!ss.hojas["Hoja 1"] && ["Contactos", "Registros", "Envíos", "Entregas", "Pedidos", "Suscripciones", "Bonos"].every((h) => ss.hojas[h]), "configurar crea las hojas y quita la vacía");
ok(/^[0-9a-f]{32}$/.test(props.CLAVE), "configurar genera una clave de 32 caracteres");
ok(disparadores.length === 1 && disparadores[0] === "diario", "configurar programa el aviso diario una sola vez, aunque se ejecute dos veces");

/* ---- registros y bienvenida ---- */
cuota = 50;
const r1 = post({ tipo: "comunidad", correo: "Ana@Correo.com", consentimiento: true });
ok(r1.ok && r1.bienvenida === "enviada", "la comunidad se registra y responde que la bienvenida salió");
const bienv = ultimo(), codigoAna = ss.hojas["Bonos"].filas[1][0];
ok(bienv.to === "ana@correo.com" && /^GANG-[A-HJ-NP-Z2-9]{5}$/.test(codigoAna), "a Ana le llega la bienvenida y su bono tiene el formato GANG-XXXXX sin letras confusas");
ok(bienv.htmlBody.includes(codigoAna) && bienv.htmlBody.includes("/cafes?bono=" + codigoAna) && bienv.htmlBody.includes("accion=baja"), "la bienvenida trae el código, el botón que lo deja en el carrito y la baja");
ok(/\d+ de [a-z]+/.test(bienv.body), "la fecha de vencimiento va en español");
const n1 = enviados.length;
ok(post({ tipo: "comunidad", correo: "ana@correo.com", consentimiento: true }).bienvenida === "ya" && enviados.length === n1, "si vuelve a unirse, no le llega otra bienvenida ni otro bono");
post({ tipo: "espera", correo: "ana@correo.com", producto: "Tibo B" });
post({ tipo: "suscripcion", mail: "luis@correo.com", plan: "cosecha", ciudad: "Cúcuta", cada: 2, molienda: "grano", kit: true });
ok(post({ tipo: "comunidad", correo: "sin-casilla@correo.com" }).bienvenida === undefined, "sin la casilla no hay bono ni bienvenida");
post({ tipo: "comunidad", correo: "no es un correo", consentimiento: true });
ok(JSON.parse(ctx.doPost({ postData: { contents: "{roto" } }).texto).ok === false, "un cuerpo roto se rechaza sin romper");
ok(ss.hojas["Bonos"].filas.length === 2, "un solo bono: el de Ana");
post({ tipo: "comunidad", correo: "Mike@mail.com", consentimiento: true, idioma: "en" });
ok(ultimo().to === "mike@mail.com" && ultimo().subject.startsWith("Welcome") && ultimo().htmlBody.includes("/en/coffees?bono="), "quien se une desde la página en inglés la recibe en inglés");

const c = ss.hojas["Contactos"].filas;
ok(c.length === 5, "cuatro contactos únicos (más el encabezado); el correo inválido no entra: " + (c.length - 1));
const ana = c.find((f) => f[0] === "ana@correo.com");
ok(ana && ana[2] === "comunidad, espera: Tibo B" && ana[3] === true, "un mismo correo junta etiquetas y conserva su autorización");
const luis = c.find((f) => f[0] === "luis@correo.com");
ok(luis && luis[2] === "suscripción: cosecha" && luis[3] === false && luis[7] === "Cúcuta", "la suscripción llega como 'mail', no acepta publicidad y guarda la ciudad");
ok(c.find((f) => f[0] === "sin-casilla@correo.com")[3] === false, "sin la casilla no acepta correos");
ok(ss.hojas["Registros"].filas.length === 8, "cada registro queda en la bitácora, también el inválido");

/* ---- el bono en el carrito ---- */
const b = getJ({ accion: "bono", codigo: codigoAna.toLowerCase() });
ok(b.ok && b.pct === 10 && b.codigo === codigoAna && !b.correo, "el bono se valida sin importar mayúsculas y no revela de quién es");
ok(getJ({ accion: "bono", codigo: "GANG-ZZZZZ" }).error === "no", "un código inventado no sirve");

/* ---- pedidos ---- */
const nP = enviados.length;
const rp = post({ tipo: "pedido", id: "NDZ-1022-AB12", correo: "ana@correo.com", nombre: "Ana", ciudad: "Cúcuta", tel: "3001234567", canal: "correo",
  items: [{ n: 2, nombre: "Tibo B 250 g", forma: "Grano" }], subtotal: 100000, descuento: 10000, envio: 12000, total: 102000, bono: codigoAna });
ok(rp.ok && rp.pedido === "NDZ-1022-AB12", "el pedido se guarda y devuelve su número");
const fp = ss.hojas["Pedidos"].filas[1];
ok(fp[2] === "nuevo" && fp[7] === "2 × Tibo B 250 g (grano)" && fp[11] === 102000 && fp[12] === codigoAna && !fp[18], "la fila del pedido trae estado, productos, total y bono");
ok(getJ({ accion: "bono", codigo: codigoAna }).error === "usado", "después del pedido, el bono queda usado");
ok(enviados.length === nP + 2 && enviados[nP].to === "nandezcafe@gmail.com" && enviados[nP + 1].to === "ana@correo.com", "llega aviso a Nandez y constancia al cliente");
post({ tipo: "pedido", id: "NDZ-1022-CD34", nombre: "Pepe", ciudad: "Pamplona", items: [{ n: 1, nombre: "Castillo 500 g" }], subtotal: 60000, descuento: 6000, envio: 12000, total: 66000, bono: codigoAna });
ok(/no sirve \(usado\)/.test(ss.hojas["Pedidos"].filas[2][18]), "un bono ya usado queda marcado en las notas del pedido para revisarlo");

ok(getJ({ accion: "operacion", clave: "mala" }).ok === false, "la operación pide la clave");
const op = getJ({ accion: "operacion", clave: props.CLAVE });
ok(op.ok && op.pedidos.length === 2 && op.pedidos[0].id === "NDZ-1022-CD34" && op.suscripciones.length === 1, "con la clave trae los pedidos (el más nuevo primero) y las suscripciones");
ok(op.bonos.entregados === 2 && op.bonos.usados === 1, "y el conteo de bonos entregados y usados");

ok(post({ accion: "pedido", clave: "mala", id: "NDZ-1022-AB12", estado: "pagado" }).ok === false, "cambiar un pedido pide la clave");
ok(post({ accion: "pedido", clave: props.CLAVE, id: "NDZ-1022-AB12", estado: "volando" }).ok === false, "un estado inventado se rechaza");
post({ accion: "pedido", clave: props.CLAVE, id: "NDZ-1022-AB12", estado: "pagado" });
ok(ss.hojas["Pedidos"].filas[1][2] === "pagado" && ss.hojas["Pedidos"].filas[1][14] instanceof Date, "marcarlo pagado guarda la fecha");
const desp = post({ accion: "pedido", clave: props.CLAVE, id: "NDZ-1022-AB12", estado: "despachado", transportadora: "Interrapidísimo", guia: "700123" });
ok(desp.avisado && ultimo().to === "ana@correo.com" && ultimo().body.includes("700123"), "al despacharlo con guía, el cliente recibe la guía");
ok(post({ accion: "pedido", clave: props.CLAVE, id: "NDZ-1022-CD34", estado: "despachado", guia: "1" }).avisado === false, "sin correo del cliente, no se intenta avisar");

/* ---- suscripciones ---- */
const sub = ss.hojas["Suscripciones"].filas[1];
ok(sub[0] === "luis@correo.com" && sub[2] === "sí" && sub[4] === 2 && sub[8] === "espera", "la suscripción llega en espera, con kit y cada dos meses");
ok(post({ accion: "suscripcion", clave: props.CLAVE, fila: 1, estado: "activa" }).ok === false, "no deja tocar el encabezado");
post({ accion: "suscripcion", clave: props.CLAVE, fila: 2, estado: "activa", proximo: "2026-01-31" });
ok(sub && ss.hojas["Suscripciones"].filas[1][8] === "activa", "el panel la activa con la fecha del primer envío");
const env = post({ accion: "sub-envio", clave: props.CLAVE, fila: 2, transportadora: "Interrapidísimo", guia: "800999" });
const s2 = ss.hojas["Suscripciones"].filas[1];
ok(env.ok && s2[11] === 1 && s2[9].getMonth() === 2 && s2[9].getDate() === 31, "registrar un envío suma uno y corre la fecha dos meses (31 ene → 31 mar)");
ok(ultimo().to === "luis@correo.com" && ultimo().body.includes("800999"), "y al suscriptor le llega la guía");
ok(vm.runInContext("masMeses_(new Date(2026, 0, 31), 1).getDate()", ctx) === 28, "un mes después del 31 de enero es el 28 de febrero");

/* ---- cada mañana ---- */
ss.hojas["Bonos"].filas[2][3] = haceDias(24);        // el bono de Mike salió hace 24 días
ss.hojas["Suscripciones"].filas[1][9] = haceDias(1);  // a Luis le tocaba ayer
const nD = enviados.length;
ctx.diario();
const recordatorio = enviados.slice(nD).find((m) => m.to === "mike@mail.com"), resumen = enviados.slice(nD).find((m) => m.to === "nandezcafe@gmail.com");
ok(recordatorio && /ends in \d+ days/.test(recordatorio.subject), "a los 23 días, a quien no ha usado el bono le llega el recordatorio");
ok(resumen && resumen.body.includes("ATRASADA") && resumen.body.includes("luis@correo.com") && resumen.body.includes("NDZ-1022-AB12") === false,
  "Nandez recibe qué suscripción toca (y que está atrasada); el pedido ya despachado no aparece");
const nD2 = enviados.length;
ctx.diario();
ok(!enviados.slice(nD2).some((m) => m.to === "mike@mail.com"), "el recordatorio sale una sola vez");

cuota = 0;
const sinCupo = post({ tipo: "comunidad", correo: "sara@correo.com", consentimiento: true });
ok(sinCupo.ok && sinCupo.bienvenida === "pendiente", "sin cupo en Gmail, el bono se crea y la bienvenida queda pendiente");
cuota = 10;
ctx.diario();
ok(enviados.some((m) => m.to === "sara@correo.com" && m.subject.startsWith("Bienvenido")), "al otro día, el aviso diario la envía");

/* ---- campañas (lo de antes) ---- */
const lista = getJ({ accion: "lista", clave: props.CLAVE });
ok(getJ({ accion: "lista", clave: "mala" }).ok === false, "la lista pide la clave");
ok(lista.ok && lista.contactos.length === 5 && lista.cuota === cuota, "con la clave, la lista trae los contactos y la cuota");

ok(post({ accion: "enviar", clave: "mala", asunto: "a", mensaje: "b" }).ok === false, "enviar pide la clave");
const n2 = enviados.length;
const prueba = post({ accion: "enviar", clave: props.CLAVE, prueba: true, asunto: "Hola", mensaje: "Uno\n\nDos <b>" });
ok(prueba.ok && enviados.length === n2 + 1 && ultimo().to === "nandezcafe@gmail.com", "la prueba solo va al Gmail de Nandez");
ok(ultimo().htmlBody.includes("&lt;b&gt;") && ultimo().htmlBody.includes("accion=baja"), "el mensaje se escapa y trae enlace de baja");
const n3 = enviados.length;
const real = post({ accion: "enviar", clave: props.CLAVE, asunto: "Salió el Tibo B", mensaje: "Ya está." });
ok(real.ok && real.enviados === 3 && enviados.slice(n3).map((m) => m.to).sort().join() === "ana@correo.com,mike@mail.com,sara@correo.com",
  "la campaña solo va a quien aceptó (Ana, Mike y Sara; ni Luis ni quien no marcó la casilla)");

const enlace = enviados[n3].htmlBody.match(/href="([^"]*accion=baja[^"]*)"/)[1];
const q = Object.fromEntries(new URL(enlace.replace(/&amp;/g, "&")).searchParams);
const quien = q.correo;
ok(get({ ...q, f: "falsa" }).html.includes("no es válido"), "una baja con firma falsa no hace nada");
ok(get(q).html.includes("no te vamos a escribir"), "la baja firmada funciona");
const baja = ss.hojas["Contactos"].filas.find((f) => f[0] === quien);
ok(baja[3] === false && baja[6] instanceof Date, "tras la baja ya no acepta correos y queda la fecha");
const otra = post({ accion: "enviar", clave: props.CLAVE, asunto: "Otra", mensaje: "x" });
ok(otra.ok && otra.enviados === 2 && !enviados.slice(-2).some((m) => m.to === quien), "después de la baja, la campaña no le llega");
post({ tipo: "comunidad", correo: quien, consentimiento: true });
ok(ss.hojas["Contactos"].filas.find((f) => f[0] === quien)[3] === true, "si vuelve a unirse con la casilla, se reactiva");

cuota = 0;
const sinCuota = post({ accion: "enviar", clave: props.CLAVE, asunto: "Sin cuota", mensaje: "x" });
ok(sinCuota.ok && sinCuota.enviados === 0 && sinCuota.pendientes === 3, "sin cuota, nada se envía y queda contado para mañana");
cuota = 10;
post({ tipo: "comunidad", correo: "pao@correo.com", consentimiento: true });
const n4 = enviados.length;
const repetida = post({ accion: "enviar", clave: props.CLAVE, asunto: "Salió el Tibo B", mensaje: "Ya está." });
ok(repetida.ok && repetida.enviados === 1 && enviados[n4].to === "pao@correo.com", "reenviar la misma campaña solo les llega a quienes faltan (Pao)");

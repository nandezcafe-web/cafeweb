/* Prueba del script de correos sin Google: imita la Hoja, Gmail y las propiedades en memoria.
   Uso:  node tools/correos/prueba.js tools/correos/Codigo.gs */
const fs = require("fs"), vm = require("vm"), crypto = require("crypto");
const codigo = fs.readFileSync(process.argv[2], "utf8");

const libros = {};
function nuevaHoja(nombre) {
  const filas = [];
  return { nombre, filas,
    appendRow: (r) => filas.push(r.slice()), setFrozenRows() {}, deleteRows: (r, n) => filas.splice(r - 1, n),
    getLastColumn: () => filas.reduce((n, f) => Math.max(n, f.length), 0),
    getLastRow: () => filas.length,
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
function nuevoLibro(nombre) {
  const hojas = { "Hoja 1": nuevaHoja("Hoja 1") }, id = "L" + Object.keys(libros).length;
  const ss = { getId: () => id, getUrl: () => "https://docs.google.com/" + id, getSheetByName: (n) => hojas[n] || null,
    insertSheet: (n) => (hojas[n] = nuevaHoja(n)), getSheets: () => Object.values(hojas), deleteSheet: (h) => delete hojas[h.nombre], hojas };
  return (libros[id] = ss);
}
const props = {}, enviados = [], disparadores = [], cacheMem = {}; let cuota = 3;
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
    newTrigger: (f) => { const t = { timeBased: () => t, everyDays: () => t, everyHours: () => t, atHour: () => t, create: () => disparadores.push(f) }; return t; } },
  Logger: { log: (m) => console.log("  log:", m) },
  /* el catálogo que publica tools/build.js, leído del disco como si viniera de la página */
  CacheService: { getScriptCache: () => ({ get: (k) => cacheMem[k] || null, put: (k, v) => { cacheMem[k] = v; } }) },
  UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200,
    getContentText: () => fs.readFileSync(require("path").join(__dirname, "../../prototipo/data/catalogo.json"), "utf8") }) },
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
ok(disparadores.length === 2 && disparadores.includes("diario") && disparadores.includes("liberarReservas"),
  "configurar programa el aviso diario y la liberación de reservas una sola vez, aunque se ejecute dos veces");

/* ---- registros y bienvenida ---- */
cuota = 50;
const r1 = post({ tipo: "comunidad", correo: "Ana@Correo.com", consentimiento: true });
ok(r1.ok && r1.bienvenida === "enviada", "la comunidad se registra y responde que la bienvenida salió");
const bienv = ultimo(), codigoAna = ss.hojas["Bonos"].filas[1][0];
ok(bienv.to === "ana@correo.com" && /^GANG-[A-HJ-NP-Z2-9]{5}$/.test(codigoAna), "a Ana le llega la bienvenida y su bono tiene el formato GANG-XXXXX sin letras confusas");
ok(bienv.htmlBody.includes(codigoAna) && bienv.htmlBody.includes("/cafes?bono=" + codigoAna) && bienv.htmlBody.includes("accion=baja"), "la bienvenida trae el código, el botón que lo deja en el carrito y la baja");
ok(/\d+ de [a-z]+/.test(bienv.body), "la fecha de vencimiento va en español");
ok(bienv.htmlBody.includes("/img/correo/logo.png") && bienv.htmlBody.includes("Castillo") && bienv.htmlBody.includes("$36.000")
  && bienv.htmlBody.includes("?bono=" + codigoAna) && bienv.htmlBody.includes("En preventa") && bienv.htmlBody.includes("Reservar") && bienv.htmlBody.includes("Instagram"),
  "la bienvenida trae el logo, la vitrina con el precio ya con el bono, los que están en preventa y las redes");
if (process.env.GUARDAR) fs.writeFileSync(process.env.GUARDAR, bienv.htmlBody);
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
const rp = post({ tipo: "pedido", id: "NDZ-1022-AB12", correo: "ana@correo.com", nombre: "Ana Ruiz", ciudad: "Cúcuta", tel: "3001234567", canal: "correo",
  documento: "1090123456", direccion: "Calle 10 # 5-23", detalle: "Barrio La Playa", departamento: "Norte de Santander", iva: 4286,
  items: [{ id: "P-CAS", g: 250, n: 2, nombre: "Castillo 250 g", forma: "Grano", stock: 90 }], subtotal: 100000, descuento: 10000, envio: 12000, total: 102000, bono: codigoAna });
ok(rp.ok && rp.pedido === "NDZ-1022-AB12", "el pedido se guarda y devuelve su número");
const fp = ss.hojas["Pedidos"].filas[1];
ok(fp[2] === "nuevo" && fp[7] === "2 × Castillo 250 g (grano)" && fp[11] === 102000 && fp[12] === codigoAna && !fp[18], "la fila del pedido trae estado, productos, total y bono");
ok(fp[19] === "1090123456" && fp[20] === "Calle 10 # 5-23" && fp[21] === "Barrio La Playa" && fp[22] === "Norte de Santander",
  "y los datos del envío: documento, dirección, detalle y departamento");
ok(fp[24] === 4286 && /Incluye \$ ?4\.286 de IVA/.test(enviados[nP + 1].body), "el IVA incluido queda en la fila del pedido y en la constancia del cliente");
ok(getJ({ accion: "bono", codigo: codigoAna }).error === "usado", "después del pedido, el bono queda usado");

ok(enviados.length === nP + 2 && enviados[nP].to === "nandezcafe@gmail.com" && enviados[nP + 1].to === "ana@correo.com", "llega aviso a Nandez y constancia al cliente");
ok(/CC\/NIT 1090123456/.test(enviados[nP].body) && /Calle 10 # 5-23\nBarrio La Playa\nCúcuta, Norte de Santander/.test(enviados[nP].body),
  "el aviso a Nandez trae la dirección lista para la guía");
ok(/Calle 10 # 5-23/.test(enviados[nP + 1].body) && /mal escrito/.test(enviados[nP + 1].body),
  "al cliente le vuelve la dirección, por si quedó mal escrita");
post({ tipo: "pedido", id: "NDZ-1022-CD34", nombre: "Pepe", ciudad: "Pamplona", items: [{ id: "P-CAS", g: 500, n: 1, nombre: "Castillo 500 g", stock: 4 }], subtotal: 60000, descuento: 6000, envio: 12000, total: 66000, bono: codigoAna });
ok(/no sirve \(usado\)/.test(ss.hojas["Pedidos"].filas[2][18]), "un bono ya usado queda marcado en las notas del pedido para revisarlo");

/* una hoja creada antes de que existieran estos datos recupera sus títulos sola */
ss.hojas["Pedidos"].filas[0] = ss.hojas["Pedidos"].filas[0].slice(0, 19);
ok(getJ({ accion: "operacion", clave: "mala" }).ok === false, "la operación pide la clave");
const op = getJ({ accion: "operacion", clave: props.CLAVE });
ok(op.ok && op.pedidos.length === 2 && op.pedidos[0].id === "NDZ-1022-CD34" && op.suscripciones.length === 1, "con la clave trae los pedidos (el más nuevo primero) y las suscripciones");
ok(op.bonos.entregados === 2 && op.bonos.usados === 1, "y el conteo de bonos entregados y usados");
ok(ss.hojas["Pedidos"].filas[0][19] === "documento" && ss.hojas["Pedidos"].filas[0][22] === "departamento",
  "una hoja vieja recupera los títulos de las columnas nuevas sin tocar las filas");
ok(op.pedidos[1].direccion === "Calle 10 # 5-23" && op.pedidos[1].departamento === "Norte de Santander",
  "y el panel recibe la dirección de cada pedido");

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
const constancia = enviados.find((m) => m.to === "luis@correo.com");
ok(constancia && constancia.subject === "Quedaste en la lista de la suscripción Cosecha" && constancia.body.includes("Hoy no se cobra nada") && !constancia.body.includes("accion=baja"),
  "al suscribirse le llega la constancia, sin enlace de publicidad: es un correo del servicio que pidió");
ok(post({ accion: "suscripcion", clave: props.CLAVE, fila: 1, estado: "activa" }).ok === false, "no deja tocar el encabezado");
const act = post({ accion: "suscripcion", clave: props.CLAVE, fila: 2, estado: "activa", proximo: "2026-01-31" });
ok(act.avisado && ultimo().to === "luis@correo.com" && ultimo().subject === "Tu suscripción Cosecha está activa" && ultimo().body.includes("primera caja sale el 31 de enero"),
  "al activarla, el suscriptor recibe la fecha de su primera caja");
const nAct = enviados.length;
post({ accion: "suscripcion", clave: props.CLAVE, fila: 2, estado: "activa", proximo: "2026-01-31" });
ok(enviados.length === nAct, "volver a guardarla activa no repite el correo");
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

const enDias = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
ok(!enviados.slice(nD).some((m) => m.to === "luis@correo.com"), "a una caja atrasada no se le manda el aviso al suscriptor (eso lo ve Nandez)");
ss.hojas["Suscripciones"].filas[1][9] = enDias(2);   // la próxima caja de Luis sale en dos días
const nC = enviados.length;
ctx.diario();
const caja = enviados.slice(nC).find((m) => m.to === "luis@correo.com");
ok(caja && caja.subject.startsWith("Tu caja Cosecha sale el") && caja.body.includes("todavía no has pagado") && caja.body.includes("molienda grano"),
  "tres días antes, al suscriptor mes a mes le llega el aviso de su caja con el recordatorio del pago");
const nC2 = enviados.length;
ctx.diario();
ok(!enviados.slice(nC2).some((m) => m.to === "luis@correo.com"), "el aviso de la caja sale una sola vez por fecha");
const fs6 = ss.hojas["Suscripciones"].filas[1];
fs6[3] = "6 envíos"; fs6[11] = 5; fs6[9] = enDias(1); fs6[14] = "";
ctx.diario();
const ultimaCaja = enviados.filter((m) => m.to === "luis@correo.com").pop();
ok(ultimaCaja.body.includes("última de tus 6 cajas") && !ultimaCaja.body.includes("no has pagado"), "con 6 cajas pagadas, la sexta avisa que se acaba y no cobra");

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

/* ---- la gang ---- */
cuota = 10;
const gang = post({ tipo: "gang", correo: "lu@correo.com", consentimiento: true });
ok(gang.bienvenida === "enviada" && ultimo().to === "lu@correo.com" && ultimo().htmlBody.includes("GANG-"), "quien entra por /la-gang recibe la misma bienvenida con su bono");
ok(post({ tipo: "gang", correo: "lu2@correo.com" }).bienvenida === undefined, "por /la-gang, sin la casilla tampoco hay bono");

/* ---- stock compartido ----
   Va al final a propósito: estos pedidos mueven los conteos de arriba. */
cuota = 20;
ok(getJ({ accion: "stock" }).stock["P-CAS-250"] === 88 && getJ({ accion: "stock" }).stock["P-CAS-500"] === 3,
  "los pedidos de arriba ya crearon las filas del stock y descontaron (90 − 2 y 4 − 1)");
post({ tipo: "pedido", id: "NDZ-1022-ST01", nombre: "Stock", ciudad: "Cúcuta",
  items: [{ id: "P-CAS", g: 250, n: 3, nombre: "Castillo 250 g", stock: 90 }], total: 120000 });
ok(getJ({ accion: "stock" }).stock["P-CAS-250"] === 85, "un pedido nuevo parte de la hoja, no de lo que diga el navegador");
post({ tipo: "pedido", id: "NDZ-1022-ST02", nombre: "Ambicioso", ciudad: "Cúcuta",
  items: [{ id: "P-CAS", g: 250, n: 200, nombre: "Castillo 250 g", stock: 90 }], total: 8000000 });
const fAmb = ss.hojas["Pedidos"].filas.find((f) => f[0] === "NDZ-1022-ST02");
ok(getJ({ accion: "stock" }).stock["P-CAS-250"] === 0 && /Sin stock — Castillo 250 g: pidió 200 y había 85/.test(fAmb[18]),
  "pedir más de lo que hay deja la hoja en cero y lo anota en el pedido");
post({ accion: "pedido", clave: props.CLAVE, id: "NDZ-1022-ST01", estado: "cancelado" });
ok(getJ({ accion: "stock" }).stock["P-CAS-250"] === 3, "cancelar un pedido devuelve sus bolsas");
post({ accion: "pedido", clave: props.CLAVE, id: "NDZ-1022-ST01", estado: "cancelado" });
ok(getJ({ accion: "stock" }).stock["P-CAS-250"] === 3, "cancelarlo dos veces no las devuelve dos veces");

/* ---- la bitácora de la página, los carritos y el recordatorio ---- */
cuota = 50;
const V1 = "aaaa1111bbbb", V2 = "cccc2222dddd", V3 = "eeee3333ffff";
const bolsa = (n) => [{ id: "P-CAS", g: 250, n, nombre: "Castillo 250 g", precio: 36000 }];
ok(getJ({ accion: "stock" }).actividad === true, "el stock le avisa a la página que el script ya recibe la bitácora");
const regAntes = ss.hojas["Registros"].filas.length, conAntes = ss.hojas["Contactos"].filas.length;
post({ tipo: "evento", v: V1, evento: "visita" }); post({ tipo: "evento", v: V1, evento: "ver", detalle: "Castillo", valor: 36000 });
post({ tipo: "evento", v: V1, evento: "ver", detalle: "Castillo", valor: 36000 }); post({ tipo: "evento", v: V1, evento: "agregar", detalle: "Castillo", valor: 36000 });
post({ tipo: "evento", v: V2, evento: "visita" }); post({ tipo: "evento", v: V2, evento: "ver", detalle: "Blend" }); post({ tipo: "evento", v: V3, evento: "visita" });
ok(post({ tipo: "evento", v: "x", evento: "visita" }).ok === false && post({ tipo: "evento", v: V1, evento: "inventado" }).ok === false,
  "un evento sin visitante o con un nombre inventado se rechaza");
ok(ss.hojas["Registros"].filas.length === regAntes && ss.hojas["Contactos"].filas.length === conAntes && ss.hojas["Actividad"].filas.length === 8,
  "la bitácora va a su propia hoja: no ensucia Registros ni Contactos");
post({ tipo: "comunidad", correo: "caro@correo.com", consentimiento: true });
post({ tipo: "carrito", v: V1, correo: "Caro@Correo.com", items: bolsa(2) });
post({ tipo: "carrito", v: V2, items: bolsa(1) });
post({ tipo: "carrito", v: V3, correo: "sin-casilla@correo.com", items: bolsa(1) });
post({ tipo: "carrito", v: "zzzz9999yyyy", items: [] });
ok(ss.hojas["Carritos"].filas.length === 4, "cada visitante tiene una fila de carrito, y uno vacío no crea fila");
ok(getJ({ accion: "actividad", clave: "mala" }).ok === false, "la actividad pide la clave");
let acti = getJ({ accion: "actividad", clave: props.CLAVE });
ok(acti.ok && acti.embudo.visita === 3 && acti.embudo.ver === 2 && acti.embudo.agregar === 1 && acti.embudo.compra === 0,
  "el embudo cuenta personas distintas, no clics (Caro vio dos veces y cuenta una)");
ok(acti.productos[0].nombre === "Castillo" && acti.productos[0].ver === 2 && acti.productos[0].agregar === 1 && acti.porDia.length === 14 && acti.porDia[13].visita === 3,
  "trae lo más visto y la serie de los últimos 14 días");
ok(acti.carritos.length === 0 && acti.anonimos.n === 0, "un carrito recién armado todavía no es un carrito abandonado");
ss.hojas["Carritos"].filas.slice(1).forEach((f) => { f[6] = new Date(Date.now() - 3 * 36e5); });
acti = getJ({ accion: "actividad", clave: props.CLAVE });
const cCaro = acti.carritos.find((x) => x.correo === "caro@correo.com"), cSin = acti.carritos.find((x) => x.correo === "sin-casilla@correo.com");
ok(acti.carritos.length === 2 && cCaro.total === 72000 && cCaro.acepta === true && cSin.acepta === false && acti.anonimos.n === 1 && acti.anonimos.total === 36000,
  "pasada la hora quieta aparecen: con correo en la lista (y si acepta correos), sin correo solo contados");
ok(acti.registros.some((x) => x.correo === "caro@correo.com") && acti.nuevos.total === ss.hojas["Contactos"].filas.length - 1, "trae los registros recientes");
ok(post({ accion: "recordar", clave: "mala", carrito: V1 }).ok === false, "recordar pide la clave");
ok(post({ accion: "recordar", clave: props.CLAVE, carrito: V3 }).error === "no-acepta", "a quien no marcó la casilla no se le manda el recordatorio del carrito");
ok(post({ accion: "recordar", clave: props.CLAVE, carrito: V2 }).error === "sin-correo", "un carrito sin correo no se puede recordar");
const nRec = enviados.length, recC = post({ accion: "recordar", clave: props.CLAVE, carrito: V1 });
ok(recC.ok && enviados.length === nRec + 1 && ultimo().to === "caro@correo.com" && ultimo().subject === "Tu café sigue en el carrito"
  && ultimo().htmlBody.includes("2 × Castillo 250 g") && /cafes\?bono=GANG-/.test(ultimo().htmlBody) && ultimo().htmlBody.includes("accion=baja"),
  "a Caro le llega su carrito, su bono sin usar ya puesto en el botón y el enlace de baja");
ok(post({ accion: "recordar", clave: props.CLAVE, carrito: V1 }).error === "ya" && enviados.length === nRec + 1, "el recordatorio sale una sola vez por carrito");
post({ tipo: "carrito", v: V1, items: [], comprado: true });
ok(!getJ({ accion: "actividad", clave: props.CLAVE }).carritos.some((x) => x.v === V1), "el carrito que se compró deja de estar abandonado");
post({ tipo: "carrito", v: V1, items: bolsa(1) });
const fV1 = ss.hojas["Carritos"].filas.find((f) => f[0] === V1);
ok(fV1[7] === "abierto" && fV1[8] === "" && fV1[1] === "caro@correo.com", "si vuelve a armar otro, es un carrito nuevo: conserva el correo y se puede recordar otra vez");

post({ tipo: "pedido", id: "NDZ-1110-RS01", canal: "wompi", nombre: "Rosa Reserva", correo: "rosa@correo.com", tel: "3001112233", ciudad: "Cúcuta",
  items: [{ id: "P-CAS", g: 250, n: 1, nombre: "Castillo 250 g", stock: 90 }], total: 48000 });
ss.hojas["Pedidos"].filas.find((f) => f[0] === "NDZ-1110-RS01")[1] = new Date(Date.now() - 3 * 36e5);
ctx.liberarReservas();
acti = getJ({ accion: "actividad", clave: props.CLAVE });
ok(acti.sinPagar.length === 1 && acti.sinPagar[0].id === "NDZ-1110-RS01" && acti.sinPagar[0].tel === "3001112233" && acti.sinPagar[0].recordado === false,
  "la reserva que nadie pagó aparece como «llegó a pagar y no pagó», con su teléfono");
const nPed = enviados.length, recP = post({ accion: "recordar", clave: props.CLAVE, pedido: "NDZ-1110-RS01" });
ok(recP.ok && enviados.length === nPed + 1 && ultimo().to === "rosa@correo.com" && ultimo().subject.startsWith("Tu pedido quedó sin pagar") && ultimo().body.includes("1 × Castillo 250 g"),
  "a Rosa le llega el aviso de su pedido sin pagar");
ok(post({ accion: "recordar", clave: props.CLAVE, pedido: "NDZ-1110-RS01" }).error === "ya" && getJ({ accion: "actividad", clave: props.CLAVE }).sinPagar[0].recordado === true,
  "y solo una vez: queda anotado en el pedido");
ok(post({ accion: "recordar", clave: props.CLAVE, pedido: "NDZ-1022-ST02" }).error === "no-es-reserva", "un pedido que no es una reserva liberada no recibe ese aviso");
ss.hojas["Actividad"].filas.splice(1, 0, [haceDias(100), V2, "visita", "", 0, "", "/", "es"]);
const nActiv = ss.hojas["Actividad"].filas.length, nDiario = enviados.length;
ctx.diario();
ok(ss.hojas["Actividad"].filas.length === nActiv - 1 && ss.hojas["Actividad"].filas[1][1] === V1, "cada mañana se borra la bitácora de más de 90 días, y solo esa");
ok(!enviados.slice(nDiario).some((m) => m.subject === "Tu café sigue en el carrito"), "sin CARRITO.auto, el aviso diario no le escribe a nadie por su carrito");

/* ---- el stock desde el panel ---- */
ok(getJ({ accion: "existencias", clave: "mala" }).ok === false && post({ accion: "stock", clave: "mala", id: "P-CAS-250", stock: 9 }).ok === false,
  "ver la hoja de stock y corregirla piden la clave");
const exi = getJ({ accion: "existencias", clave: props.CLAVE });
ok(exi.ok && exi.existencias.some((x) => x.id === "P-CAS-250" && typeof x.stock === "number" && x.actualizado), "el panel recibe cada presentación con lo que queda y su último cambio");
ok(post({ accion: "stock", clave: props.CLAVE, id: "P-CAS-250", stock: 40 }).ok && getJ({ accion: "stock" }).stock["P-CAS-250"] === 40,
  "corregir el stock en el panel cambia la cifra que lee la tienda");
ok(post({ accion: "stock", clave: props.CLAVE, id: "P-NUE-250", stock: 12, nombre: "Nuevo 250 g" }).ok && getJ({ accion: "stock" }).stock["P-NUE-250"] === 12,
  "una presentación que aún no tenía fila la estrena");
ok(post({ accion: "stock", clave: props.CLAVE, id: "P-CAS-250", stock: -3 }).ok === false && post({ accion: "stock", clave: props.CLAVE, id: "x y", stock: 3 }).ok === false
  && getJ({ accion: "stock" }).stock["P-CAS-250"] === 40, "un número negativo o un id raro se rechazan sin tocar nada");

/* ---- por qué puerta entró cada quien ---- */
post({ tipo: "comunidad", correo: "pop1@correo.com", consentimiento: true, origen: "pop" });
post({ tipo: "comunidad", correo: "pop2@correo.com", consentimiento: true, origen: "pop" });
post({ tipo: "comunidad", correo: "pop1@correo.com", consentimiento: true, origen: "pop" });
post({ tipo: "comunidad", correo: "pie1@correo.com", consentimiento: true, origen: "pie" });
post({ tipo: "comunidad", correo: "pop3@correo.com", origen: "pop" });
const ins = getJ({ accion: "actividad", clave: props.CLAVE }).inscritos;
ok(ins.pop.total === 2 && ins.pop.d7 === 2 && ins.pie.total === 1 && ins.gang.total >= 1 && ins.sin.total >= 3,
  "cuenta inscritos por puerta: pop-up, pie y gang, sin repetir correos ni contar a quien no marcó la casilla; los de antes quedan sin origen");

/* ---- borrar las pruebas y dejar solo lo real ---- */
cuota = 50;
post({ tipo: "evento", v: "limpio11112222", evento: "visita" });
post({ tipo: "carrito", v: "limpio11112222", items: bolsa(1) });
const antesAct = ss.hojas["Actividad"].filas.length, antesCar = ss.hojas["Carritos"].filas.length;
const antesPed = ss.hojas["Pedidos"].filas.length, antesCon = ss.hojas["Contactos"].filas.length, antesBon = ss.hojas["Bonos"].filas.length;
ok(antesAct > 1 && antesCar > 1, "antes de limpiar hay actividad y carritos anotados");
ok(post({ accion: "limpiar", clave: "mala" }).ok === false, "limpiar pide la clave");
const limpio = post({ accion: "limpiar", clave: props.CLAVE });
ok(limpio.ok && limpio.borradas === (antesAct - 1) + (antesCar - 1), "limpiar dice cuántas filas borró");
ok(ss.hojas["Actividad"].filas.length === 1 && ss.hojas["Carritos"].filas.length === 1,
  "la bitácora y los carritos quedan vacíos, con sus títulos");
ok(ss.hojas["Pedidos"].filas.length === antesPed && ss.hojas["Contactos"].filas.length === antesCon && ss.hojas["Bonos"].filas.length === antesBon,
  "los pedidos, los contactos y los bonos no se tocan");
const tras = getJ({ accion: "actividad", clave: props.CLAVE });
ok(tras.ok && tras.embudo.visita === 0 && tras.carritos.length === 0 && tras.registros.length > 0,
  "el panel queda en cero, pero los registros de correo siguen ahí");
ok(post({ accion: "limpiar", clave: props.CLAVE }).borradas === 0, "limpiar dos veces seguidas no falla");
post({ tipo: "evento", v: "despues11112222", evento: "visita" });
ok(getJ({ accion: "actividad", clave: props.CLAVE }).embudo.visita === 1, "después de limpiar se sigue anotando lo nuevo");

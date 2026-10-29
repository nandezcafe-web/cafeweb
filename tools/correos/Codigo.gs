/* ============================================================
   NANDEZ COFFEE · registros, correos y operación
   Google Apps Script, gratis, en la cuenta de Google de Nandez.
   - Guarda en una Hoja de Google cada correo que llega de la página
     (comunidad, listas de espera, suscripción, cotizaciones, pedidos).
   - A quien se une a la comunidad le llega solo un correo de bienvenida
     con un bono personal para su primera compra.
   - Lleva los pedidos (nuevo → pagado → despachado → entregado) y las
     suscripciones (cuándo toca el próximo envío).
   - Cada mañana le escribe a Nandez qué hay que despachar, y recuerda
     el bono a quien no lo ha usado.
   - Envía las campañas de remarketing desde Gmail, con enlace de baja.

   Puesta en marcha (una sola vez): docs/12_correos_y_remarketing.md
   1. script.google.com → Proyecto nuevo → pegar este archivo.
   2. Ejecutar la función "configurar" y aceptar los permisos.
      En el registro de ejecución quedan la dirección de la hoja
      y la CLAVE del panel. También deja programado el aviso diario.
   3. Implementar → Nueva implementación → Aplicación web.
      Ejecutar como: yo. Quién tiene acceso: cualquier persona.
   4. Copiar la URL /exec y ponerla en CONFIG.registro (prototipo/js/core.js).
   ============================================================ */
const MARCA = "Nandez Coffee";
const COMUNIDAD = "Nandez Coffee Gang";
const SITIO = "https://cafeweb-five.vercel.app";   // cambiar cuando haya dominio propio
/* El bono de bienvenida: 10 % en la primera compra, un solo uso, vence a los 30 días.
   A los 23 días, si no lo ha usado, le llega un recordatorio (le quedan 7). */
const BONO = { pct: 10, dias: 30, recordarA: 23 };
/* El aviso diario a Nandez: suscripciones que tocan en los próximos días */
const AVISO_DIAS = 3;
const H_CONTACTOS = "Contactos", H_REGISTROS = "Registros", H_ENVIOS = "Envíos", H_ENTREGAS = "Entregas";
const H_BONOS = "Bonos", H_PEDIDOS = "Pedidos", H_SUBS = "Suscripciones";
const COLS = ["correo", "nombre", "etiquetas", "acepta_correos", "alta", "ultimo", "baja", "ciudad", "idioma"];
const COLS_BONOS = ["codigo", "correo", "pct", "alta", "vence", "bienvenida", "usado", "pedido", "recordado", "idioma"];
const COLS_PEDIDOS = ["id", "fecha", "estado", "nombre", "correo", "whatsapp", "ciudad", "productos", "subtotal", "descuento",
  "envio", "total", "bono", "canal", "pagado", "despachado", "transportadora", "guia", "notas"];
const COLS_SUBS = ["correo", "plan", "kit", "pago", "cada_meses", "molienda", "ciudad", "alta", "estado", "proximo", "ultimo_envio", "envios", "notas", "idioma", "avisado"];
/* Al suscriptor se le avisa este número de días antes de que salga su caja */
const SUB_AVISO = 3;
const PLAN_NOMBRE = { semilla: ["Semilla", "Seed"], cosecha: ["Cosecha", "Harvest"], barista: ["Barista", "Barista"], cafeteria: ["Cafetería", "Café"] };
const planDe_ = (id, en) => (PLAN_NOMBRE[id] || [id, id])[en ? 1 : 0];
const ESTADOS_PEDIDO = ["nuevo", "pagado", "despachado", "entregado", "cancelado"];
const ESTADOS_SUB = ["espera", "activa", "pausada", "cancelada"];

/* ---------- puesta en marcha ---------- */
function configurar() {
  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty("HOJA_ID");
  if (!id) { id = SpreadsheetApp.create(MARCA + " · contactos").getId(); p.setProperty("HOJA_ID", id); }
  const ss = SpreadsheetApp.openById(id);
  hoja_(ss, H_CONTACTOS, COLS);
  hoja_(ss, H_REGISTROS, ["fecha", "tipo", "correo", "datos", "pagina"]);
  hoja_(ss, H_ENVIOS, ["fecha", "asunto", "para", "enviados", "quedaron_para_mañana"]);
  hoja_(ss, H_ENTREGAS, ["fecha", "asunto", "correo"]);
  hoja_(ss, H_PEDIDOS, COLS_PEDIDOS);
  hoja_(ss, H_SUBS, COLS_SUBS);
  hoja_(ss, H_BONOS, COLS_BONOS);
  const primera = ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
  if (primera && ss.getSheets().length > 1) ss.deleteSheet(primera);
  if (!p.getProperty("CLAVE")) p.setProperty("CLAVE", Utilities.getUuid().replace(/-/g, ""));
  /* el aviso de cada mañana: una sola vez, aunque se ejecute configurar de nuevo */
  if (!ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "diario"))
    ScriptApp.newTrigger("diario").timeBased().everyDays(1).atHour(7).create();
  Logger.log("Hoja de contactos: " + ss.getUrl());
  Logger.log("Clave del panel (pégala en la pestaña Correos): " + p.getProperty("CLAVE"));
}
function hoja_(ss, nombre, cols) {
  let h = ss.getSheetByName(nombre);
  if (!h) { h = ss.insertSheet(nombre); h.appendRow(cols); h.setFrozenRows(1); h.getRange(1, 1, 1, cols.length).setFontWeight("bold"); }
  return h;
}
const libro_ = () => SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("HOJA_ID"));
const clave_ = () => PropertiesService.getScriptProperties().getProperty("CLAVE");
const json_ = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const corto_ = (v, n) => String(v == null ? "" : v).slice(0, n || 200);
const correoValido_ = (c) => /^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$/.test(c);
const etiquetas_ = (v) => String(v || "").split(",").map((s) => s.trim()).filter(String);
const num_ = (v) => Math.round(Number(v) || 0);
const dia_ = (v) => { const d = new Date(v); d.setHours(0, 0, 0, 0); return d; };
const masDias_ = (v, n) => { const d = dia_(v); d.setDate(d.getDate() + n); return d; };
/* un mes después del 31 de enero es el 28 de febrero, no el 3 de marzo */
const masMeses_ = (v, n) => { const d = dia_(v), dd = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(dd, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return d; };
/* a mano: formatDate de Apps Script escribe los meses en inglés */
const MESES = { es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
const fecha_ = (v, en) => { const d = new Date(v);
  return en ? MESES.en[d.getMonth()] + " " + d.getDate() : d.getDate() + " de " + MESES.es[d.getMonth()]; };
const pesos_ = (n) => "$" + String(num_(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
/* las hojas que se agregaron después: si alguien ya tenía la hoja armada, aparecen solas */
const hojaDe_ = (ss, nombre) => hoja_(ss, nombre, { [H_BONOS]: COLS_BONOS, [H_PEDIDOS]: COLS_PEDIDOS, [H_SUBS]: COLS_SUBS }[nombre]);

/* ---------- lo que llega de la página ----------
   La página manda texto plano (sin preflight de CORS). Nunca se activa
   "acepta_correos" sin la casilla de la comunidad: la Ley 1581 pide
   autorización previa y expresa para enviar publicidad. */
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "json" }); }
  if (d.accion === "enviar") return enviar_(d);
  if (d.accion === "pedido") return cambiarPedido_(d);
  if (d.accion === "suscripcion") return cambiarSub_(d);
  if (d.accion === "sub-envio") return envioSub_(d);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = libro_(), correo = corto_(d.correo || d.mail, 254).trim().toLowerCase(), tipo = corto_(d.tipo, 40);
    ss.getSheetByName(H_REGISTROS).appendRow([new Date(), tipo, correo, corto_(JSON.stringify(d), 4000), corto_(d.pagina, 300)]);
    const valido = correoValido_(correo), idioma = corto_(d.idioma, 5);
    if (valido) {
      const etiqueta = tipo === "espera" && d.producto ? "espera: " + corto_(d.producto, 60)
        : tipo === "suscripcion" && d.plan ? "suscripción: " + corto_(d.plan, 30) : tipo;
      guardar_(ss, correo, { nombre: corto_(d.nombre, 120), etiqueta: etiqueta, acepta: d.consentimiento === true,
        ciudad: corto_(d.ciudad, 80), idioma: idioma });
    }
    if (tipo === "pedido") return json_({ ok: true, pedido: pedido_(ss, d, valido ? correo : "") });
    if (tipo === "suscripcion" && valido) nuevaSub_(ss, correo, d);
    /* la bienvenida sale una sola vez por correo, y solo con la casilla marcada.
       Entrar por /la-gang es el mismo registro que el pie y el pop-up. */
    if ((tipo === "comunidad" || tipo === "gang") && valido && d.consentimiento === true) return json_({ ok: true, bienvenida: bienvenida_(ss, correo, idioma) });
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}

function guardar_(ss, correo, x) {
  const h = ss.getSheetByName(H_CONTACTOS), filas = h.getDataRange().getValues(), ahora = new Date();
  for (let i = 1; i < filas.length; i++) {
    if (String(filas[i][0]).toLowerCase() !== correo) continue;
    const r = i + 1, tags = etiquetas_(filas[i][2]);
    if (x.etiqueta && tags.indexOf(x.etiqueta) < 0) tags.push(x.etiqueta);
    h.getRange(r, 3).setValue(tags.join(", "));
    if (x.acepta) { h.getRange(r, 4).setValue(true); h.getRange(r, 7).setValue(""); }
    if (x.nombre) h.getRange(r, 2).setValue(x.nombre);
    if (x.ciudad) h.getRange(r, 8).setValue(x.ciudad);
    h.getRange(r, 6).setValue(ahora);
    return;
  }
  h.appendRow([correo, x.nombre, x.etiqueta, x.acepta, ahora, ahora, "", x.ciudad, x.idioma]);
}
/* ¿Se le puede escribir publicidad? Aceptó y no se ha dado de baja */
function aceptaCorreos_(ss, correo) {
  const f = ss.getSheetByName(H_CONTACTOS).getDataRange().getValues().find((x) => String(x[0]).toLowerCase() === correo);
  return !!(f && f[3] === true && !f[6]);
}

/* ---------- el bono de bienvenida ---------- */
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sin O/0 ni I/1, que se confunden al copiar
function nuevoCodigo_(filas) {
  const usados = {};
  filas.forEach((f) => { usados[String(f[0])] = true; });
  for (;;) {
    let c = "GANG-";
    for (let i = 0; i < 5; i++) c += LETRAS.charAt(Math.floor(Math.random() * LETRAS.length));
    if (!usados[c]) return c;
  }
}
/* Crea el bono (si esa persona no tiene uno) y le manda la bienvenida.
   Si Gmail no tiene cupo hoy, el bono queda creado y el aviso diario la reintenta. */
function bienvenida_(ss, correo, idioma) {
  const h = hojaDe_(ss, H_BONOS), filas = h.getDataRange().getValues();
  if (filas.slice(1).some((f) => String(f[1]) === correo)) return "ya";
  const alta = new Date(), codigo = nuevoCodigo_(filas);
  h.appendRow([codigo, correo, BONO.pct, alta, masDias_(alta, BONO.dias), "", "", "", "", idioma || "es"]);
  return mandarBienvenida_(h, filas.length + 1) ? "enviada" : "pendiente";
}
function mandarBienvenida_(h, fila) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;
  const f = h.getDataRange().getValues()[fila - 1], en = f[9] === "en";
  const codigo = String(f[0]), correo = String(f[1]), vence = fecha_(f[4], en);
  const enlace = SITIO + (en ? "/en/coffees" : "/cafes") + "?bono=" + codigo;
  const texto = en
    ? "You are now part of " + COMUNIDAD + ".\n\nWe buy coffee from farms in Norte de Santander —Chinácota, Toledo and Ragonvalia— and roast it so it reaches you with the farm's name and what we paid the grower.\n\nFor your first order, " + f[2] + " % off with this code:"
    : "Ya eres parte de " + COMUNIDAD + ".\n\nLe compramos café a fincas de Norte de Santander —Chinácota, Toledo y Ragonvalia— y lo tostamos para que te llegue con el nombre de la finca y lo que le pagamos al productor.\n\nPara tu primer pedido, " + f[2] + " % menos con este código:";
  const despues = en
    ? "It is valid until " + vence + ", for one order. The button already puts it in your cart.\n\nNot sure which coffee to start with? Reply to this email and tell us how you brew it. A person reads it."
    : "Vale hasta el " + vence + ", para un pedido. El botón ya lo deja puesto en tu carrito.\n\n¿No sabes con cuál café empezar? Responde este correo y cuéntanos cómo lo preparas. Lo lee una persona.";
  const html = cuerpo_(texto) + codigoHtml_(codigo) + boton_(enlace, en ? "Choose my coffee" : "Escoger mi café") + cuerpo_(despues);
  MailApp.sendEmail({ to: correo, name: MARCA, subject: en ? "Welcome to the Gang: " + f[2] + " % off your first coffee" : "Bienvenido a la Gang: " + f[2] + " % en tu primer café",
    htmlBody: marco_(html, pieComunidad_(correo, en)),
    body: texto + "\n\n" + codigo + "\n\n" + despues + "\n\n" + enlace + "\n\n—\n" + MARCA + "\n" + (en ? "Unsubscribe: " : "Para no recibir más correos: ") + enlaceBaja_(correo) });
  h.getRange(fila, 6).setValue(new Date());
  return true;
}
/* Busca un bono que se pueda usar hoy. No dice de quién es: solo si sirve. */
function bonoVigente_(ss, codigo) {
  const c = corto_(codigo, 20).trim().toUpperCase(), filas = hojaDe_(ss, H_BONOS).getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) {
    if (String(filas[i][0]) !== c) continue;
    if (filas[i][6]) return { error: "usado" };
    if (dia_(new Date()) > dia_(filas[i][4])) return { error: "vencido" };
    return { fila: i + 1, codigo: c, pct: Number(filas[i][2]) || BONO.pct, vence: filas[i][4] };
  }
  return { error: "no" };
}

/* ---------- pedidos ---------- */
function pedido_(ss, d, correo) {
  const h = hojaDe_(ss, H_PEDIDOS), id = corto_(d.id, 40) || "NDZ-" + Utilities.getUuid().slice(0, 8).toUpperCase();
  const items = Array.isArray(d.items) ? d.items : [];
  const productos = items.map((i) => num_(i.n) + " × " + corto_(i.nombre, 80) + (i.forma ? " (" + corto_(i.forma, 30).toLowerCase() + ")" : "")).join("\n");
  let notas = "", bono = "";
  if (d.bono) {
    const b = bonoVigente_(ss, d.bono);
    if (b.fila) { bono = b.codigo; const hb = ss.getSheetByName(H_BONOS); hb.getRange(b.fila, 7).setValue(new Date()); hb.getRange(b.fila, 8).setValue(id); }
    else { bono = corto_(d.bono, 20); notas = "Ojo: el bono " + bono + " no sirve (" + b.error + "); se cobró con descuento."; }
  }
  h.appendRow([id, new Date(), "nuevo", corto_(d.nombre, 120), correo, corto_(d.tel, 40), corto_(d.ciudad, 80), productos,
    num_(d.subtotal), num_(d.descuento), num_(d.envio), num_(d.total), bono, corto_(d.canal, 20), "", "", "", "", notas]);
  const en = d.idioma === "en", lineas = productos + "\n\nTotal: " + pesos_(d.total) + (num_(d.descuento) ? " (" + (en ? "with " : "con ") + bono + ")" : "");
  /* a Nandez, enseguida; al cliente, la constancia de que llegó */
  if (MailApp.getRemainingDailyQuota() > 0)
    MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), name: MARCA, subject: "Pedido nuevo " + id + " · " + pesos_(d.total),
      body: corto_(d.nombre, 120) + " · " + corto_(d.ciudad, 80) + (d.tel ? " · WhatsApp " + corto_(d.tel, 40) : "") + (correo ? " · " + correo : "") +
        "\n\n" + lineas + (notas ? "\n\n" + notas : "") + "\n\nConfírmalo y márcalo como pagado en el panel, pestaña Pedidos." });
  if (correo && MailApp.getRemainingDailyQuota() > 0) {
    const texto = en
      ? "We got your order " + id + ".\n\n" + lineas + "\n\nWe will write to you shortly with how to pay. Once it is paid, we ship it and send you the tracking number."
      : "Recibimos tu pedido " + id + ".\n\n" + lineas + "\n\nEn un rato te escribimos con cómo pagar. Apenas esté pago lo despachamos y te mandamos la guía.";
    MailApp.sendEmail({ to: correo, name: MARCA, subject: (en ? "We got your order " : "Recibimos tu pedido ") + id,
      htmlBody: marco_(cuerpo_(texto), pieServicio_(id, en)), body: texto + "\n\n—\n" + MARCA });
  }
  return id;
}
/* El panel mueve el pedido de estado. Al despacharlo con guía, el cliente recibe la guía. */
function cambiarPedido_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  if (ESTADOS_PEDIDO.indexOf(d.estado) < 0) return json_({ ok: false, error: "estado" });
  const ss = libro_(), h = hojaDe_(ss, H_PEDIDOS), filas = h.getDataRange().getValues();
  const i = filas.findIndex((f, k) => k > 0 && String(f[0]) === String(d.id));
  if (i < 0) return json_({ ok: false, error: "no" });
  const r = i + 1, f = filas[i];
  h.getRange(r, 3).setValue(d.estado);
  if (d.estado === "pagado" && !f[14]) h.getRange(r, 15).setValue(new Date());
  if (d.notas != null) h.getRange(r, 19).setValue(corto_(d.notas, 500));
  let avisado = false;
  if (d.estado === "despachado") {
    h.getRange(r, 16).setValue(new Date());
    h.getRange(r, 17).setValue(corto_(d.transportadora, 40));
    h.getRange(r, 18).setValue(corto_(d.guia, 60));
    if (f[4] && d.guia) avisado = avisoGuia_(String(f[4]), String(f[0]), corto_(d.transportadora, 40), corto_(d.guia, 60), false);
  }
  return json_({ ok: true, avisado: avisado });
}
function avisoGuia_(correo, ref, transportadora, guia, en) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;
  const texto = en
    ? "Your coffee is on its way.\n\nCarrier: " + transportadora + "\nTracking number: " + guia + "\n\nIt usually takes 2 to 5 business days. If something looks off, reply to this email."
    : "Tu café ya va en camino.\n\nTransportadora: " + transportadora + "\nNúmero de guía: " + guia + "\n\nSuele tardar de 2 a 5 días hábiles. Si algo no cuadra, responde este correo.";
  MailApp.sendEmail({ to: correo, name: MARCA, subject: (en ? "Your coffee is on its way · " : "Tu café va en camino · ") + ref,
    htmlBody: marco_(cuerpo_(texto), pieServicio_(ref, en)), body: texto + "\n\n—\n" + MARCA });
  return true;
}

/* ---------- suscripciones ----------
   Mientras no haya cobro automático, la suscripción llega como "espera":
   la persona dejó el correo. Cuando paga, el panel la activa con la fecha del
   primer envío; cada envío registrado corre la fecha 1 o 2 meses.
   Al suscriptor le llegan solos tres correos: la constancia al inscribirse, el
   de "ya está activa" y, SUB_AVISO días antes de cada caja, el aviso de que sale.
   Son correos del servicio que pidió: no necesitan la casilla de publicidad. */
function nuevaSub_(ss, correo, d) {
  hojaDe_(ss, H_SUBS).appendRow([correo, corto_(d.plan, 30), d.kit === true ? "sí" : "no", d.seis === true ? "6 envíos" : "mes a mes",
    Number(d.cada) === 2 ? 2 : 1, corto_(d.molienda, 30), corto_(d.ciudad, 80), new Date(), "espera", "", "", 0, "", corto_(d.idioma, 5), ""]);
  const en = d.idioma === "en", plan = planDe_(corto_(d.plan, 30), en), cada = Number(d.cada) === 2;
  correoSub_(correo, en, en ? "You are on the list for the " + plan + " subscription" : "Quedaste en la lista de la suscripción " + plan,
    en ? "We got your " + plan + " subscription: " + (cada ? "every two months" : "every month") + ", ground " + corto_(d.molienda, 30) + ".\n\nNothing is charged today. As soon as subscriptions open we send you how to pay, and the date of your first box.\n\nWant to change something? Just reply."
       : "Recibimos tu suscripción " + plan + ": " + (cada ? "cada dos meses" : "cada mes") + ", molienda " + corto_(d.molienda, 30) + ".\n\nHoy no se cobra nada. Apenas abramos la suscripción te escribimos con cómo pagar y la fecha de tu primera caja.\n\n¿Quieres cambiar algo? Responde este correo.");
}
function correoSub_(correo, en, asunto, texto) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;
  MailApp.sendEmail({ to: correo, name: MARCA, subject: asunto,
    htmlBody: marco_(cuerpo_(texto), pieServicio_(en ? "subscription" : "suscripción", en)), body: texto + "\n\n—\n" + MARCA });
  return true;
}
/* El aviso antes de cada caja. Mes a mes, recuerda el pago; con 6 por adelantado,
   en la última avisa que se acaba. */
function avisoCaja_(f) {
  const en = f[13] === "en", plan = planDe_(f[1], en), cuando = fecha_(f[9], en), molienda = f[5], n = (Number(f[11]) || 0) + 1;
  const mesAMes = f[3] !== "6 envíos", ultima = !mesAMes && n >= 6;
  const texto = en
    ? "Your " + plan + " box ships on " + cuando + ", ground " + molienda + ".\n\n" +
      (mesAMes ? "If you have not paid this month yet, reply and we send you how; it ships once it is paid.\n\n" : "") +
      (ultima ? "It is the last of your 6 boxes. Want to keep going? Reply and we send you how to renew.\n\n" : "") +
      "Want a different grind or address this time? Reply before " + cuando + "."
    : "Tu caja " + plan + " sale el " + cuando + ", molienda " + molienda + ".\n\n" +
      (mesAMes ? "Si todavía no has pagado este mes, responde y te mandamos cómo; sale apenas esté pago.\n\n" : "") +
      (ultima ? "Es la última de tus 6 cajas. ¿Quieres seguir? Responde y te mandamos cómo renovar.\n\n" : "") +
      "¿Esta vez quieres otra molienda u otra dirección? Responde antes del " + cuando + ".";
  return correoSub_(String(f[0]), en, en ? "Your " + plan + " box ships on " + cuando : "Tu caja " + plan + " sale el " + cuando, texto);
}
function cambiarSub_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  if (ESTADOS_SUB.indexOf(d.estado) < 0) return json_({ ok: false, error: "estado" });
  const h = hojaDe_(libro_(), H_SUBS), r = Number(d.fila);
  if (!(r > 1 && r <= h.getDataRange().getValues().length)) return json_({ ok: false, error: "no" });
  const antes = h.getDataRange().getValues()[r - 1];
  h.getRange(r, 9).setValue(d.estado);
  if (d.proximo) h.getRange(r, 10).setValue(dia_(d.proximo + "T12:00:00"));
  if (d.notas != null) h.getRange(r, 13).setValue(corto_(d.notas, 500));
  /* al activarla (o reanudarla) con fecha, el suscriptor sabe cuándo le llega */
  let avisado = false;
  if (d.estado === "activa" && antes[8] !== "activa" && d.proximo) {
    const en = antes[13] === "en", plan = planDe_(antes[1], en), cuando = fecha_(dia_(d.proximo + "T12:00:00"), en);
    avisado = correoSub_(String(antes[0]), en, en ? "Your " + plan + " subscription is on" : "Tu suscripción " + plan + " está activa",
      en ? "Your " + plan + " subscription is active. Your " + (antes[11] ? "next" : "first") + " box ships on " + cuando + ".\n\nWe write to you " + SUB_AVISO + " days before each box, in case you want to change the grind or the address."
         : "Tu suscripción " + plan + " está activa. Tu " + (antes[11] ? "próxima" : "primera") + " caja sale el " + cuando + ".\n\nTe escribimos " + SUB_AVISO + " días antes de cada caja, por si quieres cambiar la molienda o la dirección.");
  }
  return json_({ ok: true, avisado: avisado });
}
function envioSub_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  const h = hojaDe_(libro_(), H_SUBS), filas = h.getDataRange().getValues(), r = Number(d.fila), f = filas[r - 1];
  if (!(r > 1 && f)) return json_({ ok: false, error: "no" });
  const hoy = new Date(), base = f[9] ? f[9] : hoy, proximo = masMeses_(base, Number(f[4]) === 2 ? 2 : 1);
  h.getRange(r, 11).setValue(hoy);
  h.getRange(r, 12).setValue((Number(f[11]) || 0) + 1);
  h.getRange(r, 10).setValue(proximo);
  const avisado = d.guia ? avisoGuia_(String(f[0]), (f[13] === "en" ? "subscription " : "suscripción ") + f[1], corto_(d.transportadora, 40), corto_(d.guia, 60), f[13] === "en") : false;
  return json_({ ok: true, proximo: proximo, avisado: avisado });
}

/* ---------- lo que pide el panel, el bono y la baja ---------- */
function doGet(e) {
  const q = (e && e.parameter) || {};
  if (q.accion === "baja") return baja_(q);
  if (q.accion === "bono") {
    const b = bonoVigente_(libro_(), q.codigo);
    return json_(b.fila ? { ok: true, codigo: b.codigo, pct: b.pct, vence: b.vence } : { ok: false, error: b.error });
  }
  if (q.accion === "lista") {
    if (!q.clave || q.clave !== clave_()) return json_({ ok: false, error: "clave" });
    const ss = libro_(), filas = ss.getSheetByName(H_CONTACTOS).getDataRange().getValues();
    const contactos = filas.slice(1).filter((f) => f[0]).map((f) => ({ correo: f[0], nombre: f[1], etiquetas: etiquetas_(f[2]),
      acepta: f[3] === true, alta: f[4], ultimo: f[5], baja: f[6], ciudad: f[7], idioma: f[8] }));
    const envios = ss.getSheetByName(H_ENVIOS).getDataRange().getValues().slice(1).slice(-10).reverse()
      .map((f) => ({ fecha: f[0], asunto: f[1], para: f[2], enviados: f[3], pendientes: f[4] }));
    return json_({ ok: true, contactos: contactos, envios: envios, cuota: MailApp.getRemainingDailyQuota(), hoja: ss.getUrl() });
  }
  if (q.accion === "operacion") {
    if (!q.clave || q.clave !== clave_()) return json_({ ok: false, error: "clave" });
    const ss = libro_();
    const pedidos = hojaDe_(ss, H_PEDIDOS).getDataRange().getValues().slice(1).filter((f) => f[0]).reverse()
      .map((f) => ({ id: f[0], fecha: f[1], estado: f[2], nombre: f[3], correo: f[4], tel: f[5], ciudad: f[6], productos: f[7],
        subtotal: f[8], descuento: f[9], envio: f[10], total: f[11], bono: f[12], canal: f[13], pagado: f[14], despachado: f[15],
        transportadora: f[16], guia: f[17], notas: f[18] }));
    const subs = hojaDe_(ss, H_SUBS).getDataRange().getValues().map((f, i) => ({ fila: i + 1, correo: f[0], plan: f[1], kit: f[2], pago: f[3],
      cada: f[4], molienda: f[5], ciudad: f[6], alta: f[7], estado: f[8], proximo: f[9], ultimo: f[10], envios: f[11], notas: f[12] }))
      .slice(1).filter((s) => s.correo);
    const bonos = hojaDe_(ss, H_BONOS).getDataRange().getValues().slice(1).filter((f) => f[0]), hoy = dia_(new Date());
    return json_({ ok: true, pedidos: pedidos, suscripciones: subs, cuota: MailApp.getRemainingDailyQuota(), hoja: ss.getUrl(),
      bonos: { entregados: bonos.length, usados: bonos.filter((f) => f[6]).length,
        vigentes: bonos.filter((f) => !f[6] && dia_(f[4]) >= hoy).length, sinEnviar: bonos.filter((f) => !f[5]).length } });
  }
  return json_({ ok: true, servicio: MARCA });
}

function firma_(correo) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(correo, clave_())).slice(0, 22);
}
const enlaceBaja_ = (correo) => ScriptApp.getService().getUrl() + "?accion=baja&correo=" + encodeURIComponent(correo) + "&f=" + firma_(correo);

function baja_(q) {
  const correo = String(q.correo || "").toLowerCase();
  let msg = "Este enlace no es válido. Si quieres darte de baja, respóndenos el correo y lo hacemos nosotros.";
  if (correo && q.f === firma_(correo)) {
    const h = libro_().getSheetByName(H_CONTACTOS), filas = h.getDataRange().getValues();
    for (let i = 1; i < filas.length; i++) {
      if (String(filas[i][0]).toLowerCase() === correo) { h.getRange(i + 1, 4).setValue(false); h.getRange(i + 1, 7).setValue(new Date()); }
    }
    msg = "Listo, no te vamos a escribir más. Si fue un error, vuelve a unirte desde la página.";
  }
  return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font:17px/1.55 system-ui,sans-serif;max-width:480px;margin:15vh auto;padding:0 20px;color:#141210">' +
    '<p style="font:800 26px system-ui;color:#C9381A;margin:0 0 12px">' + MARCA + '</p><p>' + msg + '</p></div>').setTitle(MARCA);
}

/* ---------- cada mañana ----------
   Programado por "configurar". Reintenta las bienvenidas que no salieron,
   recuerda el bono a quien no lo ha usado, avisa a cada suscriptor que su caja
   sale en SUB_AVISO días y le escribe a Nandez qué toca hoy. */
function diario() {
  const ss = libro_(), hoy = dia_(new Date()), hb = hojaDe_(ss, H_BONOS), bonos = hb.getDataRange().getValues();
  for (let i = 1; i < bonos.length; i++) {
    const f = bonos[i], correo = String(f[1]);
    if (!f[0] || f[6] || dia_(f[4]) < hoy || !aceptaCorreos_(ss, correo)) continue;
    if (!f[5]) { mandarBienvenida_(hb, i + 1); continue; }
    if (f[8] || hoy < masDias_(f[3], BONO.recordarA) || MailApp.getRemainingDailyQuota() < 2) continue;
    const en = f[9] === "en", quedan = Math.round((dia_(f[4]) - hoy) / 864e5), enlace = SITIO + (en ? "/en/coffees" : "/cafes") + "?bono=" + f[0];
    const texto = en
      ? "Your " + f[2] + " % welcome code is still waiting, and it has " + quedan + " days left."
      : "Tu bono de bienvenida del " + f[2] + " % sigue esperando, y le quedan " + quedan + " días.";
    MailApp.sendEmail({ to: correo, name: MARCA, subject: en ? "Your " + f[2] + " % ends in " + quedan + " days" : "Tu " + f[2] + " % vence en " + quedan + " días",
      htmlBody: marco_(cuerpo_(texto) + codigoHtml_(String(f[0])) + boton_(enlace, en ? "Use it now" : "Usarlo ahora"), pieComunidad_(correo, en)),
      body: texto + "\n\n" + f[0] + "\n" + enlace + "\n\n—\n" + MARCA + "\n" + (en ? "Unsubscribe: " : "Para no recibir más correos: ") + enlaceBaja_(correo) });
    hb.getRange(i + 1, 9).setValue(new Date());
  }

  /* a cada suscriptor activo, SUB_AVISO días antes de su caja, una sola vez por fecha */
  const hs = hojaDe_(ss, H_SUBS), filasSub = hs.getDataRange().getValues(), aviso = masDias_(hoy, SUB_AVISO);
  for (let i = 1; i < filasSub.length; i++) {
    const f = filasSub[i];
    if (!f[0] || f[8] !== "activa" || !f[9] || dia_(f[9]) < hoy || dia_(f[9]) > aviso) continue;
    const clave = dia_(f[9]).toISOString().slice(0, 10);
    if (String(f[14] || "") === clave) continue;
    if (avisoCaja_(f)) hs.getRange(i + 1, 15).setValue(clave);
  }

  const pedidos = hojaDe_(ss, H_PEDIDOS).getDataRange().getValues().slice(1).filter((f) => f[0]);
  const porConfirmar = pedidos.filter((f) => f[2] === "nuevo"), porDespachar = pedidos.filter((f) => f[2] === "pagado");
  const limite = masDias_(hoy, AVISO_DIAS);
  const subs = hojaDe_(ss, H_SUBS).getDataRange().getValues().slice(1).filter((f) => f[0] && f[8] === "activa" && f[9] && dia_(f[9]) <= limite)
    .sort((a, b) => new Date(a[9]) - new Date(b[9]));
  const enEspera = hojaDe_(ss, H_SUBS).getDataRange().getValues().slice(1).filter((f) => f[8] === "espera").length;
  if (!porConfirmar.length && !porDespachar.length && !subs.length) return;
  const linea = (f) => "· " + f[0] + " · " + f[3] + " · " + f[6] + " · " + pesos_(f[11]) + "\n  " + String(f[7]).replace(/\n/g, "\n  ");
  const partes = [];
  if (porDespachar.length) partes.push("POR DESPACHAR (ya pagaron) · " + porDespachar.length + "\n" + porDespachar.map(linea).join("\n"));
  if (subs.length) partes.push("SUSCRIPCIONES QUE TOCAN · " + subs.length + "\n" + subs.map((f) =>
    "· " + (dia_(f[9]) < hoy ? "ATRASADA desde " : "") + fecha_(f[9]) + " · " + f[0] + " · " + f[1] + " · molienda " + f[5] + " · " + f[6]).join("\n"));
  if (porConfirmar.length) partes.push("POR CONFIRMAR EL PAGO · " + porConfirmar.length + "\n" + porConfirmar.map(linea).join("\n"));
  if (enEspera) partes.push(enEspera + " personas esperan que abra la suscripción.");
  if (MailApp.getRemainingDailyQuota() < 1) return;
  const asunto = [porDespachar.length && porDespachar.length + " por despachar", subs.length && subs.length + " suscripciones",
    porConfirmar.length && porConfirmar.length + " por confirmar"].filter(Boolean).join(" · ");
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), name: MARCA, subject: "Hoy en Nandez: " + asunto,
    body: partes.join("\n\n") + "\n\nTodo se marca en el panel interno, pestaña Pedidos.\nLa hoja: " + ss.getUrl() });
}

/* ---------- el envío de una campaña ----------
   Gmail gratis permite unos 100 destinatarios al día (Workspace, 1.500).
   Cada entrega queda anotada: si una campaña no alcanza hoy, mañana se envía
   la misma (mismo asunto) y solo les llega a quienes faltan. */
function enviar_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  const asunto = corto_(d.asunto, 150).trim(), texto = corto_(d.mensaje, 20000).trim();
  if (!asunto || !texto) return json_({ ok: false, error: "vacio" });
  const ss = libro_(), filas = ss.getSheetByName(H_CONTACTOS).getDataRange().getValues().slice(1);
  const entregas = hoja_(ss, H_ENTREGAS, ["fecha", "asunto", "correo"]), yaLaTienen = {};
  entregas.getDataRange().getValues().slice(1).forEach((f) => { if (f[1] === asunto) yaLaTienen[String(f[2])] = true; });
  const destino = d.prueba ? [Session.getEffectiveUser().getEmail()]
    : filas.filter((f) => f[0] && f[3] === true && !f[6] && !yaLaTienen[String(f[0])]
        && (!d.etiqueta || etiquetas_(f[2]).indexOf(d.etiqueta) >= 0)).map((f) => String(f[0]));
  const lote = destino.slice(0, MailApp.getRemainingDailyQuota());
  lote.forEach((c) => {
    MailApp.sendEmail({ to: c, subject: asunto, name: MARCA, htmlBody: plantilla_(texto, c),
      body: texto + "\n\n—\n" + MARCA + "\nPara no recibir más correos: " + enlaceBaja_(c) });
    if (!d.prueba) entregas.appendRow([new Date(), asunto, c]);
  });
  ss.getSheetByName(H_ENVIOS).appendRow([new Date(), asunto, d.prueba ? "(prueba)" : (d.etiqueta || "todos"), lote.length, destino.length - lote.length]);
  return json_({ ok: true, enviados: lote.length, pendientes: destino.length - lote.length, cuota: MailApp.getRemainingDailyQuota() });
}

/* ---------- la plantilla de los correos ---------- */
const esc_ = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
const cuerpo_ = (texto) => esc_(texto).split(/\n{2,}/).map((p) => '<p style="margin:0 0 16px">' + p.replace(/\n/g, "<br>") + "</p>").join("");
const codigoHtml_ = (codigo) => '<p style="margin:8px 0 20px;padding:14px;border:2px dashed #C9381A;text-align:center;font:800 26px/1 \'Courier New\',monospace;letter-spacing:0.12em;color:#141210">' + esc_(codigo) + "</p>";
const boton_ = (url, txt) => '<p style="margin:0 0 24px"><a href="' + esc_(url) + '" style="display:inline-block;background:#C9381A;color:#ffffff;text-decoration:none;font:700 16px Arial,sans-serif;padding:14px 26px">' + esc_(txt) + "</a></p>";
const pieComunidad_ = (correo, en) => (en ? "You get this email because you joined the " + COMUNIDAD + " community. " : "Recibes este correo porque te uniste a la comunidad " + COMUNIDAD + ". ") +
  '<a href="' + enlaceBaja_(correo) + '" style="color:#6B645C">' + (en ? "Unsubscribe" : "Darme de baja") + "</a>.";
const pieServicio_ = (ref, en) => (en ? "You get this email about your " : "Recibes este correo por tu ") + esc_(ref) + ". " + (en ? "Questions? Just reply." : "¿Dudas? Responde este correo.");
function marco_(html, pie) {
  return '<div style="background:#F5F0E6;padding:32px 16px">' +
    '<div style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #141210;padding:32px;font:16px/1.6 Arial,sans-serif;color:#141210">' +
    '<p style="margin:0 0 24px;font:800 24px Arial,sans-serif;letter-spacing:-0.02em;color:#C9381A">NANDEZ' +
    ' <span style="font:700 10px Arial,sans-serif;letter-spacing:0.22em;color:#141210">COFFEE GANG</span></p>' + html +
    '<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #E5DED0;font-size:12px;color:#6B645C">' + pie + "</p></div></div>";
}
const plantilla_ = (texto, correo) => marco_(cuerpo_(texto), pieComunidad_(correo, false));

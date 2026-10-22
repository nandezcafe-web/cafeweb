/* ============================================================
   NANDEZ COFFEE · registros y correos
   Google Apps Script, gratis, en la cuenta de Google de Nandez.
   Guarda en una Hoja de Google cada correo que llega de la página
   (comunidad, listas de espera, suscripción, cotizaciones, pedidos),
   se lo muestra al panel interno y envía los correos de remarketing
   desde Gmail, con enlace para darse de baja.

   Puesta en marcha (una sola vez): docs/12_correos_y_remarketing.md
   1. script.google.com → Proyecto nuevo → pegar este archivo.
   2. Ejecutar la función "configurar" y aceptar los permisos.
      En el registro de ejecución quedan la dirección de la hoja
      y la CLAVE del panel.
   3. Implementar → Nueva implementación → Aplicación web.
      Ejecutar como: yo. Quién tiene acceso: cualquier persona.
   4. Copiar la URL /exec y ponerla en CONFIG.registro (prototipo/js/core.js).
   ============================================================ */
const MARCA = "Nandez Coffee";
const COMUNIDAD = "Nandez Coffee Gang";
const H_CONTACTOS = "Contactos", H_REGISTROS = "Registros", H_ENVIOS = "Envíos", H_ENTREGAS = "Entregas";
const COLS = ["correo", "nombre", "etiquetas", "acepta_correos", "alta", "ultimo", "baja", "ciudad", "idioma"];

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
  const primera = ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
  if (primera && ss.getSheets().length > 1) ss.deleteSheet(primera);
  if (!p.getProperty("CLAVE")) p.setProperty("CLAVE", Utilities.getUuid().replace(/-/g, ""));
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

/* ---------- lo que llega de la página ----------
   La página manda texto plano (sin preflight de CORS). Nunca se activa
   "acepta_correos" sin la casilla de la comunidad: la Ley 1581 pide
   autorización previa y expresa para enviar publicidad. */
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "json" }); }
  if (d.accion === "enviar") return enviar_(d);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = libro_(), correo = corto_(d.correo || d.mail, 254).trim().toLowerCase(), tipo = corto_(d.tipo, 40);
    ss.getSheetByName(H_REGISTROS).appendRow([new Date(), tipo, correo, corto_(JSON.stringify(d), 4000), corto_(d.pagina, 300)]);
    if (correoValido_(correo)) {
      const etiqueta = tipo === "espera" && d.producto ? "espera: " + corto_(d.producto, 60)
        : tipo === "suscripcion" && d.plan ? "suscripción: " + corto_(d.plan, 30) : tipo;
      guardar_(ss, correo, { nombre: corto_(d.nombre, 120), etiqueta: etiqueta, acepta: d.consentimiento === true,
        ciudad: corto_(d.ciudad, 80), idioma: corto_(d.idioma, 5) });
    }
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

/* ---------- lo que pide el panel, y la baja ---------- */
function doGet(e) {
  const q = (e && e.parameter) || {};
  if (q.accion === "baja") return baja_(q);
  if (q.accion === "lista") {
    if (!q.clave || q.clave !== clave_()) return json_({ ok: false, error: "clave" });
    const ss = libro_(), filas = ss.getSheetByName(H_CONTACTOS).getDataRange().getValues();
    const contactos = filas.slice(1).filter((f) => f[0]).map((f) => ({ correo: f[0], nombre: f[1], etiquetas: etiquetas_(f[2]),
      acepta: f[3] === true, alta: f[4], ultimo: f[5], baja: f[6], ciudad: f[7], idioma: f[8] }));
    const envios = ss.getSheetByName(H_ENVIOS).getDataRange().getValues().slice(1).slice(-10).reverse()
      .map((f) => ({ fecha: f[0], asunto: f[1], para: f[2], enviados: f[3], pendientes: f[4] }));
    return json_({ ok: true, contactos: contactos, envios: envios, cuota: MailApp.getRemainingDailyQuota(), hoja: ss.getUrl() });
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

function plantilla_(texto, correo) {
  const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const parrafos = esc(texto).split(/\n{2,}/).map((p) => '<p style="margin:0 0 16px">' + p.replace(/\n/g, "<br>") + "</p>").join("");
  return '<div style="background:#F5F0E6;padding:32px 16px">' +
    '<div style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #141210;padding:32px;font:16px/1.6 Arial,sans-serif;color:#141210">' +
    '<p style="margin:0 0 24px;font:800 24px Arial,sans-serif;letter-spacing:-0.02em;color:#C9381A">NANDEZ' +
    ' <span style="font:700 10px Arial,sans-serif;letter-spacing:0.22em;color:#141210">COFFEE GANG</span></p>' + parrafos +
    '<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #E5DED0;font-size:12px;color:#6B645C">Recibes este correo porque te uniste a la comunidad ' +
    COMUNIDAD + '. <a href="' + enlaceBaja_(correo) + '" style="color:#6B645C">Darme de baja</a>.</p></div></div>';
}

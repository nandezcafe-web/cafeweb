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
const SITIO = "https://www.nandezcoffee.com";
/* El bono de bienvenida: 10 % en la primera compra, un solo uso, vence a los 30 días.
   A los 23 días, si no lo ha usado, le llega un recordatorio (le quedan 7). */
const BONO = { pct: 10, dias: 30, recordarA: 23 };
/* El aviso diario a Nandez: suscripciones que tocan en los próximos días */
const AVISO_DIAS = 3;
const H_CONTACTOS = "Contactos", H_REGISTROS = "Registros", H_ENVIOS = "Envíos", H_ENTREGAS = "Entregas";
const H_BONOS = "Bonos", H_PEDIDOS = "Pedidos", H_SUBS = "Suscripciones", H_STOCK = "Stock";
const COLS = ["correo", "nombre", "etiquetas", "acepta_correos", "alta", "ultimo", "baja", "ciudad", "idioma"];
const COLS_BONOS = ["codigo", "correo", "pct", "alta", "vence", "bienvenida", "usado", "pedido", "recordado", "idioma"];
/* Los datos de envío entraron después, así que van al final: una hoja que ya
   existe conserva el orden viejo y las filas de antes no se descuadran. */
const COLS_PEDIDOS = ["id", "fecha", "estado", "nombre", "correo", "whatsapp", "ciudad", "productos", "subtotal", "descuento",
  "envio", "total", "bono", "canal", "pagado", "despachado", "transportadora", "guia", "notas",
  "documento", "direccion", "detalle", "departamento", "items", "iva", "idioma", "transaccion"];
/* Una fila por presentación ("P-CAS-250"). Esta hoja es el stock de verdad:
   el navegador solo copia lo que diga aquí. Se puede corregir a mano. */
const COLS_STOCK = ["id", "nombre", "stock", "actualizado"];
const COLS_SUBS = ["correo", "plan", "kit", "pago", "cada_meses", "molienda", "ciudad", "alta", "estado", "proximo", "ultimo_envio", "envios", "notas", "idioma", "avisado"];
/* Al suscriptor se le avisa este número de días antes de que salga su caja */
const SUB_AVISO = 3;
const PLAN_NOMBRE = { semilla: ["Semilla", "Seed"], cosecha: ["Cosecha", "Harvest"], barista: ["Barista", "Barista"], cafeteria: ["Cafetería", "Café"] };
const planDe_ = (id, en) => (PLAN_NOMBRE[id] || [id, id])[en ? 1 : 0];
const ESTADOS_PEDIDO = ["nuevo", "pagado", "despachado", "entregado", "cancelado"];
const ESTADOS_SUB = ["espera", "activa", "pausada", "cancelada"];
/* Lo que la gente hace en la página (solo de quien aceptó las cookies) y el
   carrito que cada visitante tiene armado. El visitante es un número al azar
   que vive en su navegador: no dice quién es, salvo que ya haya dejado su correo. */
const H_ACTIVIDAD = "Actividad", H_CARRITOS = "Carritos", H_VISITAS = "Visitas";
/* Una fila por día y un número: cuánta gente abrió la página. No lleva
   visitante, ni correo, ni qué miró, así que no es dato de nadie y se puede
   contar sin pedir permiso. Es la única cifra comparable con «Visitas a la
   página de destino» de Meta; el embudo de al lado solo ve a quien aceptó las
   cookies, que siempre son menos. */
const COLS_VISITAS = ["dia", "visitas", "pop"];   // "pop": cuántos vieron el pop-up del bono
const COLS_ACTIVIDAD = ["fecha", "visitante", "evento", "detalle", "valor", "correo", "pagina", "idioma"];
const COLS_CARRITOS = ["visitante", "correo", "items", "total", "unidades", "creado", "actualizado", "estado", "recordado", "idioma"];
const EVENTOS = ["visita", "ver", "agregar", "pagar", "compra", "registro"];
/* Un carrito cuenta como abandonado si lleva esperaH horas quieto, y se deja de
   mostrar a los hastaDias. La bitácora se borra sola a los guardarDias.
   auto: true hace que el aviso de cada mañana mande el recordatorio sin que
   nadie oprima el botón (una vez por carrito, solo a quien acepta correos). */
const CARRITO = { esperaH: 1, hastaDias: 14, guardarDias: 90, auto: false };

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
  hoja_(ss, H_STOCK, COLS_STOCK);
  hoja_(ss, H_ACTIVIDAD, COLS_ACTIVIDAD);
  hoja_(ss, H_CARRITOS, COLS_CARRITOS);
  hoja_(ss, H_VISITAS, COLS_VISITAS);
  /* la columna "pop" entró después: una hoja de antes se quedaría sin su título */
  const hv = hojaDe_(ss, H_VISITAS);
  if (hv.getLastColumn() < 3) hv.getRange(1, 3).setValue("pop").setFontWeight("bold");
  const primera = ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
  if (primera && ss.getSheets().length > 1) ss.deleteSheet(primera);
  if (!p.getProperty("CLAVE")) p.setProperty("CLAVE", Utilities.getUuid().replace(/-/g, ""));
  /* el aviso de cada mañana: una sola vez, aunque se ejecute configurar de nuevo */
  if (!ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "diario"))
    ScriptApp.newTrigger("diario").timeBased().everyDays(1).atHour(7).create();
  if (!ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "liberarReservas"))
    ScriptApp.newTrigger("liberarReservas").timeBased().everyHours(1).create();
  Logger.log("Hoja de contactos: " + ss.getUrl());
  Logger.log("Clave del panel (pégala en la pestaña Correos): " + p.getProperty("CLAVE"));
}
function hoja_(ss, nombre, cols) {
  let h = ss.getSheetByName(nombre);
  if (!h) { h = ss.insertSheet(nombre); h.appendRow(cols); h.setFrozenRows(1); h.getRange(1, 1, 1, cols.length).setFontWeight("bold"); return h; }
  /* La hoja ya estaba: si el script ganó columnas, les pone título sin tocar lo
     escrito. Se mira la fila de títulos, no getLastColumn(), que cuenta los datos. */
  const titulos = h.getRange(1, 1, 1, cols.length).getValues()[0];
  for (let i = 0; i < cols.length; i++) if (!titulos[i]) h.getRange(1, i + 1).setValue(cols[i]).setFontWeight("bold");
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
const hojaDe_ = (ss, nombre) => hoja_(ss, nombre, { [H_BONOS]: COLS_BONOS, [H_PEDIDOS]: COLS_PEDIDOS, [H_SUBS]: COLS_SUBS, [H_STOCK]: COLS_STOCK,
  [H_ACTIVIDAD]: COLS_ACTIVIDAD, [H_CARRITOS]: COLS_CARRITOS, [H_VISITAS]: COLS_VISITAS }[nombre]);

/* ---------- lo que llega de la página ----------
   La página manda texto plano (sin preflight de CORS). Nunca se activa
   "acepta_correos" sin la casilla de la comunidad: la Ley 1581 pide
   autorización previa y expresa para enviar publicidad. */
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "json" }); }
  if (d.accion === "enviar") return enviar_(d);
  if (d.accion === "pedido") return cambiarPedido_(d);
  if (d.accion === "pago") return pago_(d);
  if (d.accion === "suscripcion") return cambiarSub_(d);
  if (d.accion === "sub-envio") return envioSub_(d);
  if (d.accion === "recordar") return recordar_(d);
  if (d.accion === "stock") return fijarStock_(d);
  if (d.accion === "limpiar") return limpiar_(d);
  /* la bitácora no pasa por Registros ni toca Contactos: es otra cosa */
  if (d.tipo === "llegada") return llegada_(d);
  if (d.tipo === "evento") return evento_(d);
  if (d.tipo === "carrito") return carrito_(d);
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
    if (tipo === "pedido") { const r = pedido_(ss, d, valido ? correo : ""); return json_({ ok: true, pedido: r.id, faltan: r.falta }); }
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
  const enlace = SITIO + (en ? "/en/coffees" : "/cafes") + "?bono=" + codigo, pct = Number(f[2]) || BONO.pct;
  const intro = en
    ? "You now have a coffee plug that connects you with the farms we pick in Norte de Santander, and soon with growers from other regions of Colombia. Every bag carries the right information: the farm, the grower, the altitude and the roast date.\n\nTo welcome you to the crew, your first order is " + pct + " % off:"
    : "Ahora tienes un plug de café que te conecta con los cultivos que elegimos en Norte de Santander, y muy pronto con caficultores de otras regiones de Colombia. Cada bolsa trae la información correcta: la finca, quien la cultiva, la altura y la fecha de tostión.\n\nPara darte la bienvenida al crew, tu primera compra tiene " + pct + " % menos:";
  const vale = en ? "Yours until " + vence + ", for one order. The button gets it ready in your cart." : "Es tuyo hasta el " + vence + ", para un pedido. El botón lo deja listo en tu carrito.";
  const porQue = en
    ? ["Coffee from farms in Norte de Santander, and soon from other regions of Colombia", "Medium roast, whole bean or ground", "The farm and the roast date on every bag", "You hear about every drop before anyone else", "Shipping anywhere in Colombia"]
    : ["Café de fincas de Norte de Santander, y muy pronto de otras regiones de Colombia", "Tostión media, en grano o molido", "La finca y la fecha de tostión en cada bolsa", "Te enteras de cada drop antes que nadie", "Envíos a toda Colombia"];
  const cierre = en ? "How do you brew at home? Reply and we will tell you where to start. A real person reads it."
    : "¿Cómo lo preparas en casa? Respóndenos y te decimos con cuál empezar. Del otro lado te lee una persona.";
  const html = titulo_(en ? "Welcome to " : "Bienvenido a ", COMUNIDAD) + centrado_(intro) + codigoHtml_(codigo) +
    centrado_(vale, 13) + boton_(enlace, en ? "Order my first bag" : "Pedir mi primera bolsa") +
    lista_(en ? "Why " + MARCA + "?" : "¿Por qué " + MARCA + "?", porQue) +
    productos_(en ? "To start with…" : "Para empezar…", codigo, pct, en) + centrado_(cierre, 15);
  MailApp.sendEmail({ to: correo, name: MARCA, subject: en ? "Welcome to " + COMUNIDAD + ": " + pct + " % off your first bag" : "Bienvenido a " + COMUNIDAD + ": tu primera bolsa con " + pct + " %",
    htmlBody: marco_(html, pieComunidad_(correo, en)),
    body: (en ? "Welcome to " : "Bienvenido a ") + COMUNIDAD + ".\n\n" + intro + "\n\n" + codigo + "\n" + vale + "\n" + enlace + "\n\n" +
      porQue.map((x) => "· " + x).join("\n") + "\n\n" + cierre + "\n\n—\n" + MARCA + "\n" + (en ? "Unsubscribe: " : "Para no recibir más correos: ") + enlaceBaja_(correo) });
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
/* Los canales que cobran dentro de la página: reservan las bolsas mientras la persona paga */
const PASARELAS = ["wompi", "mercadopago"];
const esPasarela_ = (canal) => PASARELAS.indexOf(String(canal)) >= 0;
function pedido_(ss, d, correo) {
  const h = hojaDe_(ss, H_PEDIDOS), id = corto_(d.id, 40) || "NDZ-" + Utilities.getUuid().slice(0, 8).toUpperCase();
  const items = Array.isArray(d.items) ? d.items : [];
  const productos = items.map((i) => num_(i.n) + " × " + corto_(i.nombre, 80) + (i.forma ? " (" + corto_(i.forma, 60).toLowerCase() + ")" : "")).join("\n");
  /* Con pasarela es todo o nada: si no alcanza, no se escribe el pedido, no se
     gasta el bono y no se aparta ninguna bolsa. La página le dice qué se agotó. */
  if (esPasarela_(d.canal)) { const faltan = faltantes_(ss, items); if (faltan.length) return { id: null, falta: faltan }; }
  let notas = "", bono = "";
  if (d.bono) {
    const b = bonoVigente_(ss, d.bono);
    if (b.fila) { bono = b.codigo; const hb = ss.getSheetByName(H_BONOS); hb.getRange(b.fila, 7).setValue(new Date()); hb.getRange(b.fila, 8).setValue(id); }
    else { bono = corto_(d.bono, 20); notas = "Ojo: el bono " + bono + " no sirve (" + b.error + "); se cobró con descuento."; }
  }
  /* el pedido aparta las bolsas: si alguien pidió más de las que había, queda escrito */
  const falta = descontarStock_(ss, items);
  if (falta.length) notas = (notas ? notas + " " : "") + "Sin stock — " + falta.join("; ") + ".";
  h.appendRow([id, new Date(), "nuevo", corto_(d.nombre, 120), correo, corto_(d.tel, 40), corto_(d.ciudad, 80), productos,
    num_(d.subtotal), num_(d.descuento), num_(d.envio), num_(d.total), bono, corto_(d.canal, 20), "", "", "", "", notas,
    corto_(d.documento, 30), corto_(d.direccion, 200), corto_(d.detalle, 200), corto_(d.departamento, 60),
    /* nom y p (precio con IVA) son para la factura; a es lo que se apartó del stock */
    JSON.stringify(items.map((i) => ({ id: corto_(i.id, 40), g: num_(i.g), n: num_(i.n), nom: corto_(i.nombre, 80), p: num_(i.precio), a: num_(i.a),
      ...(i.preventa ? { preventa: true, stock: num_(i.stock) } : {}) }))),
    num_(d.iva), corto_(d.idioma, 5), ""]);
  const en = d.idioma === "en", lineas = productos + "\n\nTotal: " + pesos_(d.total) + (num_(d.descuento) ? " (" + (en ? "with " : "con ") + bono + ")" : "") +
    (num_(d.iva) ? "\n" + (en ? "Includes " : "Incluye ") + pesos_(d.iva) + (en ? " of VAT" : " de IVA") : "");
  /* la dirección como se escribe en la guía */
  const envio = corto_(d.direccion, 200) + (d.detalle ? "\n" + corto_(d.detalle, 200) : "") +
    "\n" + corto_(d.ciudad, 80) + (d.departamento ? ", " + corto_(d.departamento, 60) : "");
  /* Con pasarela el pedido es una reserva mientras la persona paga: ni a Nandez ni
     al cliente se les escribe todavía. Los dos correos salen en pago_, con el pago
     confirmado; así nadie recibe "te escribimos cómo pagar" después de pagar. */
  if (esPasarela_(d.canal)) return { id: id, falta: falta };
  /* a Nandez, enseguida; al cliente, la constancia de que llegó */
  if (MailApp.getRemainingDailyQuota() > 0)
    MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), name: MARCA, subject: "Pedido nuevo " + id + " · " + pesos_(d.total),
      body: corto_(d.nombre, 120) + (d.documento ? " · CC/NIT " + corto_(d.documento, 30) : "") +
        (d.tel ? " · tel " + corto_(d.tel, 40) : "") + (correo ? " · " + correo : "") +
        "\n\n" + envio + "\n\n" + lineas + (notas ? "\n\n" + notas : "") +
        "\n\nConfírmalo y márcalo como pagado en el panel, pestaña Pedidos." });
  if (correo && MailApp.getRemainingDailyQuota() > 0) {
    /* la dirección va de vuelta: un error se arregla mejor antes de despachar */
    const texto = en
      ? "We got your order " + id + ".\n\n" + lineas + "\n\nIt ships to:\n" + envio +
        "\n\nIs anything wrong there? Just reply. We will write to you shortly with how to pay; once it is paid, we ship it and send you the tracking number."
      : "Recibimos tu pedido " + id + ".\n\n" + lineas + "\n\nVa a:\n" + envio +
        "\n\n¿Algo quedó mal escrito? Responde este correo. En un rato te escribimos con cómo pagar; apenas esté pago lo despachamos y te mandamos la guía.";
    MailApp.sendEmail({ to: correo, name: MARCA, subject: (en ? "We got your order " : "Recibimos tu pedido ") + id,
      htmlBody: marco_(cuerpo_(texto), pieServicio_(id, en)), body: texto + "\n\n—\n" + MARCA });
  }
  return { id: id, falta: falta };
}
/* ---------- stock compartido ----------
   Sin esta hoja cada navegador llevaba su propia cuenta y dos personas podían
   comprar la última bolsa. Acá hay una sola cifra para todos. */
/* Una reserva de preventa va contra su propio cupo ("P-PAR-250-pre"), no contra
   las bolsas, que todavía no existen. Sin cupo (stock 0) no hay nada que contar. */
const claveStock_ = (i) => corto_(i.id, 40) + "-" + num_(i.g) + (i.preventa ? "-pre" : "");
const sinTope_ = (i) => !!i.preventa && !num_(i.stock);
function stockMapa_(ss) {
  const m = {};
  hojaDe_(ss, H_STOCK).getDataRange().getValues().slice(1).forEach((f) => { if (f[0]) m[String(f[0])] = num_(f[2]); });
  return m;
}
/* Descuenta lo pedido. La primera vez que ve una presentación crea su fila con
   lo que la tienda dice tener: de ahí sale el inventario inicial, y después
   manda la hoja. Devuelve lo que no alcanzó, para anotarlo en el pedido. */
function descontarStock_(ss, items) {
  const h = hojaDe_(ss, H_STOCK), filas = h.getDataRange().getValues(), falta = [];
  items.forEach((i) => {
    const id = claveStock_(i), piden = Math.max(0, num_(i.n));
    i.a = 0;
    if (!num_(i.g) || !piden || sinTope_(i)) return;
    const k = filas.findIndex((f, j) => j > 0 && String(f[0]) === id);
    const hay = k > 0 ? num_(filas[k][2]) : num_(i.stock);
    if (piden > hay) falta.push(corto_(i.nombre, 80) + ": pidió " + piden + " y había " + hay);
    /* lo que de verdad se apartó (a): es lo que vuelve si el pedido se cancela */
    i.a = Math.min(piden, Math.max(0, hay));
    const queda = Math.max(0, hay - piden);
    if (k > 0) { h.getRange(k + 1, 3).setValue(queda); h.getRange(k + 1, 4).setValue(new Date()); filas[k][2] = queda; }
    else { h.appendRow([id, corto_(i.nombre, 80), queda, new Date()]); filas.push([id, "", queda, ""]); }
  });
  return falta;
}
/* ¿Alcanza para todo el pedido? Se mira sin tocar nada: la pasarela no aparta a medias */
function faltantes_(ss, items) {
  const filas = hojaDe_(ss, H_STOCK).getDataRange().getValues();
  return items.filter((i) => {
    if (sinTope_(i)) return false;
    const k = filas.findIndex((f, j) => j > 0 && String(f[0]) === claveStock_(i));
    return num_(i.g) && num_(i.n) > (k > 0 ? num_(filas[k][2]) : num_(i.stock));
  }).map((i) => corto_(i.nombre, 80));
}
/* Un pedido cancelado devuelve lo que apartó. Los pedidos de antes no guardaban
   cuánto apartaron (a); para esos se devuelve lo pedido. */
function devolverStock_(ss, items) {
  const h = hojaDe_(ss, H_STOCK), filas = h.getDataRange().getValues();
  items.forEach((i) => {
    const k = filas.findIndex((f, j) => j > 0 && String(f[0]) === claveStock_(i));
    if (k < 1) return;
    const nuevo = num_(filas[k][2]) + Math.max(0, num_(i.a != null ? i.a : i.n));
    h.getRange(k + 1, 3).setValue(nuevo);
    h.getRange(k + 1, 4).setValue(new Date());
    filas[k][2] = nuevo;
  });
}
/* El panel corrige a mano lo que queda de una presentación (llegó café, se dañó
   una bolsa, el conteo no cuadra). Si esa presentación todavía no tiene fila, la crea. */
function fijarStock_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  const id = corto_(d.id, 60).trim(), n = Number(d.stock);
  if (!/^[A-Za-z0-9-]{3,60}$/.test(id) || !(n >= 0) || n > 100000) return json_({ ok: false, error: "dato" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const h = hojaDe_(libro_(), H_STOCK), filas = h.getDataRange().getValues();
    const k = filas.findIndex((f, j) => j > 0 && String(f[0]) === id);
    if (k > 0) { h.getRange(k + 1, 3).setValue(Math.round(n)); h.getRange(k + 1, 4).setValue(new Date()); }
    else h.appendRow([id, corto_(d.nombre, 80), Math.round(n), new Date()]);
    return json_({ ok: true, stock: Math.round(n) });
  } finally { lock.releaseLock(); }
}
/* Un pedido cancelado devuelve también el bono que usó, para que no se pierda */
function liberarBono_(ss, codigo, id) {
  if (!codigo) return;
  const hb = hojaDe_(ss, H_BONOS), filas = hb.getDataRange().getValues();
  const k = filas.findIndex((f, j) => j > 0 && String(f[0]) === String(codigo) && String(f[7]) === String(id));
  if (k > 0) { hb.getRange(k + 1, 7).setValue(""); hb.getRange(k + 1, 8).setValue(""); }
}
const itemsDe_ = (v) => { try { const a = JSON.parse(v || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };

/* ---------- pago confirmado por la pasarela ----------
   Lo llama api/wompi.js cuando Wompi avisa, ya con la firma del aviso revisada.
   Pide la CLAVE porque marcar pagado pone en marcha un despacho. Es idempotente:
   Wompi repite el aviso hasta tres veces y aquí nada pasa dos veces.
   Columnas (base 0): 2 estado · 11 total · 13 canal · 18 notas · 23 items · 25 idioma · 26 transaccion */
const ESTADOS_PAGADO = ["pagado", "despachado", "entregado"];
function pago_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = libro_(), h = hojaDe_(ss, H_PEDIDOS), filas = h.getDataRange().getValues();
    const i = filas.findIndex((f, k) => k > 0 && String(f[0]) === String(d.id));
    if (i < 0) return json_({ ok: false, error: "no" });
    const r = i + 1, f = filas[i], monto = num_(d.monto), total = num_(f[11]);
    const ref = [corto_(d.pasarela, 20), corto_(d.metodo, 30), corto_(d.transaccion, 60)].filter(String).join(" · ");
    const anotar = (txt) => { const n = (f[18] ? f[18] + " " : "") + txt; h.getRange(r, 19).setValue(n); f[18] = n; };
    /* Anulado después de pagado: la plata volvió al cliente, así que no se despacha */
    if (d.estado === "anulado" && ESTADOS_PAGADO.indexOf(f[2]) >= 0) {
      anotar("Pago anulado por la pasarela (" + ref + ").");
      const antes = f[2];
      if (antes === "pagado") h.getRange(r, 3).setValue("nuevo");
      avisoNandez_("Pago anulado " + f[0], "La pasarela anuló el pago de " + f[0] + ". " +
        (antes === "pagado" ? "Volvió a «nuevo»: no lo despaches." : "Ya estaba " + antes + ": revísalo.") + "\n\n" + ref);
      return json_({ ok: true, estado: antes === "pagado" ? "nuevo" : antes, anulado: true });
    }
    if (d.estado !== "aprobado") {
      /* Rechazado o con error: la reserva sigue porque la persona puede reintentar;
         si al final no paga, liberarReservas devuelve las bolsas. */
      if (ESTADOS_PAGADO.indexOf(f[2]) < 0) anotar("Pago " + corto_(d.estado, 20) + " (" + ref + ").");
      return json_({ ok: true, estado: f[2] });
    }
    if (ESTADOS_PAGADO.indexOf(f[2]) >= 0) return json_({ ok: true, repetido: true });
    if (monto < total) {
      anotar("Ojo: pagó " + pesos_(monto) + " y el pedido suma " + pesos_(total) + " (" + ref + "). No se marcó pagado.");
      avisoNandez_("Revisar el pago de " + f[0], "Pagó " + pesos_(monto) + " y el pedido suma " + pesos_(total) + ".\n\n" + ref);
      return json_({ ok: true, estado: f[2], revisar: true });
    }
    /* Llegó el pago de una reserva que ya se había liberado: se vuelve a apartar */
    if (f[2] === "cancelado") {
      const its = itemsDe_(f[23]).map((x) => ({ id: x.id, g: x.g, n: x.n, nom: x.nom, nombre: x.nom, p: x.p, preventa: x.preventa, stock: x.stock }));
      const falta = descontarStock_(ss, its);
      h.getRange(r, 24).setValue(JSON.stringify(its.map((x) => ({ id: x.id, g: x.g, n: x.n, nom: x.nom, p: x.p, a: x.a }))));
      let nota = "El pago llegó después de liberar la reserva; se volvió a apartar.";
      if (falta.length) nota += " Sin stock — " + falta.join("; ") + ".";
      /* el bono se había soltado al liberar: se vuelve a marcar usado */
      if (f[12]) {
        const b = bonoVigente_(ss, f[12]);
        if (b.fila) { const hb = ss.getSheetByName(H_BONOS); hb.getRange(b.fila, 7).setValue(new Date()); hb.getRange(b.fila, 8).setValue(f[0]); }
        else nota += " El bono " + f[12] + " ya no estaba libre (" + b.error + ").";
      }
      anotar(nota);
    }
    if (monto > total) anotar("Pagó " + pesos_(monto - total) + " de más.");
    h.getRange(r, 3).setValue("pagado");
    h.getRange(r, 15).setValue(new Date());
    h.getRange(r, 27).setValue(ref);
    correosPago_(f, monto, ref);
    return json_({ ok: true, estado: "pagado" });
  } finally { lock.releaseLock(); }
}
function avisoNandez_(asunto, texto) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), name: MARCA, subject: asunto, body: texto });
  return true;
}
/* Los dos correos del pago confirmado, armados desde la fila del pedido */
function correosPago_(f, monto, ref) {
  const en = f[25] === "en", id = String(f[0]), correo = String(f[4] || "");
  const lineas = String(f[7]) + "\n\nTotal: " + pesos_(f[11]) + (num_(f[9]) ? " (" + (en ? "with " : "con ") + f[12] + ")" : "") +
    (num_(f[24]) ? "\n" + (en ? "Includes " : "Incluye ") + pesos_(f[24]) + (en ? " of VAT" : " de IVA") : "");
  const envio = [f[20], f[21]].filter(String).join("\n") + "\n" + [f[6], f[22]].filter(String).join(", ");
  avisoNandez_("Pago confirmado " + id + " · " + pesos_(monto),
    f[3] + (f[19] ? " · CC/NIT " + f[19] : "") + (f[5] ? " · tel " + f[5] : "") + (correo ? " · " + correo : "") +
    "\n\n" + envio + "\n\n" + lineas + "\n\n" + ref + (f[18] ? "\n\n" + f[18] : "") +
    "\n\nYa está pago: despáchalo desde el panel, pestaña Pedidos.");
  if (!correoValido_(correo) || MailApp.getRemainingDailyQuota() < 1) return;
  const texto = en
    ? "We got the payment for your order " + id + ".\n\n" + lineas + "\n\nIt ships to:\n" + envio +
      "\n\nIs anything wrong there? Just reply. We ship it in the next business days and send you the tracking number."
    : "Recibimos el pago de tu pedido " + id + ".\n\n" + lineas + "\n\nVa a:\n" + envio +
      "\n\n¿Algo quedó mal escrito? Responde este correo. Lo despachamos en los próximos días hábiles y te mandamos la guía.";
  MailApp.sendEmail({ to: correo, name: MARCA, subject: (en ? "Payment received · " : "Pago recibido · ") + id,
    htmlBody: marco_(cuerpo_(texto), pieServicio_(id, en)), body: texto + "\n\n—\n" + MARCA });
}
/* Cada hora: la reserva de la pasarela que nadie pagó devuelve sus bolsas. El
   pago vence a los 30 minutos (api/pago.js), así que pasadas RESERVA_HORAS ya no
   se puede pagar. Si aun así llega un pago tarde, pago_ la vuelve a apartar. */
const RESERVA_HORAS = 2;
function liberarReservas() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = libro_(), h = hojaDe_(ss, H_PEDIDOS), filas = h.getDataRange().getValues();
    const limite = Date.now() - RESERVA_HORAS * 3600 * 1000;
    let n = 0;
    for (let i = 1; i < filas.length; i++) {
      const f = filas[i];
      if (!esPasarela_(f[13]) || f[2] !== "nuevo" || new Date(f[1]).getTime() > limite) continue;
      devolverStock_(ss, itemsDe_(f[23]));
      liberarBono_(ss, f[12], f[0]);
      h.getRange(i + 1, 3).setValue("cancelado");
      h.getRange(i + 1, 19).setValue((f[18] ? f[18] + " " : "") + "Reserva liberada: no se pagó en " + RESERVA_HORAS + " h.");
      n++;
    }
    return n;
  } finally { lock.releaseLock(); }
}

/* El panel mueve el pedido de estado. Al despacharlo con guía, el cliente recibe la guía. */
function cambiarPedido_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  if (ESTADOS_PEDIDO.indexOf(d.estado) < 0) return json_({ ok: false, error: "estado" });
  const ss = libro_(), h = hojaDe_(ss, H_PEDIDOS), filas = h.getDataRange().getValues();
  const i = filas.findIndex((f, k) => k > 0 && String(f[0]) === String(d.id));
  if (i < 0) return json_({ ok: false, error: "no" });
  const r = i + 1, f = filas[i];
  /* la página solo puede soltar su propia reserva: sin pagar y de la pasarela */
  if (d.soloReserva && (f[2] !== "nuevo" || !esPasarela_(f[13]))) return json_({ ok: false, error: "no-es-reserva" });
  /* cancelar devuelve las bolsas y el bono, y solo la primera vez */
  if (d.estado === "cancelado" && f[2] !== "cancelado") { devolverStock_(ss, itemsDe_(f[23])); liberarBono_(ss, f[12], f[0]); }
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

/* ---------- la bitácora de la página ----------
   La página manda esto solo cuando la persona aceptó las cookies. Un evento es
   una fila; el carrito es una fila por visitante, que se va reescribiendo. */
const visitante_ = (v) => { const s = String(v || ""); return /^[a-z0-9]{8,32}$/.test(s) ? s : ""; };
const dosCifras_ = (n) => (n < 10 ? "0" : "") + n;
const diaClave_ = (v) => { const d = new Date(v); return d.getFullYear() + "-" + dosCifras_(d.getMonth() + 1) + "-" + dosCifras_(d.getDate()); };
/* Alguien abrió la página. Lo único que se guarda es que hoy hubo una más.
   Se llama antes del aviso de cookies y también cuando dicen que no: por eso
   no puede llevar nada que identifique. Si la hoja está ocupada no se espera,
   que una cuenta de menos importa menos que una página lenta. */
function llegada_(d) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return json_({ ok: true });
  try {
    const h = hojaDe_(libro_(), H_VISITAS), hoy = diaClave_(new Date()), filas = h.getDataRange().getValues();
    /* la misma fila del día: columna 2 quien entró, columna 3 quien vio el pop-up */
    const col = d && d.pop === true ? 3 : 2;
    for (let i = 1; i < filas.length; i++) {
      if (String(filas[i][0]) === hoy) { h.getRange(i + 1, col).setValue(num_(filas[i][col - 1]) + 1); return json_({ ok: true }); }
    }
    h.appendRow(col === 3 ? [hoy, 0, 1] : [hoy, 1, 0]);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}
function evento_(d) {
  const v = visitante_(d.v), ev = String(d.evento || "");
  if (!v || EVENTOS.indexOf(ev) < 0) return json_({ ok: false, error: "evento" });
  const correo = corto_(d.correo, 254).trim().toLowerCase();
  hojaDe_(libro_(), H_ACTIVIDAD).appendRow([new Date(), v, ev, corto_(d.detalle, 120), num_(d.valor),
    correoValido_(correo) ? correo : "", corto_(d.pagina, 120), corto_(d.idioma, 5)]);
  return json_({ ok: true });
}
function carrito_(d) {
  const v = visitante_(d.v);
  if (!v) return json_({ ok: false, error: "visitante" });
  const items = (Array.isArray(d.items) ? d.items : []).slice(0, 20)
    .map((i) => ({ id: corto_(i.id, 40), g: num_(i.g), n: num_(i.n), nom: corto_(i.nombre, 80), p: num_(i.precio) })).filter((i) => i.n > 0);
  const dado = corto_(d.correo, 254).trim().toLowerCase(), correo = correoValido_(dado) ? dado : "";
  const total = items.reduce((s, i) => s + i.p * i.n, 0), unidades = items.reduce((s, i) => s + i.n, 0), ahora = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const h = hojaDe_(libro_(), H_CARRITOS), filas = h.getDataRange().getValues();
    const k = filas.findIndex((f, j) => j > 0 && String(f[0]) === v);
    if (k < 0) {
      if (items.length && d.comprado !== true) h.appendRow([v, correo, JSON.stringify(items), total, unidades, ahora, ahora, "abierto", "", corto_(d.idioma, 5)]);
      return json_({ ok: true });
    }
    const f = filas[k];
    /* un carrito comprado que llega vacío sigue comprado; si vuelve a llenarse es
       un carrito nuevo, y a ese sí se le puede recordar otra vez */
    const estado = d.comprado === true ? "comprado" : items.length ? "abierto" : f[7] === "comprado" ? "comprado" : "vacío";
    const recordado = estado === "abierto" && f[7] !== "abierto" ? "" : f[8];
    h.getRange(k + 1, 1, 1, 10).setValues([[v, correo || f[1], items.length ? JSON.stringify(items) : f[2], items.length ? total : f[3],
      items.length ? unidades : f[4], f[5] || ahora, ahora, estado, recordado, corto_(d.idioma, 5) || f[9]]]);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}
/* Los carritos que alguien dejó armados: quietos hace más de esperaH y de los últimos hastaDias */
function carritosQuietos_(ss) {
  const ahora = Date.now(), desde = ahora - CARRITO.hastaDias * 864e5, hasta = ahora - CARRITO.esperaH * 36e5;
  return hojaDe_(ss, H_CARRITOS).getDataRange().getValues().map((f, i) => ({ fila: i + 1, v: String(f[0]), correo: String(f[1] || ""),
    items: itemsDe_(f[2]), total: num_(f[3]), unidades: num_(f[4]), actualizado: f[6], estado: f[7], recordado: f[8], idioma: f[9] }))
    .slice(1).filter((c) => c.v && c.estado === "abierto" && c.items.length && new Date(c.actualizado).getTime() >= desde && new Date(c.actualizado).getTime() <= hasta);
}
/* Todo lo que pinta la pestaña Actividad del panel, de una sola vez */
function actividad_(q) {
  const ss = libro_(), dias = Math.min(90, Math.max(1, num_(q.dias) || 30)), desde = masDias_(new Date(), -(dias - 1));
  const filas = hojaDe_(ss, H_ACTIVIDAD).getDataRange().getValues().slice(1).filter((f) => f[0] && new Date(f[0]) >= desde);
  /* el embudo cuenta personas (visitantes distintos), no clics */
  const quien = {}, porDia = {}, prod = {};
  EVENTOS.forEach((e) => { quien[e] = {}; });
  filas.forEach((f) => {
    const e = String(f[2]); if (!quien[e]) return;
    quien[e][f[1]] = true;
    const k = diaClave_(f[0]), d = porDia[k] || (porDia[k] = { visita: {}, agregar: {}, compra: {} });
    if (d[e]) d[e][f[1]] = true;
    if ((e === "ver" || e === "agregar") && f[3]) { const p = prod[f[3]] || (prod[f[3]] = { nombre: String(f[3]), ver: 0, agregar: 0 }); p[e]++; }
  });
  const cuenta = (o) => Object.keys(o).length, embudo = {};
  EVENTOS.forEach((e) => { embudo[e] = cuenta(quien[e]); });
  const serie = [];
  for (let i = Math.min(dias, 14) - 1; i >= 0; i--) {
    const k = diaClave_(masDias_(new Date(), -i)), d = porDia[k];
    serie.push({ dia: k, visita: d ? cuenta(d.visita) : 0, agregar: d ? cuenta(d.agregar) : 0, compra: d ? cuenta(d.compra) : 0 });
  }
  const contactos = ss.getSheetByName(H_CONTACTOS).getDataRange().getValues().slice(1).filter((f) => f[0]);
  const acepta = {};
  contactos.forEach((f) => { acepta[String(f[0]).toLowerCase()] = f[3] === true && !f[6]; });
  const quietos = carritosQuietos_(ss).sort((a, b) => new Date(b.actualizado) - new Date(a.actualizado));
  const sinCorreo = quietos.filter((c) => !c.correo);
  /* Llegaron a pagar y no pagaron: la reserva de la pasarela que se liberó sola.
     Si después compró con ese mismo correo, ya no hay nada que recordarle. */
  const pedidos = hojaDe_(ss, H_PEDIDOS).getDataRange().getValues().slice(1).filter((f) => f[0]);
  const hace30 = masDias_(new Date(), -30);
  const sinPagar = pedidos.filter((f) => esPasarela_(f[13]) && f[2] === "cancelado" && /Reserva liberada/.test(String(f[18])) && new Date(f[1]) >= hace30
    && !pedidos.some((g) => f[4] && String(g[4]) === String(f[4]) && ESTADOS_PAGADO.indexOf(g[2]) >= 0 && new Date(g[1]) >= new Date(f[1])))
    .reverse().slice(0, 50).map((f) => ({ id: f[0], fecha: f[1], nombre: f[3], correo: f[4], tel: f[5], ciudad: f[6], productos: f[7], total: f[11],
      recordado: /Recordado el /.test(String(f[18])) }));
  /* las visitas anónimas del periodo, que son todas, no solo las que aceptaron */
  const vis = {}, pops = {};
  hojaDe_(ss, H_VISITAS).getDataRange().getValues().slice(1).forEach((f) => { if (f[0]) { vis[String(f[0])] = num_(f[1]); pops[String(f[0])] = num_(f[2]); } });
  let visitas = 0, pop = 0;
  serie.forEach((d) => { d.visitas = vis[d.dia] || 0; });
  for (let i = 0; i < dias; i++) { const k = diaClave_(masDias_(new Date(), -i)); visitas += vis[k] || 0; pop += pops[k] || 0; }
  const hoy = dia_(new Date()), alta = (f) => new Date(f[4]).getTime() || 0;
  return { ok: true, actividad: true, inscritos: inscritos_(ss), visitas: visitas, pop: pop, dias: dias, embudo: embudo, porDia: serie,
    productos: Object.keys(prod).map((k) => prod[k]).sort((a, b) => b.agregar - a.agregar || b.ver - a.ver).slice(0, 8),
    recientes: filas.slice(-40).reverse().map((f) => ({ fecha: f[0], visitante: String(f[1]).slice(0, 4), evento: f[2], detalle: f[3], valor: f[4], correo: f[5], pagina: f[6] })),
    carritos: quietos.filter((c) => c.correo).slice(0, 100).map((c) => ({ v: c.v, correo: c.correo, items: c.items, total: c.total, unidades: c.unidades,
      actualizado: c.actualizado, recordado: c.recordado, acepta: acepta[c.correo] === true })),
    anonimos: { n: sinCorreo.length, total: sinCorreo.reduce((s, c) => s + c.total, 0) },
    sinPagar: sinPagar,
    registros: contactos.slice().sort((a, b) => alta(b) - alta(a)).slice(0, 25)
      .map((f) => ({ correo: f[0], nombre: f[1], etiquetas: etiquetas_(f[2]), acepta: f[3] === true && !f[6], alta: f[4], ciudad: f[7] })),
    nuevos: { d7: contactos.filter((f) => alta(f) >= masDias_(hoy, -6).getTime()).length, d30: contactos.filter((f) => alta(f) >= masDias_(hoy, -29).getTime()).length,
      total: contactos.length },
    cuota: MailApp.getRemainingDailyQuota(), hoja: ss.getUrl(), auto: CARRITO.auto };
}

/* Cuántas personas entraron a la comunidad por cada puerta: el pop-up, el pie de
   página o la página de la gang. Sale de la bitácora Registros, que guarda lo que
   mandó la página. Los registros de antes del 10 de noviembre de 2026 no decían
   si venían del pop-up o del pie: quedan juntos como "comunidad, sin origen". */
function inscritos_(ss) {
  const hace7 = masDias_(new Date(), -6).getTime(), puertas = {};
  ["pop", "pie", "gang", "sin"].forEach((k) => { puertas[k] = { todos: {}, d7: {} }; });
  ss.getSheetByName(H_REGISTROS).getDataRange().getValues().slice(1).forEach((f) => {
    const tipo = String(f[1]), correo = String(f[2] || "").toLowerCase();
    if ((tipo !== "comunidad" && tipo !== "gang") || !correoValido_(correo)) return;
    let d = {};
    try { d = JSON.parse(f[3] || "{}"); } catch (e) {}
    if (d.consentimiento !== true) return;
    const k = tipo === "gang" ? "gang" : d.origen === "pop" || d.origen === "pie" ? d.origen : "sin";
    puertas[k].todos[correo] = true;
    if (new Date(f[0]).getTime() >= hace7) puertas[k].d7[correo] = true;
  });
  const r = {};
  Object.keys(puertas).forEach((k) => { r[k] = { total: Object.keys(puertas[k].todos).length, d7: Object.keys(puertas[k].d7).length }; });
  return r;
}

/* Borra la bitácora y los carritos y deja las cifras en cero. Es para arrancar
   limpio después de las pruebas de la casa: lo que se midió mientras se armaba
   la página no dice nada de los clientes.
   Toca SOLO las hojas de medir. Pedidos, contactos, bonos, suscripciones y
   stock se quedan como están: ahí hay ventas y correos de verdad.
   No tiene vuelta atrás desde aquí; si te arrepientes, la papelera de la Hoja
   de Google guarda el historial de versiones. */
function limpiar_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = libro_();
    let borradas = 0;
    [H_ACTIVIDAD, H_CARRITOS, H_VISITAS].forEach((nombre) => {
      const h = hojaDe_(ss, nombre), ultima = h.getLastRow();
      if (ultima > 1) { h.deleteRows(2, ultima - 1); borradas += ultima - 1; }
    });
    return json_({ ok: true, borradas: borradas });
  } finally { lock.releaseLock(); }
}

/* ---------- el recordatorio ----------
   Del carrito: es publicidad, así que solo le llega a quien marcó la casilla y
   no se ha dado de baja, una vez por carrito. Si esa persona tiene su bono de
   bienvenida sin usar, el correo se lo recuerda. No promete nada que no sea
   cierto: ni "quedan pocas" ni descuentos nuevos.
   Del pedido sin pagar: es un aviso sobre su propio pedido, también una sola vez. */
function recordarCarrito_(ss, c) {
  if (!correoValido_(c.correo)) return "sin-correo";
  if (c.recordado) return "ya";
  if (!aceptaCorreos_(ss, c.correo)) return "no-acepta";
  if (MailApp.getRemainingDailyQuota() < 1) return "cuota";
  const en = c.idioma === "en", hoy = dia_(new Date());
  const bono = hojaDe_(ss, H_BONOS).getDataRange().getValues().slice(1).find((f) => String(f[1]) === c.correo && !f[6] && dia_(f[4]) >= hoy);
  const lineas = c.items.map((i) => num_(i.n) + " × " + i.nom).join("\n");
  const enlace = SITIO + (en ? "/en/coffees" : "/cafes") + (bono ? "?bono=" + bono[0] : "");
  const texto = (en ? "You left this in your " + MARCA + " cart:" : "Dejaste esto en tu carrito de " + MARCA + ":") + "\n\n" + lineas + "\n\n" +
    (en ? "It is still there, in the same browser where you put it together." : "Sigue ahí, en el mismo navegador donde lo armaste.") +
    (bono ? "\n\n" + (en ? "And your " + bono[2] + " % welcome code " + bono[0] + " is still good until " + fecha_(bono[4], true) + ". The button applies it for you."
      : "Y tu bono " + bono[0] + " del " + bono[2] + " % sigue vigente hasta el " + fecha_(bono[4]) + ". El botón lo deja puesto.") : "");
  const cierre = en ? "Not sure which one to pick, or how to brew it? Reply and we help you. A real person reads it."
    : "¿Dudas de cuál escoger o cómo prepararlo? Respóndenos y te ayudamos. Del otro lado te lee una persona.";
  MailApp.sendEmail({ to: c.correo, name: MARCA, subject: en ? "Your coffee is still in the cart" : "Tu café sigue en el carrito",
    htmlBody: marco_(titulo_(en ? "Your coffee is " : "Tu café sigue ", en ? "still in the cart" : "en el carrito") + centrado_(texto) +
      boton_(enlace, en ? "Back to my cart" : "Volver a mi carrito") + centrado_(cierre, 15), pieComunidad_(c.correo, en)),
    body: texto + "\n" + enlace + "\n\n" + cierre + "\n\n—\n" + MARCA + "\n" + (en ? "Unsubscribe: " : "Para no recibir más correos: ") + enlaceBaja_(c.correo) });
  hojaDe_(ss, H_CARRITOS).getRange(c.fila, 9).setValue(new Date());
  return "enviado";
}
function recordarPedido_(ss, id) {
  const h = hojaDe_(ss, H_PEDIDOS), filas = h.getDataRange().getValues(), i = filas.findIndex((f, k) => k > 0 && String(f[0]) === String(id));
  if (i < 0) return "no";
  const f = filas[i], correo = String(f[4] || "");
  if (f[2] !== "cancelado" || !esPasarela_(f[13])) return "no-es-reserva";
  if (!correoValido_(correo)) return "sin-correo";
  if (/Recordado el /.test(String(f[18]))) return "ya";
  if (MailApp.getRemainingDailyQuota() < 1) return "cuota";
  const en = f[25] === "en";
  const texto = en
    ? "Your order " + f[0] + " was not paid, so we released the bags we were holding for you.\n\n" + f[7] +
      "\n\nStill want it? You can put it together again on the site. If the payment gave you trouble, reply to this email and we help you."
    : "Tu pedido " + f[0] + " no alcanzó a pagarse, así que soltamos las bolsas que te teníamos apartadas.\n\n" + f[7] +
      "\n\n¿Todavía lo quieres? Puedes armarlo otra vez en la página. Si el pago te dio problema, responde este correo y te ayudamos.";
  const enlace = SITIO + (en ? "/en/coffees" : "/cafes");
  MailApp.sendEmail({ to: correo, name: MARCA, subject: (en ? "Your order was not paid · " : "Tu pedido quedó sin pagar · ") + f[0],
    htmlBody: marco_(cuerpo_(texto) + boton_(enlace, en ? "Order again" : "Pedirlo otra vez"), pieServicio_(String(f[0]), en)),
    body: texto + "\n" + enlace + "\n\n—\n" + MARCA });
  h.getRange(i + 1, 19).setValue((f[18] ? f[18] + " " : "") + "Recordado el " + fecha_(new Date()) + ".");
  return "enviado";
}
function recordar_(d) {
  if (!d.clave || d.clave !== clave_()) return json_({ ok: false, error: "clave" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = libro_();
    let r;
    if (d.pedido) r = recordarPedido_(ss, d.pedido);
    else { const c = carritosQuietos_(ss).find((x) => x.v === String(d.carrito)); r = c ? recordarCarrito_(ss, c) : "no"; }
    return json_(r === "enviado" ? { ok: true, cuota: MailApp.getRemainingDailyQuota() } : { ok: false, error: r });
  } finally { lock.releaseLock(); }
}
/* Cada mañana: borra la bitácora vieja y, si CARRITO.auto está prendido, recuerda
   los carritos que llevan un día quietos. Devuelve cuántos esperan recordatorio. */
function carritosDiario_(ss) {
  const h = hojaDe_(ss, H_ACTIVIDAD), filas = h.getDataRange().getValues(), limite = masDias_(new Date(), -CARRITO.guardarDias);
  let viejas = 0;
  while (viejas + 1 < filas.length && filas[viejas + 1][0] && new Date(filas[viejas + 1][0]) < limite) viejas++;
  if (viejas) h.deleteRows(2, viejas);
  const porRecordar = carritosQuietos_(ss).filter((c) => c.correo && !c.recordado && aceptaCorreos_(ss, c.correo));
  if (!CARRITO.auto) return porRecordar.length;
  const ayer = Date.now() - 864e5;
  let quedan = 0;
  porRecordar.forEach((c) => { if (new Date(c.actualizado).getTime() > ayer || recordarCarrito_(ss, c) !== "enviado") quedan++; });
  return quedan;
}

/* ---------- lo que pide el panel, el bono y la baja ---------- */
function doGet(e) {
  const q = (e && e.parameter) || {};
  if (q.accion === "baja") return baja_(q);
  /* El stock no es secreto: la tienda lo pide al cargar, sin clave */
  /* "actividad: true" le dice a la página que este script ya recibe la bitácora */
  if (q.accion === "stock") return json_({ ok: true, stock: stockMapa_(libro_()), actividad: true, visitas: true, pop: true });
  /* la hoja Stock completa, con fechas, para la pestaña Stock del panel */
  if (q.accion === "existencias") {
    if (!q.clave || q.clave !== clave_()) return json_({ ok: false, error: "clave" });
    const ss = libro_();
    return json_({ ok: true, hoja: ss.getUrl(), existencias: hojaDe_(ss, H_STOCK).getDataRange().getValues().slice(1).filter((f) => f[0])
      .map((f) => ({ id: String(f[0]), nombre: f[1], stock: num_(f[2]), actualizado: f[3] })) });
  }
  if (q.accion === "actividad") {
    if (!q.clave || q.clave !== clave_()) return json_({ ok: false, error: "clave" });
    return json_(actividad_(q));
  }
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
        transportadora: f[16], guia: f[17], notas: f[18],
        documento: f[19], direccion: f[20], detalle: f[21], departamento: f[22], items: itemsDe_(f[23]), iva: f[24], idioma: f[25], transaccion: f[26] }));
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
      ? "Your first bag of " + MARCA + " is still waiting for you. The " + f[2] + " % you got when you joined " + COMUNIDAD + " ends in " + quedan + " days."
      : "Tu primera bolsa de " + MARCA + " sigue esperándote. El " + f[2] + " % que te dimos al entrar a " + COMUNIDAD + " vence en " + quedan + " días.";
    MailApp.sendEmail({ to: correo, name: MARCA, subject: en ? COMUNIDAD + ": your " + f[2] + " % ends in " + quedan + " days" : COMUNIDAD + ": tu " + f[2] + " % vence en " + quedan + " días",
      htmlBody: marco_(titulo_(en ? "Your " + f[2] + " % ends in " : "Tu " + f[2] + " % vence en ", quedan + (en ? " days" : " días")) + centrado_(texto) +
        codigoHtml_(String(f[0])) + boton_(enlace, en ? "Order my coffee" : "Pedir mi café") +
        productos_(en ? "Pick yours" : "Escoge el tuyo", String(f[0]), Number(f[2]) || BONO.pct, en), pieComunidad_(correo, en)),
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
  const carritos = carritosDiario_(ss);
  if (!porConfirmar.length && !porDespachar.length && !subs.length) return;
  const linea = (f) => "· " + f[0] + " · " + f[3] + " · " + f[6] + " · " + pesos_(f[11]) + "\n  " + String(f[7]).replace(/\n/g, "\n  ");
  const partes = [];
  if (porDespachar.length) partes.push("POR DESPACHAR (ya pagaron) · " + porDespachar.length + "\n" + porDespachar.map(linea).join("\n"));
  if (subs.length) partes.push("SUSCRIPCIONES QUE TOCAN · " + subs.length + "\n" + subs.map((f) =>
    "· " + (dia_(f[9]) < hoy ? "ATRASADA desde " : "") + fecha_(f[9]) + " · " + f[0] + " · " + f[1] + " · molienda " + f[5] + " · " + f[6]).join("\n"));
  if (porConfirmar.length) partes.push("POR CONFIRMAR EL PAGO · " + porConfirmar.length + "\n" + porConfirmar.map(linea).join("\n"));
  if (enEspera) partes.push(enEspera + " personas esperan que abra la suscripción.");
  if (carritos) partes.push(carritos + (carritos === 1 ? " carrito abandonado espera" : " carritos abandonados esperan") + " un recordatorio: panel interno, pestaña Actividad.");
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
const codigoHtml_ = (codigo) => '<p style="margin:8px 0 8px;padding:14px;border:2px dashed #C9381A;text-align:center;font:800 26px/1 \'Courier New\',monospace;letter-spacing:0.12em;color:#141210">' + esc_(codigo) + "</p>";
const boton_ = (url, txt) => '<p style="margin:18px 0 28px;text-align:center"><a href="' + esc_(url) + '" style="display:inline-block;background:#C9381A;color:#ffffff;text-decoration:none;font:700 15px Arial,sans-serif;letter-spacing:0.06em;text-transform:uppercase;padding:15px 30px;border-radius:6px">' + esc_(txt) + "</a></p>";
/* El título grande, centrado, con el nombre en la cursiva naranja de la página */
const titulo_ = (antes, nombre) => '<h1 style="margin:0 0 18px;text-align:center;font:400 30px/1.15 Georgia,\'Times New Roman\',serif;color:#141210">' +
  esc_(antes) + '<i style="color:#C9381A">' + esc_(nombre) + "</i></h1>";
const centrado_ = (texto, px) => '<div style="text-align:center;font-size:' + (px || 16) + 'px;color:' + (px && px < 15 ? "#6B645C" : "#141210") + '">' + cuerpo_(texto) + "</div>";
const lista_ = (titulo, items) => '<div style="margin:4px 0 28px;padding:22px 20px;background:#F5F0E6;border-radius:10px">' +
  '<p style="margin:0 0 12px;text-align:center;font:italic 20px/1.2 Georgia,serif;color:#141210">' + esc_(titulo) + "</p>" +
  items.map((x) => '<p style="margin:0 0 6px;text-align:center;font-size:14.5px;color:#141210"><span style="color:#C9381A">●</span>&nbsp; ' + esc_(x) + "</p>").join("") + "</div>";

/* ---------- el catálogo de la página ----------
   tools/build.js publica /data/catalogo.json con los cafés, su precio y su foto.
   El correo lo lee de ahí (guardado 6 horas): un precio nunca se copia a mano aquí.
   Si la página no responde, el correo sale igual, sin la vitrina. */
function catalogo_() {
  const cache = CacheService.getScriptCache(), guardado = cache.get("catalogo");
  if (guardado) return JSON.parse(guardado);
  try {
    const r = UrlFetchApp.fetch(SITIO + "/data/catalogo.json", { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return { productos: [], redes: {} };
    const j = JSON.parse(r.getContentText());
    cache.put("catalogo", JSON.stringify(j), 21600);
    return j;
  } catch (err) { return { productos: [], redes: {} }; }
}
/* La vitrina: dos por fila. El que está a la venta lleva su precio con el bono ya
   restado y un "Lo quiero" que abre la ficha con el bono puesto; el que viene en
   camino, "Próximamente" y un "Avísame". Nada de precios inventados. */
function productos_(titulo, codigo, pct, en) {
  const ps = (catalogo_().productos || []).slice(0, 4);
  if (!ps.length) return "";
  const L = en ? "en" : "es";
  const celda = (p) => {
    /* el bono sirve también para reservar: solo lo pierde quien ni siquiera puede pedir */
    const url = p.url[L] + (p.proximamente ? "" : "?bono=" + encodeURIComponent(codigo));
    const foto = p.foto
      ? '<img src="' + esc_(p.foto) + '" width="240" alt="' + esc_(p.nombre[L]) + '" style="display:block;width:100%;max-width:240px;height:auto;border-radius:8px;margin:0 auto">'
      : '<div style="padding:52px 12px;border-radius:8px;background:' + esc_(p.color) + ';color:#ffffff;font:italic 22px/1.2 Georgia,serif;text-align:center">' + esc_(p.nombre[L]) + "</div>";
    const rotulo = (txt) => '<p style="margin:0 0 12px;font:600 11px Arial,sans-serif;letter-spacing:0.14em;text-transform:uppercase;color:#C9381A">' + txt + "</p>";
    const conBono = '<p style="margin:0 0 12px;font-size:14px"><s style="color:#6B645C">' + pesos_(p.precio) + '</s>&nbsp; <b style="color:#141210">' + pesos_(p.precio * (1 - pct / 100)) + "</b></p>";
    /* Tres estados: el que ni se puede pedir, el que se reserva y se despacha
       el día del lanzamiento, y el que sale hoy mismo. */
    const precio = p.proximamente ? rotulo(en ? "Coming soon" : "Próximamente")
      : p.preventa ? rotulo(en ? "Pre-order" : "En preventa") + conBono
      : conBono;
    return '<td width="50%" valign="top" style="padding:0 8px 26px;text-align:center">' + foto +
      '<p style="margin:12px 0 2px;font:700 15px Arial,sans-serif;color:#141210">' + esc_(p.nombre[L]) + "</p>" +
      '<p style="margin:0 0 6px;font-size:12.5px;color:#6B645C">' + esc_(p.sale[L]) + " · " + p.gramos + " g</p>" + precio +
      '<a href="' + esc_(url) + '" style="display:inline-block;background:' + (p.proximamente ? "#ffffff;color:#141210;border:1px solid #141210" : "#141210;color:#ffffff") +
      ';text-decoration:none;font:700 12px Arial,sans-serif;letter-spacing:0.08em;text-transform:uppercase;padding:11px 20px;border-radius:6px">' +
      (p.proximamente ? (en ? "Notify me" : "Avísame") : p.preventa ? (en ? "Pre-order" : "Reservar") : (en ? "I want it" : "Lo quiero")) + "</a></td>";
  };
  let filas = "";
  /* si quedan en número impar, el último va solo y centrado */
  for (let i = 0; i < ps.length; i += 2) filas += "<tr>" + (ps[i + 1] ? celda(ps[i]) + celda(ps[i + 1])
    : '<td colspan="2" align="center"><table role="presentation" width="50%" cellpadding="0" cellspacing="0"><tr>' + celda(ps[i]).replace('width="50%" ', "") + "</tr></table></td>") + "</tr>";
  return '<div style="margin:0 -32px 24px;padding:28px 24px 4px;background:#F5F0E6">' +
    '<p style="margin:0 0 20px;text-align:center;font:italic 24px/1.2 Georgia,serif;color:#141210">' + esc_(titulo) + "</p>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + filas + "</table></div>";
}
const REDES_NOMBRE = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", tiktok: "TikTok" };
const redes_ = () => {
  const r = catalogo_().redes || {}, ks = Object.keys(r).filter((k) => r[k]);
  return ks.length ? '<p style="margin:28px 0 0;text-align:center;font:700 11px Arial,sans-serif;letter-spacing:0.14em;text-transform:uppercase">' +
    ks.map((k) => '<a href="' + esc_(r[k]) + '" style="color:#C9381A;text-decoration:none">' + (REDES_NOMBRE[k] || k) + "</a>").join('&nbsp;&nbsp;·&nbsp;&nbsp;') + "</p>" : "";
};
const pieComunidad_ = (correo, en) => (en ? "You get this email because you joined the " + COMUNIDAD + " community. " : "Recibes este correo porque te uniste a la comunidad " + COMUNIDAD + ". ") +
  '<a href="' + enlaceBaja_(correo) + '" style="color:#6B645C">' + (en ? "Unsubscribe" : "Darme de baja") + "</a>.";
const pieServicio_ = (ref, en) => (en ? "You get this email about your " : "Recibes este correo por tu ") + esc_(ref) + ". " + (en ? "Questions? Just reply." : "¿Dudas? Responde este correo.");
/* El logo de la página, en PNG (img/correo/logo.png): si el correo no carga
   imágenes, queda el texto NANDEZ COFFEE GANG en naranja. */
function marco_(html, pie) {
  return '<div style="background:#F5F0E6;padding:32px 12px">' +
    '<div style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #E5DED0;border-radius:12px;padding:32px;font:16px/1.6 Arial,sans-serif;color:#141210;overflow:hidden">' +
    '<p style="margin:0 0 26px;text-align:center"><a href="' + SITIO + '" style="text-decoration:none">' +
    '<img src="' + SITIO + '/img/correo/logo.png" width="180" alt="NANDEZ COFFEE GANG" style="width:180px;height:auto;border:0;font:800 22px Arial,sans-serif;color:#C9381A"></a></p>' + html +
    redes_() +
    '<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #E5DED0;text-align:center;font-size:12px;color:#6B645C">' + pie + "</p></div></div>";
}
const plantilla_ = (texto, correo) => marco_(cuerpo_(texto), pieComunidad_(correo, false));

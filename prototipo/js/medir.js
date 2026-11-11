/* ============================================================
   MEDICIÓN · píxel de Meta y Google Analytics
   Para qué: sin esto, Meta no sabe a quién mostrarle el anuncio ni cuántas
   ventas trajo, y quien visita sin comprar se pierde para siempre.

   Dos reglas que gobiernan todo este archivo:

   1. Nada se carga, se guarda ni se envía hasta que la persona lo autoriza.
      La Ley 1581 pide autorización previa y expresa para la publicidad, y un
      píxel de Meta es justamente eso. Sin permiso, la tienda funciona igual y
      no sale un solo dato.
   2. Mientras CONFIG.medicion no tenga identificadores, esto no hace nada:
      ni carga, ni pregunta, ni pinta el aviso. Así la página no molesta con
      un banner de cookies cuando todavía no hay cookies que pedir.

   Los identificadores se consiguen en Meta Business (el del píxel, 15 o 16
   dígitos) y en Google Analytics (el de medición, G-XXXXXXXXXX), y van en
   CONFIG.medicion (prototipo/js/core.js). La API de conversiones —la que
   recupera las compras que el navegador pierde— va aparte, en el servidor,
   cuando Wompi confirma el pago.

   Además del píxel hay una bitácora propia: los mismos eventos, y el carrito
   que cada visitante tiene armado, van a la Hoja de Google de Nandez y se ven
   en el panel interno, pestaña Actividad. Es lo que deja saber quién dejó un
   carrito a medias para recordárselo. Obedece las mismas dos reglas: nada sale
   sin el "Aceptar", y no hace nada mientras el script de la hoja no diga que
   la recibe (tools/correos/Codigo.gs responde "actividad: true" con el stock).
   ============================================================ */

const MED_KEY = "nandez-medicion";
/* ---------- no medirnos a nosotros mismos ----------
   Las visitas de quien hace la página ensucian las cifras: diez vueltas
   probando el carrito se ven igual que diez clientes interesados. Abrir la
   página una vez con ?nocontar marca ESE navegador como interno y desde ahí no
   se anota nada, ni en la hoja ni en Meta; con ?nocontar=no vuelve a contar.
   La marca vive en el navegador, así que hay que hacerlo en cada equipo y en
   cada navegador que se use para probar (y se pierde al borrar los datos del
   sitio). En Meta, además, conviene excluir la IP de la casa: Administrador de
   eventos → Configuración → Tráfico interno. */
const INTERNO_KEY = "nandez-interno";
const esInterno = () => { try { return localStorage.getItem(INTERNO_KEY) === "1"; } catch { return false; } };
/* propia: null mientras no se sabe si la hoja recibe la bitácora; después, sí o no */
const M = { listo: false, cola: [], propia: null, cuentaVisitas: false };

const medicionAjena = () => !!(CONFIG.medicion && (CONFIG.medicion.metaPixel || CONFIG.medicion.ga4));
const propiaPosible = () => !!CONFIG.registro && !!CONFIG.medicion && CONFIG.medicion.propia !== false;
const medicionHayQuePedir = () => !esInterno() && (medicionAjena() || M.propia === true);
/* mientras la hoja no ha respondido, lo que pase se guarda en la cola por si acaso */
const medicionPuede = () => !esInterno() && (medicionHayQuePedir() || (M.propia === null && propiaPosible()));
function medicionPermiso() {
  try { return localStorage.getItem(MED_KEY); } catch { return null; }
}
function medicionGuardar(v) {
  try { localStorage.setItem(MED_KEY, v); } catch {}
}

/* Los dos scripts, cargados solo cuando ya hay permiso. */
function medicionCargar() {
  if (M.listo || !medicionHayQuePedir()) return;
  M.listo = true;
  const { metaPixel, ga4 } = CONFIG.medicion;

  if (metaPixel) {
    /* el arranque que pide Meta, con su propia cola interna */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", metaPixel);
    window.fbq("track", "PageView");
  }

  if (ga4) {
    const s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga4);
  }

  bitacoraArranque();
  /* lo que pasó mientras la persona decidía */
  const cola = M.cola.splice(0);
  cola.forEach(([ev, datos]) => medir(ev, datos));
}

/* ---------- la bitácora propia ----------
   El visitante es un número al azar que se crea al aceptar: no dice quién es.
   El correo solo viaja si la persona ya lo dejó en esta página (se unió a la
   comunidad o hizo un pedido desde este navegador). */
const VIS_KEY = "nandez-visita", CORREO_KEY = "nandez-correo";
function visitante() {
  try {
    let v = localStorage.getItem(VIS_KEY);
    if (!v) { v = (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 16); localStorage.setItem(VIS_KEY, v); }
    return v;
  } catch { return ""; }
}
function correoConocido() {
  try { return (typeof popMiembro === "function" && popMiembro()) || localStorage.getItem(CORREO_KEY) || ""; } catch { return ""; }
}
function recordarCorreo(correo) { try { if (correo) localStorage.setItem(CORREO_KEY, correo); } catch {} }
const bitacoraActiva = () => !esInterno() && M.propia === true && M.listo && medicionPermiso() === "si";
function bitacoraEnviar(cuerpo) {
  const v = visitante(); if (!v) return;
  /* texto plano, como los demás registros: sin permiso previo de CORS */
  try {
    fetch(CONFIG.registro, { method: "POST", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...cuerpo, v, correo: correoConocido(), idioma: UI.lang }) }).catch(() => {});
  } catch {}
}
function bitacora(evento, datos) {
  if (!bitacoraActiva()) return;
  bitacoraEnviar({ tipo: "evento", evento, detalle: datos.nombre || datos.pedido || "", valor: Number(datos.valor) || 0, pagina: location.pathname });
  /* si acaba de dejar el correo y ya tenía carrito, ese carrito ya tiene dueño */
  if (evento === "registro" && UI.carrito.length) bitacoraCarrito();
}
/* El carrito, cada vez que cambia. Espera unos segundos para no mandar cada clic
   del "+"; al comprar se manda de una, marcado como comprado. */
let carritoEspera = null;
function bitacoraCarrito(comprado) {
  if (!bitacoraActiva()) return;
  clearTimeout(carritoEspera);
  const items = UI.carrito.map((i) => ({ id: i.id, g: i.g, n: i.n, nombre: i.nombre, precio: i.precio }));
  const manda = () => bitacoraEnviar({ tipo: "carrito", items, comprado: comprado === true });
  if (comprado === true) manda(); else carritoEspera = setTimeout(manda, 4000);
}
/* Lo primero que se anota: la visita (una vez por pestaña, no en cada recarga)
   y el carrito que ya venía armado de otro día. */
/* ---------- la cuenta de visitas ----------
   Una línea a la hoja que dice «hoy entró alguien más». Sin visitante, sin
   correo, sin qué miró: no identifica a nadie, así que no necesita el permiso
   de cookies y se manda también a quien dice que no. Es la única cifra que se
   puede comparar con «Visitas a la página de destino» de Meta; el embudo de al
   lado cuenta solo a quien aceptó, y siempre serán menos.
   Una vez por pestaña, no por recarga: la marca va en sessionStorage, que se
   borra al cerrarla y no sirve para reconocer a nadie después. */
const LLEGADA_KEY = "nandez-llegada";
function contarLlegada() {
  /* M.cuentaVisitas lo enciende la hoja al responder el stock: un script viejo
     no sabría qué es una "llegada" y la anotaría como un registro cualquiera. */
  if (!M.cuentaVisitas || esInterno() || !CONFIG.registro || !propiaPosible()) return;
  try {
    if (sessionStorage.getItem(LLEGADA_KEY)) return;
    sessionStorage.setItem(LLEGADA_KEY, "1");
  } catch { return; }   /* sin sessionStorage no se cuenta, antes que contar de más */
  try {
    fetch(CONFIG.registro, { method: "POST", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ tipo: "llegada" }) }).catch(() => {});
  } catch {}
}

function bitacoraArranque() {
  if (!bitacoraActiva()) return;
  try { if (!sessionStorage.getItem(VIS_KEY)) { sessionStorage.setItem(VIS_KEY, "1"); bitacora("visita", {}); } } catch {}
  if (UI.carrito.length) bitacoraCarrito();
}
/* La hoja respondió: ya se sabe si recibe la bitácora. Si la recibe, es el
   momento de preguntar (o de arrancar, si la persona ya había dicho que sí). */
function medicionPropia(si, cuentaVisitas) {
  M.cuentaVisitas = !!cuentaVisitas;
  contarLlegada();   /* no depende del permiso: no lleva nada de nadie */
  if (M.propia !== null) return;
  M.propia = !!si && propiaPosible();
  if (!medicionHayQuePedir()) { M.cola.length = 0; return; }
  medicionAviso();
  bitacoraArranque();   /* por si el píxel ya había arrancado antes de que la hoja respondiera */
}

/* Un evento, dicho una vez, en el nombre que cada quien entiende.
   Si todavía no hay permiso se guarda en la cola: si lo da, se envía; si no,
   se descarta al cerrar la página y nunca salió de aquí. */
const MED_NOMBRES = {
  ver: ["ViewContent", "view_item"],
  agregar: ["AddToCart", "add_to_cart"],
  pagar: ["InitiateCheckout", "begin_checkout"],
  compra: ["Purchase", "purchase"],
  registro: ["Lead", "generate_lead"],
};
function medir(evento, datos = {}) {
  if (!medicionPuede()) return;
  const par = MED_NOMBRES[evento]; if (!par) return;
  if (!M.listo) { if (M.cola.length < 20) M.cola.push([evento, datos]); return; }
  /* La ficha del café se vuelve a pintar con cada clic (agregar al carrito,
     cambiar de presentación): sin esto, Meta contaría varios ViewContent por
     una sola visita a la ficha. El mismo café seguido se cuenta una vez. */
  if (evento === "ver") { if (M.visto === datos.nombre) return; M.visto = datos.nombre; }
  bitacora(evento, datos);
  const [meta, google] = par;
  const valor = Number(datos.valor) || 0;
  /* El número del pedido va como order_id: es lo que deja a Meta contar una sola
     compra el día que el mismo pago llegue también desde el servidor (la API de
     conversiones). Google pide lo mismo con otro nombre, transaction_id. */
  if (window.fbq) window.fbq("track", meta, {
    content_name: datos.nombre || "", content_ids: datos.ids || [], content_type: "product",
    value: valor, currency: "COP", ...(datos.n ? { num_items: datos.n } : {}),
    ...(datos.pedido ? { order_id: datos.pedido } : {}),
  });
  if (window.gtag) window.gtag("event", google, {
    currency: "COP", value: valor,
    ...(datos.pedido ? { transaction_id: datos.pedido } : {}),
    ...(datos.ids ? { items: datos.ids.map((id) => ({ item_id: id })) } : {}),
  });
}

/* Lee ?nocontar y deja el navegador marcado (o lo desmarca). Se llama antes que
   todo lo demás, para que ni siquiera la visita de esa carga se anote. Avisa en
   pantalla: sin confirmación no se sabría si quedó puesto. */
function internoVigilar() {
  let q;
  try { q = new URLSearchParams(location.search); } catch { return; }
  if (!q.has("nocontar")) return;
  const apagar = q.get("nocontar") === "no";
  try {
    if (apagar) localStorage.removeItem(INTERNO_KEY);
    else localStorage.setItem(INTERNO_KEY, "1");
  } catch {}
  /* la dirección vuelve a quedar limpia: el parámetro no tiene que verse ni compartirse */
  try { history.replaceState(history.state, "", location.pathname + location.hash); } catch {}
  const en = UI.lang === "en";
  setTimeout(() => toast(apagar
    ? (en ? "This browser counts again in the stats." : "Este navegador vuelve a contar en las cifras.")
    : (en ? "Done: nothing from this browser will be measured." : "Listo: nada de lo que hagas en este navegador se va a medir.")), 400);
}

/* ---------- el aviso de cookies ----------
   Una franja abajo, con las dos opciones igual de visibles: un "aceptar"
   grande y un "no" escondido no es una autorización libre. */
function medicionAviso() {
  if (!medicionHayQuePedir()) return;
  const ya = medicionPermiso();
  if (ya === "si") return medicionCargar();
  if (ya === "no") return;
  if ($("#cookies")) return;
  const en = UI.lang === "en";
  /* el aviso dice lo que de verdad se va a usar: lo propio, lo de Meta y Google, o las dos cosas */
  /* El aviso, en la fórmula corta que usa casi toda la web: qué se usa, para
     qué, y el enlace. Dice «de terceros» en vez de nombrar a Meta y Google —
     ahí están, con nombre y apellido, en la política que enlaza— y no promete
     nada que la página no haga: aquí no hay contenidos personalizados.
     Lo que no se toca: los dos botones pesan igual y «Aceptar» no se adelanta
     con ningún truco. Una autorización arrancada no vale, ni ante la ley ni
     ante quien después recibe un correo que no pidió. */
  const ajena = medicionAjena(), propia = M.propia === true;
  const que = en
    ? (ajena ? "We use our own and third-party cookies to " : "We use a cookie of our own to ")
      + (propia ? "remember your cart, improve your experience and analyse traffic on the shop." : "analyse traffic on the shop.")
    : (ajena ? "Usamos cookies propias y de terceros para " : "Usamos una cookie propia para ")
      + (propia ? "recordar tu carrito, mejorar tu experiencia y analizar el tráfico de la tienda." : "analizar el tráfico de la tienda.");
  const el = document.createElement("aside");
  el.className = "cookies"; el.id = "cookies";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", en ? "Cookies" : "Cookies");
  el.innerHTML = `<p>${en
    ? `${que} <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">See the cookie policy</a>.`
    : `${que} <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">Ver la política de cookies</a>.`}</p>
    <div class="cookies-btn">
      <button class="btn" data-act="cookies-no">${en ? "Only what's essential" : "Solo lo necesario"}</button>
      <button class="btn primary" data-act="cookies-si">${en ? "Accept" : "Aceptar"}</button>
    </div>`;
  document.body.append(el);
}
function cookiesResponder(si) {
  medicionGuardar(si ? "si" : "no");
  $("#cookies")?.remove();
  /* el pie de la pantalla se liberó: si el pop-up estaba subido, vuelve al centro */
  if (typeof popPiso === "function") popPiso();
  if (si) medicionCargar();
}

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
/* propia: null mientras no se sabe si la hoja recibe la bitácora; después, sí o no */
const M = { listo: false, cola: [], propia: null };

const medicionAjena = () => !!(CONFIG.medicion && (CONFIG.medicion.metaPixel || CONFIG.medicion.ga4));
const propiaPosible = () => !!CONFIG.registro && !!CONFIG.medicion && CONFIG.medicion.propia !== false;
const medicionHayQuePedir = () => medicionAjena() || M.propia === true;
/* mientras la hoja no ha respondido, lo que pase se guarda en la cola por si acaso */
const medicionPuede = () => medicionHayQuePedir() || (M.propia === null && propiaPosible());
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
const bitacoraActiva = () => M.propia === true && M.listo && medicionPermiso() === "si";
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
  /* la ficha se vuelve a pintar con cada clic: el mismo café seguido cuenta una vez */
  if (evento === "ver") { if (M.visto === datos.nombre) return; M.visto = datos.nombre; }
  bitacoraEnviar({ tipo: "evento", evento, detalle: datos.nombre || "", valor: Number(datos.valor) || 0, pagina: location.pathname });
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
function bitacoraArranque() {
  if (!bitacoraActiva()) return;
  try { if (!sessionStorage.getItem(VIS_KEY)) { sessionStorage.setItem(VIS_KEY, "1"); bitacora("visita", {}); } } catch {}
  if (UI.carrito.length) bitacoraCarrito();
}
/* La hoja respondió: ya se sabe si recibe la bitácora. Si la recibe, es el
   momento de preguntar (o de arrancar, si la persona ya había dicho que sí). */
function medicionPropia(si) {
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
  bitacora(evento, datos);
  const [meta, google] = par;
  const valor = Number(datos.valor) || 0;
  if (window.fbq) window.fbq("track", meta, {
    content_name: datos.nombre || "", content_ids: datos.ids || [], content_type: "product",
    value: valor, currency: "COP", ...(datos.n ? { num_items: datos.n } : {}),
  });
  if (window.gtag) window.gtag("event", google, {
    currency: "COP", value: valor,
    ...(datos.ids ? { items: datos.ids.map((id) => ({ item_id: id })) } : {}),
  });
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
  const ajena = medicionAjena(), propia = M.propia === true;
  const que = en
    ? (propia ? "We would like to measure how this page is used and remember the cart you put together, " + (ajena ? "with our own cookies and Meta and Google ones, to know which of our ads are worth it" : "with a cookie of our own")
              : "We would like to measure how this page is used, with Meta and Google cookies, to know which of our ads are worth it")
    : (propia ? "Queremos medir cómo se usa esta página y recordar el carrito que armes, " + (ajena ? "con cookies propias y de Meta y Google, para saber cuáles de nuestros anuncios valen la pena" : "con una cookie propia")
              : "Queremos medir cómo se usa esta página, con cookies de Meta y Google, para saber cuáles de nuestros anuncios valen la pena");
  const el = document.createElement("aside");
  el.className = "cookies"; el.id = "cookies";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", en ? "Cookies" : "Cookies");
  el.innerHTML = `<p>${en
    ? `${que}. Nothing is measured until you say yes. <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">Privacy policy</a>.`
    : `${que}. No se mide nada hasta que digas que sí. <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">Política de privacidad</a>.`}</p>
    <div class="cookies-btn">
      <button class="btn" data-act="cookies-no">${en ? "Only what's essential" : "Solo lo necesario"}</button>
      <button class="btn primary" data-act="cookies-si">${en ? "Accept" : "Aceptar"}</button>
    </div>`;
  document.body.append(el);
}
function cookiesResponder(si) {
  medicionGuardar(si ? "si" : "no");
  $("#cookies")?.remove();
  if (si) medicionCargar();
}

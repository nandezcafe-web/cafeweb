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
   ============================================================ */

const MED_KEY = "nandez-medicion";
const M = { listo: false, cola: [] };

const medicionHayQuePedir = () => !!(CONFIG.medicion && (CONFIG.medicion.metaPixel || CONFIG.medicion.ga4));
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

  /* lo que pasó mientras la persona decidía */
  const cola = M.cola.splice(0);
  cola.forEach(([ev, datos]) => medir(ev, datos));
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
  if (!medicionHayQuePedir()) return;
  const par = MED_NOMBRES[evento]; if (!par) return;
  if (!M.listo) { if (M.cola.length < 20) M.cola.push([evento, datos]); return; }
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
  const el = document.createElement("aside");
  el.className = "cookies"; el.id = "cookies";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", en ? "Cookies" : "Cookies");
  el.innerHTML = `<p>${en
    ? `We would like to measure how this page is used, with Meta and Google cookies, to know which of our ads are worth it. Nothing is measured until you say yes. <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">Privacy policy</a>.`
    : `Queremos medir cómo se usa esta página, con cookies de Meta y Google, para saber cuáles de nuestros anuncios valen la pena. No se mide nada hasta que digas que sí. <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">Política de privacidad</a>.`}</p>
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

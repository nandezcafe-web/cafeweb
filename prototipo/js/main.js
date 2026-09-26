/* ============================================================
   INICIO, navegación, idioma y eventos de la página pública
   ============================================================ */
function viewInicio() {
  const en = UI.lang === "en", a = UI.au;
  const p = S.productos.find((x) => x.destacado) || S.productos[0];
  const valor = en
    ? [["Every coffee has a grower", "Not just “Colombian coffee”: the coffee of one farm and one harvest, and we tell you who planted it."],
       ["We tell you what we know", "Altitude, variety, process and score say who checked them and when. What we could not check, we tell you too."],
       ["We pay our neighbours well", "We go to the farm, pay cash and above the price the Coffee Growers Federation publishes that day."],
       ["The best is kept apart", "Each neighbouring farm grows its own variety. When a lot comes out truly special, it goes to the auction instead of a bag."]]
    : [["Cada café tiene quién lo sembró", "No es “café colombiano” sin más: es el café de una finca y de una cosecha, y te decimos quién lo sembró."],
       ["Te contamos lo que sabemos", "La altura, la variedad, el proceso y el puntaje dicen quién los revisó y cuándo. Lo que no hemos podido comprobar, también te lo decimos."],
       ["Le pagamos bien al vecino", "Vamos a la finca, pagamos de contado y por encima del precio que publica ese día la Federación de Cafeteros."],
       ["Lo mejor se guarda aparte", "Cada finca vecina tiene su variedad. Cuando un lote sale especial de verdad, no va a la bolsa: va a la subasta."]];
  const pasos = en
    ? [["We visit", "Yield factor, moisture and the day’s price, in hand."], ["We buy above the reference", "Cash, at the farm."],
       ["Milling and roasting", "Parchment to green, then roasted to taste of its origin."], ["Name and bag", "Each bag says which farm it came from."],
       ["Your cup", "15 g, 250 ml, 93 °C."]]
    : [["Visitamos", "Con el factor, la humedad y el precio del día en la mano."], ["Compramos por encima de la referencia", "De contado, en la finca."],
       ["Trilla y tueste", "De pergamino a verde, y tostado para que sepa a su origen."], ["Nombre y empaque", "Cada bolsa dice de qué finca salió."],
       ["Tu taza", "15 g, 250 ml, 93 °C."]];
  return `
  <section class="hero">
    <div>
      <p class="eyebrow reveal">${esc(CONFIG.marca)} · ${esc(tx(CONFIG.lugar))}</p>
      <h1 class="reveal" style="--i:1">${en ? "Coffee with<br><em>a first name.</em>" : "Café con<br><em>nombre propio.</em>"}</h1>
      <p class="lede reveal" style="--i:2">${en
        ? "We are a coffee-growing family from Chinácota. Farm by farm, we choose the best lots in Norte de Santander and roast them under our name: every bag says who grew it, how high it grew and how it tastes."
        : "Somos una familia cafetera de Chinácota. Escogemos, finca por finca, los mejores lotes de Norte de Santander y los tostamos con nuestra marca: cada bolsa dice quién lo cultivó, a qué altura creció y a qué sabe."}</p>
      <div class="cta reveal" style="--i:3">
        <button class="btn primary lg" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button>
        <button class="btn lg" data-act="cafe" data-id="${p.id}">${esc(tx(p.nombre))} · ${cop(principal(p).precio)}</button>
      </div>
      <p class="hint hero-b2b reveal" style="--i:4">${en ? "Café or roaster?" : "¿Cafetería o tostador?"} <a href="${ruta("cafes")}#cafeterias" data-act="go" data-to="cafes">${en ? "Prices by the kilo" : "Precios por kilo"}</a> · <a href="${ruta("subasta")}" data-act="go" data-to="subasta"><span class="live-dot ${a.ended ? "off" : ""}"></span> ${en ? "Green coffee auction" : "Subasta de café verde"}</a></p>
    </div>
    <div class="hero-art reveal" style="--i:2">
      <div class="hero-card" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
        <div class="hc-top"><span class="kicker">${esc(tr(fincaDe(p).finca || ""))}, ${esc(fincaDe(p).municipio || "")}</span><span class="state st-publicado">${gramos(principal(p).g)}</span></div>
        <p class="hc-title">${esc(tr(p.variedad))}<br><em>${esc(tr(p.proceso))}</em></p>
        <p class="hc-score">${esc(p.puntaje)}<small>SCA</small></p>
        <div class="hc-ridge dark-art">${ridge(p, { w: 420, h: 180, dark: true })}</div>
      </div>
      <div class="float-chip" style="--x:-6%;--y:66%;--d:0s"><i style="--c:var(--leaf)"></i><span>${en ? "Altitude" : "Altitud"} <b>${msnm(p.altitud)}</b></span><small>${en ? "verified · GPS" : "verificado · GPS"}</small></div>
      <div class="float-chip" style="--x:58%;--y:24%;--d:-2s"><i style="--c:var(--leaf)"></i><span>${en ? "Score" : "Puntaje"} <b>${esc(p.puntaje)}</b></span><small>${en ? "verified · Q-grader" : "verificado · Q-grader"}</small></div>
      <div class="float-chip" style="--x:54%;--y:84%;--d:-4s"><i style="--c:var(--cherry)"></i><span>${en ? "Bag" : "Bolsa"} <b>${cop(principal(p).precio)}</b></span><small>${gramos(principal(p).g)} · ${esc(tx(saleDe(p, principal(p)))).toLowerCase()}</small></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${en ? "This harvest" : "Esta cosecha"}</p>
      <h2>${en ? "What we have <em>at home</em>" : "Lo que tenemos <em>en casa</em>"}</h2>
      <p>${en ? "A few coffees, chosen one by one. Each comes from a neighbouring farm, and the truly special lot we keep for the auction."
        : "Pocos cafés, escogidos uno por uno. Cada uno viene de una finca vecina, y el lote que sale muy especial lo guardamos para la subasta."}</p></div>
    <div class="dos">${S.productos.map((x, i) => cafeCard(x, i)).join("")}${subastaCard(S.productos.length)}</div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${en ? "How we work" : "Cómo trabajamos"}</p>
      <h2>${en ? "How the coffee reaches <em>your table</em>" : "Así llega el café <em>a tu mesa</em>"}</h2></div>
    <div class="valor">${valor.map(([tt, d], i) => `<div class="val" style="--i:${i}"><b>${tt}</b><span>${d}</span></div>`).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${en ? "The neighbours" : "Los vecinos"}</p>
      <h2>${en ? "The farms <em>it comes from</em>" : "Las fincas <em>de donde viene</em>"}</h2>
      <p>${en ? "Today we roast coffee from neighbouring farms. Our own first harvest comes in 2027, and we will keep buying from them."
        : "Hoy tostamos café de fincas vecinas. En 2027 sale la primera cosecha de la nuestra, y les vamos a seguir comprando a ellos."}</p></div>
    <div class="fincas">${S.fincas.map((f, i) => fincaCard(f, i)).join("")}</div>
  </section>

  <section class="section cinta">
    <p class="eyebrow">${en ? "From the farm to the bag" : "De la finca a la bolsa"}</p>
    <div class="cinta-pasos">${pasos.map(([tt, d], i) => `<div class="cp"><span class="n">${i + 1}</span><b>${esc(tt)}</b><small>${esc(d)}</small></div>`).join("")}</div>
  </section>

  <section class="section faqs">
    <div class="section-head"><p class="eyebrow">${en ? "Questions" : "Preguntas"}</p>
      <h2>${en ? "What people <em>ask us</em>" : "Lo que <em>nos preguntan</em>"}</h2></div>
    <div class="faq-lista">${FAQ.map((f, i) => `<details class="faq" ${i === 0 ? "open" : ""}><summary><h3>${esc(tx(f.q))}</h3></summary><p>${esc(tx(f.a))}</p></details>`).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${t("nav_suscripcion")}</p>
      <h2>${en ? "If you like it, <em>we bring it every month</em>" : "Si te gusta, <em>te lo llevamos cada mes</em>"}</h2>
      <p>${en ? `From ${cop(S.planes[0].precio)} a month, shipping included.` : `Desde ${cop(S.planes[0].precio)} al mes, con el envío incluido.`}</p></div>
    <div class="cta"><button class="btn primary" data-act="go" data-to="suscripcion">${en ? "See the plans" : "Ver los planes"}</button>
      <button class="btn" data-act="go" data-to="diario">${en ? "Read the journal" : "Leer el diario"}</button></div>
  </section>`;
}

const FOOT = () => {
  const en = UI.lang === "en";
  const links = [["contacto", en ? "Contact" : "Contacto"], ["envios", en ? "Shipping and returns" : "Envíos y devoluciones"],
    ["terminos", en ? "Terms" : "Términos"], ["privacidad", en ? "Privacy" : "Datos personales"]];
  return `<footer class="foot">
  <div class="foot-marca"><b>${esc(CONFIG.marca)}</b><span>Chinácota · ${esc(tx(CONFIG.lugar))}</span>
    <a href="mailto:${CONFIG.correo}">${esc(CONFIG.correo)}</a>${CONFIG.whatsapp ? `<a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">WhatsApp +${CONFIG.whatsapp}</a>` : ""}</div>
  <nav class="foot-links" aria-label="${en ? "Information" : "Información"}">${links.map(([v, txt]) => `<a href="${ruta(v)}" data-act="go" data-to="${v}">${txt}</a>`).join("")}</nav>
  <small class="foot-nota">${en ? "Prototype with example data: photos, texts and prices to be confirmed." : "Prototipo con datos de ejemplo: fotos, textos y precios por confirmar."}</small>
  ${demo() ? `<button class="btn sm" data-act="reset-demo">${en ? "Reset demo data" : "Reiniciar datos de la demo"}</button>` : ""}</footer>`;
};

const VIEWS = { inicio: viewInicio, cafes: viewCafes, cafe: viewCafe, subasta: viewSubasta, suscripcion: viewSuscripcion, diario: viewDiario, entrada: viewEntrada,
  contacto: viewContacto, envios: viewEnvios, terminos: viewTerminos, privacidad: viewPrivacidad };

function actualizarMeta() {
  const id = UI.view === "cafe" ? UI.cafe : UI.view === "entrada" ? UI.entrada : null;
  const M = meta(UI.view, id), url = CONFIG.sitio + ruta(UI.view, id);
  document.title = M.t;
  const set = (sel, attr, val) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, val); };
  set('meta[name="description"]', "content", M.d);
  set('link[rel="canonical"]', "href", url);
  set('meta[property="og:title"]', "content", M.t);
  set('meta[property="og:description"]', "content", M.d);
  set('meta[property="og:url"]', "content", url);
  set('meta[property="og:locale"]', "content", UI.lang === "en" ? "en_US" : "es_CO");
  set('link[rel="alternate"][hreflang="es"]', "href", CONFIG.sitio + ruta(UI.view, id, "es"));
  set('link[rel="alternate"][hreflang="en"]', "href", CONFIG.sitio + ruta(UI.view, id, "en"));
  const ld = document.getElementById("ld-json");
  if (ld) ld.textContent = JSON.stringify(datosEstructurados(UI.view, id));
}

/* Datos estructurados: lo que leen Google y los asistentes de IA */
function datosEstructurados(view, id) {
  const org = {
    "@type": "Organization", "@id": CONFIG.sitio + "/#organizacion", name: CONFIG.marca, url: CONFIG.sitio,
    email: CONFIG.correo, address: { "@type": "PostalAddress", addressRegion: "Norte de Santander", addressCountry: "CO" },
    description: meta("inicio").d,
  };
  const grafo = [org, { "@type": "WebSite", "@id": CONFIG.sitio + "/#sitio", url: CONFIG.sitio, name: CONFIG.marca, publisher: { "@id": org["@id"] }, inLanguage: UI.lang }];
  if (view === "inicio") grafo.push({ "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: tx(f.q), acceptedAnswer: { "@type": "Answer", text: tx(f.a) } })) });
  if (view === "cafe" || view === "cafes") {
    (view === "cafe" ? [prodById(id) || S.productos[0]] : S.productos).forEach((p) => {
      const f = fincaDe(p);
      grafo.push({
        "@type": "Product", name: tx(p.nombre), description: meta("cafe", p.id).d,
        brand: { "@id": org["@id"] }, category: UI.lang === "en" ? "Specialty coffee" : "Café de especialidad",
        additionalProperty: [
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Variety" : "Variedad", value: p.variedad },
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Process" : "Proceso", value: p.proceso },
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Altitude" : "Altitud", value: p.altitud + " msnm" },
          { "@type": "PropertyValue", name: "SCA", value: String(p.puntaje) },
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Farm" : "Finca", value: (f.finca || "") + ", " + (f.municipio || "") },
        ],
        offers: p.variantes.map((v) => ({ "@type": "Offer", name: gramos(v.g), price: v.precio, priceCurrency: "COP",
          availability: v.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: CONFIG.sitio + ruta("cafe", p.id) })),
      });
    });
  }
  if (view === "entrada") {
    const e = S.entradas.find((x) => x.id === id) || S.entradas[0];
    grafo.push({ "@type": "Article", headline: tx(e.titulo), description: tx(e.resumen), datePublished: e.fecha,
      dateModified: e.fecha, author: { "@id": org["@id"] }, publisher: { "@id": org["@id"] }, inLanguage: UI.lang });
  }
  if (view === "subasta") grafo.push({ "@type": "Event", name: (UI.lang === "en" ? "Geisha coffee auction · " : "Subasta de café Geisha · ") + AU_LOTE.productor, startDate: new Date(UI.au.endsAt - 7 * 24 * 3600 * 1000).toISOString(), endDate: new Date(UI.au.endsAt).toISOString(),
    description: meta("subasta").d, eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: CONFIG.sitio + ruta("subasta") }, organizer: { "@id": org["@id"] } });
  return { "@context": "https://schema.org", "@graph": grafo };
}

function render() {
  const ae = document.activeElement, fid = ae && ae.id && !ae.closest("dialog") ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  document.body.dataset.view = UI.view;
  document.documentElement.lang = UI.lang;
  renderNav();
  actualizarMeta();
  const v = $("#view");
  v.classList.toggle("calm", !UI.animate);
  v.innerHTML = VIEWS[UI.view]() + FOOT();
  if (UI.view === "subasta") updateAuction();
  renderTray(); liveBits();
  UI.animate = false;
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus({ preventScroll: true }); if (sel) try { n.setSelectionRange(...sel); } catch {} } }
}
function softRefresh() { if (UI.view === "subasta") return renderNav(); render(); }
function go(view, id) {
  UI.view = view;
  if (view === "cafe" && id) UI.cafe = id;
  if (view === "entrada" && id) UI.entrada = id;
  UI.animate = true; closeModal(); menu(false);
  const url = ruta(view, id || (view === "cafe" ? UI.cafe : view === "entrada" ? UI.entrada : null));
  try { if (location.pathname !== url) history.pushState({ view }, "", url); } catch {}
  render();
  try { window.scrollTo({ top: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); }
}
function menu(abrir) {
  const b = $("#menu-btn"); document.body.classList.toggle("menu-abierto", !!abrir);
  if (b) b.setAttribute("aria-expanded", String(!!abrir));
}
function renderNav() {
  const activa = UI.view === "cafe" ? "cafes" : UI.view === "entrada" ? "diario" : UI.view;
  document.querySelectorAll(".tab").forEach((x) => {
    x.setAttribute("aria-current", x.dataset.to === activa ? "page" : "false");
    x.setAttribute("href", ruta(x.dataset.to));
    const k = x.dataset.i18n; if (k) x.childNodes[0].nodeValue = t(k) + " ";
  });
  const n = unidadesCarrito(), b = $("#b-cart");
  if (b) { b.hidden = !n; b.textContent = n; }
  const bc = $("#cart-btn"), bn = $("#cart-n");
  if (bc) { bc.setAttribute("aria-label", (UI.lang === "en" ? "Order" : "Pedido") + (n ? ` (${n})` : "")); bc.classList.toggle("lleno", !!n); }
  if (bn) { bn.hidden = !n; bn.textContent = n; }
  $("#nav-live").classList.toggle("off", UI.au.ended);
  document.querySelectorAll("[data-lang]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.lang === UI.lang));
}
function cambiarIdioma(l) {
  const v = $("#view"); v.classList.add("swap"); setTimeout(() => v.classList.remove("swap"), 140);
  UI.lang = l; try { localStorage.setItem("nandez-lang", l); } catch {}
  const id = UI.view === "cafe" ? UI.cafe : UI.view === "entrada" ? UI.entrada : null;
  try { history.replaceState({}, "", ruta(UI.view, id)); } catch {}
  UI.animate = true; render();
}
function liveBits() {
  const a = UI.au, top = topBid(a);
  document.querySelectorAll("[data-live-time]").forEach((el) => (el.textContent = a.ended ? t("cerrada") : restante(Math.max(0, a.endsAt - Date.now()))));
  document.querySelectorAll("[data-live-price]").forEach((el) => (el.textContent = usd(top ? top.p : a.start)));
}

/* ---------- eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
  if (el.tagName === "A") e.preventDefault();
  const { act, id } = el.dataset;
  switch (act) {
    case "go": return go(el.dataset.to);
    case "lang": return cambiarIdioma(el.dataset.lang);
    case "close": return closeModal();
    case "cafe": return go("cafe", id);
    case "entrada": return go("entrada", id);
    case "var": (UI.variante ||= {})[el.dataset.p] = +el.dataset.g; UI.animate = false; return render();
    case "add": return addCarrito(el.dataset.p, el.dataset.g);
    case "qty": return cambiarCantidad(el.dataset.p, el.dataset.g, +el.dataset.d);
    case "carrito-clear": UI.carrito = []; guardarCarrito(); renderCarrito(); return render();
    case "carrito": return abrirCarrito();
    case "quitar": return quitarDelCarrito(el.dataset.p, el.dataset.g);
    case "cart-close": return cerrarCarrito();
    case "pedido-wa": return pedidoWA();
    case "pedido-mp": return pedidoMP();
    case "copiar": return copiar(el.dataset.texto);
    case "cotizar": return cotizar(id);
    case "cotizar-ok": return cotizarOk();
    case "menu": return menu(!document.body.classList.contains("menu-abierto"));
    case "sub": return suscribir(id);
    case "sub-ok": return suscribirOk(id);
    case "bid": return myBid(+el.dataset.steps);
    case "bid-custom": return myBid(0);
    case "inscribir-ok": return inscribirOk(el.dataset.steps);
    case "au-reset": return resetAuction();
    case "remind": return avisarme(id);
    case "avisarme-ok": return avisarmeOk(id);
    case "reset-demo":
      try { localStorage.removeItem(CONFIG.storageKey); } catch {}
      S = seed(); UI.au = newAuction(); UI.carrito = []; UI.variante = null;
      return go("inicio");
  }
});
document.addEventListener("keydown", (e) => {
  const x = e.target;
  if ((e.key === "Enter" || e.key === " ") && x.getAttribute?.("role") === "button" && x.dataset.act) { e.preventDefault(); x.click(); }
  if (e.key === "Enter" && x.id === "au-custom") myBid(0);
  if (e.key === "Escape" && document.body.classList.contains("menu-abierto")) menu(false);
});
$("#dlg").addEventListener("click", (e) => { if (e.target === $("#dlg")) closeModal(); });
$("#cart")?.addEventListener("click", (e) => { if (e.target === $("#cart")) cerrarCarrito(); });
$("#cart")?.addEventListener("close", () => renderTray());
window.addEventListener("popstate", () => { const r = vistaDeRuta(location.pathname); UI.view = VIEWS[r.view] ? r.view : "inicio"; if (r.id) { UI.cafe = r.id; UI.entrada = r.id; } UI.animate = true; render(); });

/* ---------- arranque ---------- */
aplicarCfgGuardada();
cargarCarrito();
UI.au = newAuction();
UI.lang = location.pathname.startsWith("/en") ? "en" : "es";   // manda la URL, no lo guardado
const r0 = vistaDeRuta(location.pathname);
UI.view = VIEWS[r0.view] ? r0.view : "inicio";
if (r0.id) { UI.cafe = r0.id; UI.entrada = r0.id; }
render();
setInterval(() => {
  const a = UI.au, now = Date.now();
  if (!a.ended) { botTick(a, now); if (now >= a.endsAt) { endAuction(a); renderNav(); } }
  liveBits();
  if (UI.view === "subasta") updateAuction();
}, 250);

/* ============================================================
   INICIO, navegación, idioma y eventos de la página pública
   ============================================================ */
/* Cada palabra del titular entra por su cuenta. El espacio queda fuera del
   span: para un buscador o un lector de pantalla sigue siendo una frase. */
const pal = (txt, desde = 0) => txt.split(" ").map((p, i) => `<span class="pal" style="--w:${desde + i}">${p}</span>`).join(" ");

function viewInicio() {
  const en = UI.lang === "en";
  const valor = en
    ? [["Every coffee has a grower", "Not just “Colombian coffee”: the coffee of one farm and one harvest, and we tell you who planted it."],
       ["We tell you what we know", "Altitude, variety, process and score say who checked them and when. What we could not check, we tell you too."],
       ["The best is kept apart", "Each neighbouring farm grows its own variety. When a lot comes out truly special, it goes to the auction instead of a bag."]]
    : [["Cada café tiene quién lo sembró", "No es “café colombiano” sin más: es el café de una finca y de una cosecha, y te decimos quién lo sembró."],
       ["Te contamos lo que sabemos", "La altura, la variedad, el proceso y el puntaje dicen quién los revisó y cuándo. Lo que no hemos podido comprobar, también te lo decimos."],
       ["Lo mejor se guarda aparte", "Cada finca vecina tiene su variedad. Cuando un lote sale especial de verdad, no va a la bolsa: va a la subasta."]];
  return `
  ${portada(en)}

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

  ${seccionCereza(en)}

  <section class="section">
    <div class="section-head"><p class="eyebrow">${en ? "The neighbours" : "Los vecinos"}</p>
      <h2>${en ? "The farms <em>it comes from</em>" : "Las fincas <em>de donde viene</em>"}</h2>
      <p>${en ? "Today we roast coffee from neighbouring farms. Our own first harvest comes in 2027, and we will keep buying from them."
        : "Hoy tostamos café de fincas vecinas. En 2027 sale la primera cosecha de la nuestra, y les vamos a seguir comprando a ellos."}</p></div>
    <div class="fincas">${S.fincas.map((f, i) => fincaCard(f, i)).join("")}</div>
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
  contacto: viewContacto, envios: viewEnvios, terminos: viewTerminos, privacidad: viewPrivacidad, noencontrada: viewNoEncontrada };

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
    offers: { "@type": "Offer", price: UI.au.start, priceCurrency: "USD", description: UI.lang === "en" ? "Starting price per kg of green coffee" : "Precio de salida por kg de café verde" },
    description: meta("subasta").d, eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: CONFIG.sitio + ruta("subasta") }, organizer: { "@id": org["@id"] } });
  return { "@context": "https://schema.org", "@graph": grafo };
}

function render(arranque) {
  const ae = document.activeElement, fid = ae && ae.id && !ae.closest("dialog") ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  document.body.dataset.view = UI.view;
  document.documentElement.lang = UI.lang;
  renderNav();
  actualizarMeta();
  const v = $("#view");
  /* La portada ya viene escrita en el HTML. Al arrancar no se reescribe:
     así la entrada se ve una sola vez y no parpadea al cargar el JavaScript. */
  const yaEscrita = arranque === true && UI.view === "inicio" && !v.classList.contains("calm") && v.querySelector(".hero");
  if (!yaEscrita) {
    v.classList.toggle("calm", !UI.animate);
    v.innerHTML = VIEWS[UI.view]() + FOOT();
  }
  if (UI.view === "subasta") updateAuction();
  renderTray(); liveBits();
  try { montarCereza(); } catch {}   // si falla la profundidad, la secuencia sigue viéndose
  UI.animate = false;
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus({ preventScroll: true }); if (sel) try { n.setSelectionRange(...sel); } catch {} } }
}
function softRefresh() { if (UI.view === "subasta") return renderNav(); render(); }
function go(view, id) {
  UI.view = view;
  if (view === "cafe" && id) UI.cafe = id;
  if (view === "entrada" && id) UI.entrada = id;
  UI.animate = true; closeModal(); menu(false); mas(false);
  const url = ruta(view, id || (view === "cafe" ? UI.cafe : view === "entrada" ? UI.entrada : null));
  try { if (location.pathname !== url) history.pushState({ view }, "", url); } catch {}
  render();
  try { window.scrollTo({ top: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); }
}
function menu(abrir) {
  const b = $("#menu-btn"); document.body.classList.toggle("menu-abierto", !!abrir);
  if (b) b.setAttribute("aria-expanded", String(!!abrir));
}
/* "Más", en la barra del celular: lo que no cabe en los cinco accesos */
function mas(abrir) {
  const h = $("#dock-hoja"), b = $("#dock-mas");
  if (!h) return;
  h.hidden = !abrir;
  document.body.classList.toggle("mas-abierto", !!abrir);
  if (b) b.setAttribute("aria-expanded", String(!!abrir));
}

/* La luz de la sección activa: una sola píldora que se desliza de una a otra.
   La primera vez se pone en su sitio sin animarse, para que no entre volando. */
function moverLuz() {
  const tabs = $(".tabs"), luz = tabs && tabs.querySelector(".tab-luz");
  if (!luz) return;
  const act = tabs.querySelector('.tab[aria-current="page"]');
  if (!act || !act.offsetWidth) { luz.style.opacity = "0"; return; }
  const primera = !tabs.classList.contains("con-luz");
  if (primera) luz.classList.add("quieta");
  luz.style.setProperty("--x", act.offsetLeft + "px");
  luz.style.setProperty("--w", act.offsetWidth + "px");
  luz.style.opacity = "1";
  tabs.classList.add("con-luz");
  if (primera) requestAnimationFrame(() => requestAnimationFrame(() => luz.classList.remove("quieta")));
}

/* Al bajar, la barra se aparta; al subir, vuelve. Hace falta moverse 40 px en
   la misma dirección para que cambie: un temblor del dedo no la esconde. */
function montarNav() {
  const top = $(".top"), cuerpo = document.body;
  if (!top || top.dataset.montada) return;
  top.dataset.montada = "1";
  let ultimo = Math.max(0, scrollY), acum = 0, pedido = null;
  function mirar() {
    pedido = null;
    const y = Math.max(0, scrollY), d = y - ultimo;
    ultimo = y;
    cuerpo.classList.toggle("nav-compacta", y > 24);
    const quieta = y < 140 || cuerpo.classList.contains("menu-abierto") || top.contains(document.activeElement);
    if (quieta) { acum = 0; cuerpo.classList.remove("nav-oculta"); return; }
    acum = Math.sign(d) === Math.sign(acum) ? acum + d : d;
    if (acum > 40) cuerpo.classList.add("nav-oculta");
    else if (acum < -10) cuerpo.classList.remove("nav-oculta");
  }
  addEventListener("scroll", () => { if (!pedido) pedido = requestAnimationFrame(mirar); }, { passive: true });
  top.addEventListener("focusin", () => cuerpo.classList.remove("nav-oculta"));
  /* respaldo para teclado: si Tab deja el foco en el menú, el menú se muestra */
  addEventListener("keyup", (e) => { if (e.key === "Tab" && top.contains(document.activeElement)) cuerpo.classList.remove("nav-oculta"); });
  /* con mouse, acercarse al borde de arriba la trae de vuelta */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches)
    addEventListener("mousemove", (e) => { if (e.clientY < 70) cuerpo.classList.remove("nav-oculta"); }, { passive: true });
  addEventListener("resize", moverLuz);
  document.fonts?.ready.then(moverLuz);
  /* tocar fuera de "Más" lo cierra */
  document.addEventListener("click", (e) => {
    if (cuerpo.classList.contains("mas-abierto") && !e.target.closest("#dock-hoja, #dock-mas")) mas(false);
  });
  mirar();
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
  document.querySelectorAll(".dock-it[data-to]").forEach((x) => {
    x.setAttribute("aria-current", x.dataset.to === activa ? "page" : "false");
    x.setAttribute("href", ruta(x.dataset.to));
  });
  document.querySelectorAll(".dock [data-i18n]").forEach((x) => { x.textContent = t(x.dataset.i18n); });
  const dn = $("#dock-n"), dp = $("#dock-pedido");
  if (dn) { dn.hidden = !n; dn.textContent = n; }
  if (dp) dp.setAttribute("aria-label", (UI.lang === "en" ? "Order" : "Pedido") + (n ? ` (${n})` : ""));
  $("#dock-live")?.classList.toggle("off", UI.au.ended);
  moverLuz();
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
    case "mas": return mas(!document.body.classList.contains("mas-abierto"));
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
  if (e.key === "Escape" && document.body.classList.contains("mas-abierto")) { mas(false); $("#dock-mas")?.focus(); }
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
render(true);
montarNav();
setInterval(() => {
  const a = UI.au, now = Date.now();
  if (!a.ended) { botTick(a, now); if (now >= a.endsAt) { endAuction(a); renderNav(); } }
  liveBits();
  if (UI.view === "subasta") updateAuction();
}, 250);

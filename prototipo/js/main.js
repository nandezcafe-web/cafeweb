/* ============================================================
   INICIO, navegación, idioma y eventos de la página pública
   ============================================================ */
function viewInicio() {
  const en = UI.lang === "en", a = UI.au, l = AU_LOTE;
  const p = S.productos.find((x) => x.destacado) || S.productos[0];
  const sobre = ((p.pago.pagadoKg / p.pago.referenciaKg - 1) * 100).toFixed(0);
  const valor = en
    ? [["A name, not a country", "We do not sell “Colombian coffee”. We sell one farm’s lot, one harvest, with the name of whoever grew it."],
       ["Every number with its source", "Altitude, variety, process and score carry who checked them and when. What is not verified, we say so."],
       ["What we paid", `We paid ${cop(p.pago.pagadoKg)} per kilo of parchment when the reference that day was ${cop(p.pago.referenciaKg)}: <b>+${sobre} %</b>.`],
       ["One farm, one variety", "Each allied farm brings a different variety. Exceptional lots go to auction."]]
    : [["Un nombre, no un país", "No vendemos “café colombiano”. Vendemos el lote de una finca, de una cosecha, con el nombre de quien lo cultivó."],
       ["Cada dato con su fuente", "Altura, variedad, proceso y puntaje llevan quién lo comprobó y cuándo. Lo que no está verificado, lo decimos."],
       ["Lo que le pagamos", `Pagamos ${cop(p.pago.pagadoKg)} por kilo de pergamino cuando la referencia del día era ${cop(p.pago.referenciaKg)}: <b>+${sobre} %</b>.`],
       ["Una finca, una variedad", "Cada finca aliada trae una variedad distinta. Los lotes excepcionales van a subasta."]];
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
        ? "We buy from farms in Norte de Santander, paying above the day’s reference, and sell each lot with its full data sheet: who grew it, at what altitude, who cupped it and when."
        : "Le compramos a fincas de Norte de Santander, pagando por encima de la referencia del día, y vendemos cada lote con su ficha completa: quién lo cultivó, a qué altura, quién lo cató y cuándo."}</p>
      <div class="cta reveal" style="--i:3">
        <button class="btn primary lg" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button>
        <button class="btn lg" data-act="go" data-to="subasta"><span class="live-dot ${a.ended ? "off" : ""}"></span> ${en ? "Live auction" : "Subasta en vivo"}</button>
      </div>
    </div>
    <div class="hero-art reveal" style="--i:2">
      <div class="hero-card">
        <div class="hc-top"><span class="kicker">${esc(l.productor)} · ${esc(l.municipio)}</span><span class="state st-en-subasta">${a.ended ? t("cerrada") : t("en_vivo")}</span></div>
        <p class="hc-title">${esc(l.variedad)}<br><em>${esc(l.proceso)}</em></p>
        <p class="hc-score">${esc(l.puntaje)}<small>SCA</small></p>
        <div class="hc-ridge dark-art">${ridge(l, { w: 420, h: 180, dark: true })}</div>
      </div>
      <div class="float-chip" style="--x:-6%;--y:66%;--d:0s"><i style="--c:var(--leaf)"></i><span>${en ? "Altitude" : "Altitud"} <b>${fmtNum(l.altitud)} m</b></span><small>${en ? "verified · GPS" : "verificado · GPS"}</small></div>
      <div class="float-chip" style="--x:58%;--y:24%;--d:-2s"><i style="--c:var(--leaf)"></i><span>${en ? "Score" : "Puntaje"} <b>${esc(l.puntaje)}</b></span><small>${en ? "verified · Q-grader" : "verificado · Q-grader"}</small></div>
      <div class="float-chip" style="--x:54%;--y:84%;--d:-4s"><i style="--c:var(--doc)"></i><span>${en ? "Auction" : "Subasta"} <b data-live-price>${cop(topBid(a)?.p || a.start)}</b></span><small>${en ? "per kg green" : "por kg verde"}</small></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${en ? "On sale now" : "A la venta ahora"}</p>
      <h2>${en ? "One coffee <em>per farm</em>" : "Un café <em>por finca</em>"}</h2>
      <p>${en ? "Each allied farm grows a different variety. When a lot is exceptional, it goes to auction instead of the shelf."
        : "Cada finca aliada tiene su variedad. Cuando un lote es excepcional, va a subasta en vez de a la estantería."}</p></div>
    <div class="dos">${S.productos.map((x, i) => cafeCard(x, i)).join("")}${subastaCard(S.productos.length)}</div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${en ? "Why it costs what it costs" : "Por qué cuesta lo que cuesta"}</p>
      <h2>${en ? "Transparency is <em>not decoration</em>" : "La transparencia <em>no es un adorno</em>"}</h2></div>
    <div class="valor">${valor.map(([tt, d], i) => `<div class="val" style="--i:${i}"><b>${tt}</b><span>${d}</span></div>`).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${en ? "The farms" : "Las fincas"}</p>
      <h2>${en ? "We buy in <em>Norte de Santander</em>" : "Compramos en <em>Norte de Santander</em>"}</h2>
      <p>${en ? "Today from allied farms. From 2027, also from our own land — and we will keep buying from our neighbours."
        : "Hoy a fincas aliadas. Desde 2027, también de nuestra propia tierra, y seguiremos comprándole a los vecinos."}</p></div>
    <div class="fincas">${S.fincas.map((f, i) => fincaCard(f, i)).join("")}</div>
  </section>

  <section class="section cinta">
    <p class="eyebrow">${en ? "From the farm to the bag" : "De la finca a la bolsa"}</p>
    <div class="cinta-pasos">${pasos.map(([tt, d], i) => `<div class="cp"><span class="n">${i + 1}</span><b>${esc(tt)}</b><small>${esc(d)}</small></div>`).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">${t("nav_suscripcion")}</p>
      <h2>${en ? "Or let it <em>arrive every month</em>" : "O deja que <em>llegue cada mes</em>"}</h2>
      <p>${en ? `From ${cop(S.planes[0].precio)} a month, always the freshest lot.` : `Desde ${cop(S.planes[0].precio)} al mes, siempre el lote más fresco.`}</p></div>
    <div class="cta"><button class="btn primary" data-act="go" data-to="suscripcion">${en ? "See the plans" : "Ver los planes"}</button>
      <button class="btn" data-act="go" data-to="diario">${en ? "Read the journal" : "Leer el diario"}</button></div>
  </section>`;
}

const FOOT = () => `<footer class="foot">
  <span>${esc(CONFIG.marca)} · ${esc(tx(CONFIG.lugar))} · ${esc(CONFIG.correo)}<br>
  <small>${UI.lang === "en" ? "Prototype with example data: photos, texts and prices to be confirmed." : "Prototipo con datos de ejemplo: fotos, textos y precios por confirmar."}</small></span>
  <button class="btn sm" data-act="reset-demo">${UI.lang === "en" ? "Reset demo data" : "Reiniciar datos de la demo"}</button></footer>`;

const VIEWS = { inicio: viewInicio, cafes: viewCafes, cafe: viewCafe, subasta: viewSubasta, suscripcion: viewSuscripcion, diario: viewDiario, entrada: viewEntrada };

function render() {
  const ae = document.activeElement, fid = ae && ae.id && !ae.closest("dialog") ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  document.body.dataset.view = UI.view;
  document.documentElement.lang = UI.lang;
  renderNav();
  const v = $("#view");
  v.classList.toggle("calm", !UI.animate);
  v.innerHTML = VIEWS[UI.view]() + FOOT();
  if (UI.view === "subasta") updateAuction();
  renderTray(); liveBits();
  UI.animate = false;
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus({ preventScroll: true }); if (sel) try { n.setSelectionRange(...sel); } catch {} } }
}
function softRefresh() { if (UI.view === "subasta") return renderNav(); render(); }
function go(view) {
  UI.view = view; UI.animate = true; closeModal();
  try { if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view); } catch {}
  render();
  try { window.scrollTo({ top: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); }
}
function renderNav() {
  const activa = UI.view === "cafe" ? "cafes" : UI.view === "entrada" ? "diario" : UI.view;
  document.querySelectorAll(".tab").forEach((x) => {
    x.setAttribute("aria-current", x.dataset.to === activa ? "page" : "false");
    const k = x.dataset.i18n; if (k) x.childNodes[0].nodeValue = t(k) + " ";
  });
  const n = unidadesCarrito(), b = $("#b-cart");
  b.hidden = !n; b.textContent = n;
  $("#nav-live").classList.toggle("off", UI.au.ended);
  document.querySelectorAll("[data-lang]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.lang === UI.lang));
}
function cambiarIdioma(l) {
  UI.lang = l; try { localStorage.setItem("nandez-lang", l); } catch {}
  UI.animate = true; render();
}
function liveBits() {
  const a = UI.au, top = topBid(a);
  document.querySelectorAll("[data-live-time]").forEach((el) => (el.textContent = a.ended ? t("cerrada") : mmss(Math.max(0, a.endsAt - Date.now()))));
  document.querySelectorAll("[data-live-price]").forEach((el) => (el.textContent = cop(top ? top.p : a.start)));
}

/* ---------- eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
  const { act, id } = el.dataset;
  switch (act) {
    case "go": return go(el.dataset.to);
    case "lang": return cambiarIdioma(el.dataset.lang);
    case "close": return closeModal();
    case "cafe": UI.cafe = id; return go("cafe");
    case "entrada": UI.entrada = id; return go("entrada");
    case "var": (UI.variante ||= {})[el.dataset.p] = +el.dataset.g; UI.animate = false; return render();
    case "add": return addCarrito(el.dataset.p, el.dataset.g);
    case "qty": return cambiarCantidad(el.dataset.p, el.dataset.g, +el.dataset.d);
    case "carrito-clear": UI.carrito = []; return render();
    case "pedido": return abrirPedido();
    case "pedido-wa": return pedidoWA();
    case "pedido-mp": return pedidoMP();
    case "espera": return listaEspera();
    case "sub": return suscribir(id);
    case "sub-ok": return suscribirOk(id);
    case "bid": return myBid(+el.dataset.steps);
    case "bid-custom": return myBid(0);
    case "au-as": UI.au.as = el.dataset.as; UI.animate = false; return render();
    case "au-reset": return resetAuction();
    case "remind": el.textContent = "✓"; el.disabled = true; return;
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
  if (e.key === "Enter" && x.id === "esp-mail") { e.preventDefault(); listaEspera(); }
});
$("#dlg").addEventListener("click", (e) => { if (e.target === $("#dlg")) closeModal(); });
window.addEventListener("hashchange", () => { const v = location.hash.slice(1); if (VIEWS[v] && v !== UI.view) go(v); });

/* ---------- arranque ---------- */
aplicarCfgGuardada();
UI.au = newAuction();
const inicial = location.hash.slice(1);
if (VIEWS[inicial]) UI.view = inicial;
render();
setInterval(() => {
  const a = UI.au, now = Date.now();
  if (!a.ended) { botTick(a, now); if (now >= a.endsAt) { endAuction(a); renderNav(); } }
  liveBits();
  if (UI.view === "subasta") updateAuction();
}, 250);

/* ============================================================
   INICIO, ADMIN, enrutado, render y eventos
   ============================================================ */
function viewInicio() {
  const p = geisha(), a = UI.au, l = AU_LOTE;
  const v = p.variantes.find((x) => x.principal);
  const sobre = ((p.pago.pagadoKg / p.pago.referenciaKg - 1) * 100).toFixed(0);
  const valor = [
    ["Un nombre, no un país", "No vendemos “café colombiano”. Vendemos el lote de una finca, de una cosecha, con el nombre de quien lo cultivó."],
    ["Cada dato con su fuente", "Altura, variedad, proceso y puntaje llevan quién lo comprobó y cuándo. Lo que no está verificado, lo decimos."],
    ["Lo que le pagamos", `Pagamos ${cop(p.pago.pagadoKg)} por kilo de pergamino cuando la referencia del día era ${cop(p.pago.referenciaKg)}: <b>+${sobre} %</b>.`],
    ["Se acaba y ya", "Son 60 kilos de una cosecha. Cuando se acaben, hay que esperar a la siguiente."],
  ];
  return `
  <section class="hero">
    <div>
      <p class="eyebrow reveal">${esc(CONFIG.marca)} · ${esc(CONFIG.lugar)}</p>
      <h1 class="reveal" style="--i:1">Un café.<br><em>Toda su historia.</em></h1>
      <p class="lede reveal" style="--i:2">Compramos el lote directo en la finca, pagando por encima de la referencia del día, y lo vendemos con su ficha completa: quién lo cultivó, a qué altura, quién lo cató y cuándo.</p>
      <div class="cta reveal" style="--i:3">
        <button class="btn primary lg" data-act="go" data-to="geisha">Ver el Geisha · ${cop(v.precio)}</button>
        <button class="btn lg" data-act="go" data-to="subasta"><span class="live-dot ${a.ended ? "off" : ""}"></span> Subasta en vivo</button>
      </div>
    </div>
    <div class="hero-art reveal" style="--i:2">
      <div class="hero-card">
        <div class="hc-top"><span class="kicker">${esc(p.municipio)} · ${esc(p.cosecha)}</span><span class="state st-publicado">${v.stock} bolsas</span></div>
        <p class="hc-title">${esc(p.variedad)}<br><em>${esc(p.proceso)}</em></p>
        <p class="hc-score">${esc(p.puntaje)}<small>SCA</small></p>
        <div class="hc-ridge dark-art">${ridge(p, { w: 420, h: 180, dark: true })}</div>
      </div>
      <div class="float-chip" style="--x:-6%;--y:66%;--d:0s"><i style="--c:var(--leaf)"></i><span>Altitud <b>${fmtNum(p.altitud)} m</b></span><small>verificado · GPS</small></div>
      <div class="float-chip" style="--x:58%;--y:24%;--d:-2s"><i style="--c:var(--leaf)"></i><span>Puntaje <b>${esc(p.puntaje)}</b></span><small>verificado · Q-grader</small></div>
      <div class="float-chip" style="--x:54%;--y:84%;--d:-4s"><i style="--c:var(--doc)"></i><span>Lavado <b>36 h</b></span><small>documentado · bitácora</small></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">Lo que hay ahora</p><h2>Dos cafés, <em>nada más</em></h2>
      <p>Uno para llevar a casa y uno que se remata al mejor postor. Cuando se acaban, se acaban.</p></div>
    <div class="dos">${cafeCard(p, 0)}${subastaCard(1)}</div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">Por qué cuesta lo que cuesta</p><h2>La transparencia <em>no es un adorno</em></h2></div>
    <div class="valor">${valor.map(([t, d], i) => `<div class="val" style="--i:${i}"><b>${t}</b><span>${d}</span></div>`).join("")}</div>
  </section>

  <section class="section cinta">
    <p class="eyebrow">De la finca a la bolsa</p>
    <div class="cinta-pasos">${[
      ["Compra", `${cop(p.pago.pagadoKg)}/kg de pergamino en la finca`],
      ["Trilla", "60 kg de pergamino → 46 kg de café verde"],
      ["Tueste", "medio-claro, para que se sienta el origen"],
      ["Empaque", "153 bolsas con válvula y fecha de tueste"],
      ["Tu taza", "15 g, 250 ml, 93 °C"],
    ].map(([t, d], i) => `<div class="cp"><span class="n">${i + 1}</span><b>${t}</b><small>${d}</small></div>`).join("")}</div>
  </section>`;
}

const FOOT = `<footer class="foot"><span><b>${CONFIG.marca}</b> · ${CONFIG.lugar} · nombre provisional. Prototipo con <b>datos de ejemplo</b>.</span>
  <button class="btn sm" data-act="reset-demo">Reiniciar datos de la demo</button></footer>`;

const VIEWS = { inicio: viewInicio, geisha: viewGeisha, subasta: viewSubasta };

function render() {
  const ae = document.activeElement, fid = ae && ae.id && !ae.closest("dialog") ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  document.body.dataset.view = UI.view;
  renderNav();
  const v = $("#view");
  v.classList.toggle("calm", !UI.animate);
  v.innerHTML = VIEWS[UI.view]() + FOOT;
  if (UI.view === "subasta") updateAuction();
  renderTray(); liveBits();
  if (UI.animate) countUp();
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
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-current", t.dataset.to === UI.view ? "page" : "false"));
  const n = unidadesCarrito(), b = $("#b-cart");
  b.hidden = !n; b.textContent = n;
  $("#nav-live").classList.toggle("off", UI.au.ended);
}
function liveBits() {
  const a = UI.au, top = topBid(a);
  document.querySelectorAll("[data-live-time]").forEach((el) => (el.textContent = a.ended ? "cerrada" : mmss(Math.max(0, a.endsAt - Date.now()))));
  document.querySelectorAll("[data-live-price]").forEach((el) => (el.textContent = cop(top ? top.p : a.start)));
}
function countUp() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = +el.dataset.count, dec = +el.dataset.dec || 0, pre = el.dataset.pre || "", suf = el.dataset.suf || "", t0 = performance.now();
    const stepFn = (now) => { const k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + fmtNum(target * e, dec) + suf; if (k < 1) requestAnimationFrame(stepFn); };
    requestAnimationFrame(stepFn);
  });
}

/* ---------- eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
  const { act, id } = el.dataset;
  switch (act) {
    case "go": return go(el.dataset.to);
    case "close": return closeModal();
    /* tienda */
    case "var": UI.variante = +el.dataset.g; UI.animate = false; return render();
    case "add": return addCarrito(el.dataset.g);
    case "qty": return cambiarCantidad(el.dataset.g, +el.dataset.d);
    case "carrito-clear": UI.carrito = []; return render();
    case "pedido": return abrirPedido();
    case "pedido-enviar": return enviarPedido();
    case "espera": return listaEspera();
    /* subasta */
    case "bid": return myBid(+el.dataset.steps);
    case "bid-custom": return myBid(0);
    case "au-as": UI.au.as = el.dataset.as; UI.animate = false; return render();
    case "au-reset": return resetAuction();
    case "remind": el.textContent = "✓ Te avisamos"; el.disabled = true; return;
    case "reset-demo":
      try { localStorage.removeItem(CONFIG.storageKey); } catch {}
      S = seed(); UI.au = newAuction(); UI.carrito = []; UI.q = null; UI.variante = null;
      return go("inicio");
  }
});
document.addEventListener("keydown", (e) => {
  const t = e.target;
  if ((e.key === "Enter" || e.key === " ") && t.getAttribute?.("role") === "button" && t.dataset.act) { e.preventDefault(); t.click(); }
  if (e.key === "Enter" && t.id === "au-custom") myBid(0);
  if (e.key === "Enter" && t.id === "esp-mail") { e.preventDefault(); listaEspera(); }
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

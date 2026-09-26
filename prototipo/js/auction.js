/* ============================================================
   SUBASTA DE LOTES EXCEPCIONALES (simulada)
   Subastamos café que ya compramos: la reserva protege nuestro costo.
   ============================================================ */
const YO = { nombre: "Tostaduría Ejemplo", ciudad: "Bucaramanga" };   // el postor que eres tú en la demo
const BOTS = [
  { name: "Tostador #214", city: "Bogotá", cap: 152000 },
  { name: "Importador #12", city: "Seúl", cap: 171000 },
  { name: "Cafetería #87", city: "Medellín", cap: 146000 },
  { name: "Tostador #301", city: "Cúcuta", cap: 160000 },
];
const EXT_MS = 20000;

/* El lote en subasta. Reemplazar por el del productor aliado cuando esté confirmado. */
const AU_LOTE = {
  id: "S-001", productor: "Domingo Torres", finca: "Finca por confirmar", municipio: "Toledo", altitud: 1950,
  variedad: "Geisha", proceso: "Natural", puntaje: 88.5, factor: 89, nivel: "VERIFICADO",
  detalle: "Anaeróbico 96 h · Camas africanas 28 días", perfil: ["Jazmín", "Mango", "Vino blanco", "Bergamota"],
  compraKgVerde: 43900,   // lo que nos costó por kg verde (compra C-002)
};

function newAuction() {
  const now = Date.now();
  const costo = AU_LOTE.compraKgVerde * 30;
  const a = { start: 120000, incr: 2000, reserve: 140000, kg: 30, minP: 3, dur: 150000, endsAt: now + 150000,
    costo, ended: false, result: null, as: "comprador", bids: [], n: 0, seen: 0, rendered: -1, nextBot: now + 4000 };
  [[0, 120000, -50], [3, 124000, -32], [1, 128000, -11]].forEach(([b, p, s]) =>
    a.bids.unshift({ id: ++a.n, who: BOTS[b].name, city: BOTS[b].city, p, t: now + s * 1000 }));
  a.seen = a.n;
  return a;
}
const topBid = (a) => a.bids.find((b) => !b.sys);
const minBid = (a) => (topBid(a) ? topBid(a).p + a.incr : a.start);
const participants = (a) => new Set(a.bids.filter((b) => !b.sys).map((b) => b.who)).size;
const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
const ago = (t) => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 60 ? `hace ${s} s` : `hace ${Math.floor(s / 60)} min`; };

function placeBid(a, bid) {
  const now = Date.now();
  a.bids.unshift({ id: ++a.n, t: now, ...bid });
  if (a.endsAt - now < EXT_MS) {
    a.endsAt = now + EXT_MS;
    a.bids.unshift({ id: ++a.n, sys: true, text: "Puja en los últimos 20 s · cierre extendido", t: now });
  }
}
function botTick(a, now) {
  if (now < a.nextBot) return;
  const top = topBid(a), min = minBid(a);
  const cands = BOTS.filter((b) => b.name !== top?.who && b.cap >= min);
  if (cands.length) {
    const b = cands[Math.floor(Math.random() * cands.length)];
    const steps = Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 2);
    placeBid(a, { who: b.name, city: b.city, p: Math.min(b.cap, min + steps * a.incr) });
  }
  const left = a.endsAt - now;
  a.nextBot = now + (left < 30000 ? 2500 + Math.random() * 4000 : 5000 + Math.random() * 7000);
}
function endAuction(a) {
  a.ended = true;
  const top = topBid(a);
  const valid = !!top && top.p >= a.reserve && participants(a) >= a.minP;
  a.result = { valid, top, reason: !top || top.p < a.reserve ? "No se alcanzó el precio de reserva." : "Participaron menos de 3 compradores." };
  toast(valid ? (top.me ? `¡Ganaste el lote ${AU_LOTE.id} a ${cop(top.p)}/kg!` : `Lote adjudicado a ${esc(top.who)} por ${cop(top.p)}/kg.`) : "La subasta quedó desierta.",
    UI.view === "subasta" ? {} : { label: "Ver", act: () => go("subasta") });
}
function myBid(steps) {
  const a = UI.au; if (a.ended) return;
  const p = steps ? minBid(a) + (steps - 1) * a.incr : num("au-custom", 0);
  if (!(p >= minBid(a))) {
    const inp = $("#au-custom"); inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake");
    return toast(`La puja mínima es ${cop(minBid(a))}.`, { type: "err" });
  }
  placeBid(a, { who: "Tú", city: YO.ciudad, p, me: true });
  $("#au-custom").value = "";
  a.nextBot = Math.min(a.nextBot, Date.now() + 2500 + Math.random() * 3000);
  updateAuction();
}
function resetAuction() { UI.au = newAuction(); render(); toast("Subasta reiniciada."); }

/* ---------- vista ---------- */
function viewSubasta() {
  const a = UI.au, l = AU_LOTE;
  const rules = [
    ["¿Cuándo es válida?", "Se adjudica si la puja más alta alcanza el precio de reserva y participan al menos 3 compradores distintos. Si no, el lote vuelve al catálogo."],
    ["Extensión anti-último-segundo", "Una puja en los últimos 20 segundos extiende el cierre 20 segundos más. Gana quien más valora el lote, no quien puja al final."],
    ["Identidad y anonimato", "Los postores están verificados por nosotros, pero entre ellos solo ven un código."],
    ["Muestras previas", "Los inscritos pueden pedir 100 g para catar antes de la subasta."],
    ["Incumplimiento", "El ganador tiene 48 horas para confirmar el pago. Si no, el lote pasa al segundo postor."],
  ];
  const upcoming = [["12", "oct", "Microlotes de Toledo", "6 lotes · 84–87 SCA"], ["26", "oct", "Geisha y Sidra del Norte de Santander", "4 lotes · 86+ SCA"], ["09", "nov", "Procesos experimentales", "5 lotes · anaeróbicos y honey"]];
  return `<section class="auction">
    <div class="au-top">
      <div><p class="eyebrow reveal"><span class="live-dot ${a.ended ? "off" : ""}"></span> Subasta · lote ${esc(l.id)}</p>
        <p class="au-sub reveal" style="--i:1">Precio de salida ${cop(a.start)}/kg · incremento mínimo ${cop(a.incr)} · ${a.kg} kg de café verde</p></div>
      <div class="seg dark reveal" style="--i:2" role="group" aria-label="Ver como">
        <button data-act="au-as" data-as="comprador" aria-pressed="${a.as === "comprador"}">Ver como comprador</button>
        <button data-act="au-as" data-as="interno" aria-pressed="${a.as === "interno"}">Ver como ${esc(CONFIG.marca)}</button></div>
    </div>
    <div class="au-grid">
      <article class="au-panel au-lot reveal dark-art" style="--i:1">
        <p class="kicker">${esc(l.finca)} · ${esc(l.municipio)}, Norte de Santander</p>
        <h2 class="au-title">${esc(l.variedad)} <em>${esc(l.proceso)}</em></h2>
        <ul class="au-facts">
          <li><b>${esc(l.puntaje)}</b><small>SCA · ${LV[l.nivel].label}</small></li>
          <li><b>${fmtNum(l.altitud)}</b><small>msnm · verificado</small></li>
          <li><b>${a.kg} kg</b><small>verde · lote único</small></li>
          <li><b>${esc(l.factor)}</b><small>Factor de rendimiento</small></li>
        </ul>
        <p class="au-detail">${esc(l.detalle)}</p>
        <ul class="notes dark">${l.perfil.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
        <p class="au-note">Comprado por nosotros a ${esc(l.productor)}. Lo subastamos porque es un lote pequeño y excepcional: la subasta le saca más valor que la bolsa de 340 g.</p>
        <div class="au-ridge">${ridge(l, { w: 420, h: 120, dark: true })}</div>
      </article>
      <div class="au-panel au-console reveal" style="--i:2">
        <div class="clock" id="au-clock"><div><span id="au-time">--:--</span><small id="au-clock-lbl">restante</small></div></div>
        <div class="au-price"><span class="lbl">Puja más alta · COP/kg</span><b id="au-price">—</b><span class="au-total" id="au-total"></span></div>
        <div class="au-status" id="au-status"></div>
        <div id="au-controls"></div>
      </div>
      <aside class="au-panel au-feed reveal" style="--i:3">
        <div class="feed-head"><h3>Pujas en vivo</h3><span class="mono" id="au-part"></span></div>
        <ol id="au-feed"></ol>
      </aside>
    </div>
    <div class="au-lower">
      <section class="au-panel reveal" style="--i:4"><h3>Reglas <em>de la sala</em></h3>
        ${rules.map(([t, p], i) => `<details class="rule" ${i === 0 ? "open" : ""}><summary>${t}</summary><p>${p}</p></details>`).join("")}</section>
      <section class="au-panel reveal" style="--i:5"><h3>Próximas <em>subastas</em></h3><div class="upcoming">
        ${upcoming.map(([d, m, t, s]) => `<div class="up"><div class="date"><b>${d}</b><small>${m}</small></div><p>${t}<small>${s}</small></p><button class="btn sm" data-act="remind">Avisarme</button></div>`).join("")}
        </div><p class="au-note">Fechas de ejemplo.</p>
        <button class="btn sm" data-act="au-reset" style="margin-top:10px">Reiniciar subasta de demostración</button></section>
    </div>
  </section>`;
}

function controlsHTML() {
  const a = UI.au;
  if (a.ended) {
    const r = a.result;
    if (!r.valid) return `<div class="au-result lose"><h3>Subasta desierta</h3><p>${r.reason} El lote vuelve al catálogo y lo vendemos tostado.</p><div class="btns"><button class="btn" data-act="au-reset">Reiniciar demo</button></div></div>`;
    const sobreCosto = ((r.top.p * a.kg) / a.costo - 1) * 100;
    return r.top.me
      ? `<div class="au-result"><h3>¡Adjudicado a ti!</h3><p>${a.kg} kg × ${cop(r.top.p)} = <b>${cop(r.top.p * a.kg)}</b>. Tienes 48 h para confirmar el pago.</p>
         <div class="btns"><button class="btn primary" data-act="go" data-to="tienda">Ver la tienda</button><button class="btn" data-act="au-reset">Reiniciar demo</button></div></div>`
      : `<div class="au-result"><h3>Adjudicado</h3><p>${esc(r.top.who)} (${esc(r.top.city)}) ganó con ${cop(r.top.p)}/kg: <b>+${Math.round(sobreCosto)} %</b> sobre lo que nos costó el lote.</p><div class="btns"><button class="btn" data-act="au-reset">Reiniciar demo</button></div></div>`;
  }
  if (a.as === "interno") {
    const top = topBid(a), p = top ? top.p : a.start, venta = p * a.kg;
    const util = venta - a.costo, max = Math.max(venta, a.costo, 1);
    return `<div class="ppanel"><span class="lbl">Vista interna · ${esc(CONFIG.marca)}</span>
      <div class="prow-au"><span>Nos costó (${a.kg} kg verde)</span><b>${cop(a.costo)}</b></div>
      <div class="prow-au"><span>Precio de reserva (privado)</span><b>${cop(a.reserve)}/kg ${p >= a.reserve ? "✓" : ""}</b></div>
      <div class="prow-au"><span>Participantes distintos</span><b>${participants(a)} / ${a.minP} mín.</b></div>
      <div class="prow-au"><span>Venta al precio actual</span><b>${cop(venta)}</b></div>
      <div class="prow-au total"><span>Utilidad del lote</span><b>${cop(util)} · ${((util / venta) * 100 || 0).toFixed(0)} %</b></div>
      <div class="vs"><div><span>Costo</span><i style="--w:${(a.costo / max).toFixed(3)}"></i></div><div class="hot"><span>Subasta</span><i style="--w:${(venta / max).toFixed(3)}"></i></div></div>
      <p class="au-note">Si tostáramos estos 30 kg y los vendiéramos en bolsas de 340 g, serían unas ${fmtNum(Math.floor((30 * 0.83 * 1000) / 340))} bolsas. La subasta se justifica solo si supera esa venta.</p></div>`;
  }
  return `<div class="bidbox"><span class="lbl">Tu puja · mínimo <span class="mono" id="au-min"></span></span>
    <div class="quick">${[1, 2, 5].map((s) => `<button class="qbtn" data-act="bid" data-steps="${s}"><span data-q="${s}"></span><small>${s === 1 ? "mínimo" : `+${s - 1} incr.`}</small></button>`).join("")}</div>
    <div class="bid-row"><input id="au-custom" class="au-input" type="number" step="500" inputmode="numeric" placeholder="Otro monto" aria-label="Monto de la puja"><button class="bidbtn" data-act="bid-custom">Pujar</button></div>
    <p class="au-note">Pujas como <b>${esc(YO.nombre)}</b>; los demás ven un código. Pujar es un compromiso de compra.</p></div>`;
}

function updateAuction() {
  const a = UI.au, clock = $("#au-clock"); if (!clock) return;
  const left = Math.max(0, a.endsAt - Date.now());
  clock.style.setProperty("--p", a.ended ? 0 : Math.min(100, (left / a.dur) * 100).toFixed(2));
  clock.classList.toggle("urgent", !a.ended && left < EXT_MS);
  clock.classList.toggle("done", a.ended);
  $("#au-time").textContent = a.ended ? "00:00" : mmss(left);
  $("#au-clock-lbl").textContent = a.ended ? "cerrada" : "restante";

  const c = $("#au-controls"), mode = a.ended ? "end" : a.as;
  const changed = a.bids.length !== a.rendered, remount = c.dataset.mode !== mode;
  if (remount || (mode === "interno" && changed)) { c.innerHTML = controlsHTML(); c.dataset.mode = mode; }
  if (!changed && !remount) { refreshAgo(); return; }
  a.rendered = a.bids.length;

  const top = topBid(a), priceEl = $("#au-price"), txt = cop(top ? top.p : a.start);
  if (priceEl.textContent !== txt) { priceEl.textContent = txt; priceEl.classList.remove("flash"); void priceEl.offsetWidth; priceEl.classList.add("flash"); }
  $("#au-total").textContent = top ? `${a.kg} kg × ${txt} = ${cop(top.p * a.kg)} · líder: ${top.me ? "tú" : top.who}` : "Sin pujas todavía";
  const ext = a.bids.filter((b) => b.sys).length;
  $("#au-status").innerHTML = `<span class="rpill ${top && top.p >= a.reserve ? "ok" : ""}">${top && top.p >= a.reserve ? "Reserva alcanzada" : "Reserva no alcanzada"}</span>
    ${top?.me && !a.ended ? `<span class="rpill me">Vas ganando</span>` : ""}
    ${!top?.me && a.bids.some((b) => b.me) && !a.ended ? `<span class="rpill warn">Te superaron</span>` : ""}
    ${ext ? `<span class="rpill">${ext} extensión${ext > 1 ? "es" : ""}</span>` : ""}`;
  $("#au-part").textContent = `${participants(a)} participantes`;
  const min = $("#au-min");
  if (min) { min.textContent = cop(minBid(a)); document.querySelectorAll("[data-q]").forEach((q) => (q.textContent = cop(minBid(a) + (q.dataset.q - 1) * a.incr))); }
  const topId = top?.id;
  $("#au-feed").innerHTML = a.bids.slice(0, 14).map((b) => b.sys
    ? `<li class="bid sys ${b.id > a.seen ? "new" : ""}">${b.text}</li>`
    : `<li class="bid ${b.id === topId ? "top" : ""} ${b.me ? "me" : ""} ${b.id > a.seen ? "new" : ""}"><span class="who">${esc(b.who)} <span class="muted">· ${esc(b.city)}</span></span><span class="p">${cop(b.p)}</span><span class="t" data-t="${b.t}">${ago(b.t)}</span></li>`).join("");
  a.seen = a.n;
}
function refreshAgo() { document.querySelectorAll("#au-feed [data-t]").forEach((el) => (el.textContent = ago(+el.dataset.t))); }

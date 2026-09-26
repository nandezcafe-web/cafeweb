/* ============================================================
   SUBASTA DE LOTES EXCEPCIONALES (simulada)
   Subastamos café que ya compramos. Lo que costó el lote y la reserva
   no van en esta página pública: están en el panel (inventario, compra C-002).
   ============================================================ */
const BOTS = [
  { name: "Tostador #214", city: "Bogotá", cap: 49 },
  { name: "Importador #12", city: "Seúl", cap: 55 },
  { name: "Coleccionista #87", city: "Tokio", cap: 47 },
  { name: "Tostador #301", city: "Oslo", cap: 51 },
];
const EXT_MS = 20000;
const VENTANA_MS = 7 * 24 * 3600 * 1000;   // el aro del reloj cuenta la última semana

/* El lote en subasta. Reemplazar por el del productor aliado cuando esté confirmado. */
const AU_LOTE = {
  id: "S-001", productor: "Domingo Torres", finca: "Finca por confirmar", municipio: "Toledo", altitud: 1950,
  variedad: "Geisha", proceso: "Natural", puntaje: 88.5, factor: 89, nivel: "VERIFICADO",
  detalle: "Anaeróbico 96 h · Camas africanas 28 días", perfil: ["Jazmín", "Mango", "Vino blanco", "Bergamota"],
};

const POSTOR_KEY = "nandez-postor";
const postor = () => { try { return JSON.parse(localStorage.getItem(POSTOR_KEY)); } catch { return null; } };

function newAuction() {
  const now = Date.now(), cierre = Date.parse(CONFIG.subasta.cierre);
  const endsAt = isNaN(cierre) ? now + VENTANA_MS : cierre;
  const a = { start: CONFIG.subasta.salida, incr: CONFIG.subasta.incremento, reserve: CONFIG.subasta.reserva, kg: 30, minP: 3, endsAt,
    ended: false, result: null, bids: [], n: 0, seen: 0, rendered: -1, nextBot: now + 4000 };
  [[0, 38, -50], [3, 40, -32], [1, 41, -11]].forEach(([b, p, s]) =>
    a.bids.unshift({ id: ++a.n, who: BOTS[b].name, city: BOTS[b].city, p, t: now + s * 1000 }));
  a.seen = a.n;
  if (now >= endsAt) endAuction(a, true);
  return a;
}
const topBid = (a) => a.bids.find((b) => !b.sys);
const minBid = (a) => (topBid(a) ? topBid(a).p + a.incr : a.start);
const participants = (a) => new Set(a.bids.filter((b) => !b.sys).map((b) => b.who)).size;
const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
/* tiempo que falta: días y horas cuando es largo, minutos y segundos al final */
function restante(ms) {
  const en = UI.lang === "en", h = Math.floor(ms / 3600000);
  if (h >= 24) return `${Math.floor(h / 24)} ${en ? "d" : "d"} ${String(h % 24).padStart(2, "0")} h`;
  if (h >= 1) return `${h} h ${String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0")} min`;
  return mmss(ms);
}
const ago = (t) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000)), en = UI.lang === "en";
  if (s < 60) return en ? `${s} s ago` : `hace ${s} s`;
  if (s < 3600) return en ? `${Math.floor(s / 60)} min ago` : `hace ${Math.floor(s / 60)} min`;
  return en ? `${Math.floor(s / 3600)} h ago` : `hace ${Math.floor(s / 3600)} h`;
};
const fechaCierre = (a) => new Date(a.endsAt).toLocaleString(UI.lang === "en" ? "en-GB" : "es-CO",
  { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });

function placeBid(a, bid) {
  const now = Date.now();
  a.bids.unshift({ id: ++a.n, t: now, ...bid });
  if (a.endsAt - now < EXT_MS) {
    a.endsAt = now + EXT_MS;
    a.bids.unshift({ id: ++a.n, sys: true, t: now });
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
function endAuction(a, silencio) {
  a.ended = true;
  const top = topBid(a), en = UI.lang === "en";
  const valid = !!top && top.p >= a.reserve && participants(a) >= a.minP;
  a.result = { valid, top, reserva: !top || top.p < a.reserve };
  if (silencio) return;
  toast(valid ? (top.me ? (en ? `You won lot ${AU_LOTE.id} at ${usd(top.p)}/kg.` : `Ganaste el lote ${AU_LOTE.id} a ${usd(top.p)}/kg.`)
                        : (en ? `Lot awarded to ${esc(top.who)} at ${usd(top.p)}/kg.` : `Lote adjudicado a ${esc(top.who)} por ${usd(top.p)}/kg.`))
              : (en ? "The auction closed without a sale." : "La subasta quedó desierta."),
    UI.view === "subasta" ? {} : { label: en ? "See" : "Ver", act: () => go("subasta") });
}

/* Pujar exige estar inscrito: la subasta es un compromiso de compra */
function myBid(steps) {
  const a = UI.au, en = UI.lang === "en"; if (a.ended) return;
  if (!postor()) return inscribir(steps);
  const p = steps ? minBid(a) + (steps - 1) * a.incr : num("au-custom", 0);
  if (!(p >= minBid(a))) {
    const inp = $("#au-custom"); inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake");
    return toast(en ? `The minimum bid is ${usd(minBid(a))}.` : `La puja mínima es ${usd(minBid(a))}.`, { type: "err" });
  }
  placeBid(a, { who: en ? "You" : "Tú", city: postor().ciudad || "", p, me: true });
  $("#au-custom").value = "";
  a.nextBot = Math.min(a.nextBot, Date.now() + 2500 + Math.random() * 3000);
  updateAuction();
}

function inscribir(steps = 0) {
  const en = UI.lang === "en";
  modal(en ? "Register to <em>bid</em>" : "Inscríbete para <em>pujar</em>", `
    <p class="hint">${en ? "We verify every bidder before the auction. Other bidders only see a code, never your name."
      : "Verificamos a cada postor antes de la subasta. Los demás solo ven un código, nunca tu nombre."}</p>
    <div class="form-grid">
      <div class="field"><label class="lbl" for="po-nombre">${en ? "Your name" : "Tu nombre"}</label><input id="po-nombre" class="input" autocomplete="name"></div>
      <div class="field"><label class="lbl" for="po-empresa">${en ? "Company" : "Empresa"}</label><input id="po-empresa" class="input" autocomplete="organization"></div>
      <div class="field"><label class="lbl" for="po-mail">${en ? "Email" : "Correo"}</label><input id="po-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none"></div>
      <div class="field"><label class="lbl" for="po-tel">WhatsApp</label><input id="po-tel" class="input" type="tel" inputmode="tel" autocomplete="tel"></div>
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="po-ciudad">${en ? "City and country" : "Ciudad y país"}</label><input id="po-ciudad" class="input" autocomplete="address-level2"></div>
      <label class="check-line" style="grid-column:1/-1"><input type="checkbox" id="po-ok"> <span>${en
        ? "I understand that a bid is a commitment to buy, with 48 hours to pay if I win."
        : "Entiendo que pujar es un compromiso de compra, con 48 horas para pagar si gano."}</span></label>
    </div>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
      <button class="btn primary" data-act="inscribir-ok" data-steps="${steps}">${en ? "Register" : "Inscribirme"}</button></div>`, "narrow");
}
function inscribirOk(steps) {
  const en = UI.lang === "en", v = (id) => $("#" + id).value.trim();
  const d = { nombre: v("po-nombre"), empresa: v("po-empresa"), mail: v("po-mail"), tel: v("po-tel"), ciudad: v("po-ciudad") };
  if (!d.nombre || !d.empresa) return toast(en ? "Write your name and company." : "Escribe tu nombre y tu empresa.", { type: "err" });
  if (!/^\S+@\S+\.\S+$/.test(d.mail)) return toast(en ? "Write a valid email." : "Escribe un correo válido.", { type: "err" });
  if (!$("#po-ok").checked) return toast(en ? "Accept the bidding commitment." : "Acepta el compromiso de compra.", { type: "err" });
  try { localStorage.setItem(POSTOR_KEY, JSON.stringify(d)); } catch {}
  closeModal();
  registrar("postor", { ...d, lote: AU_LOTE.id },
    `Hola ${CONFIG.marca}, quiero inscribirme como postor en la subasta ${AU_LOTE.id}.\n${d.nombre} · ${d.empresa}\n${d.mail}${d.tel ? " · " + d.tel : ""}\n${d.ciudad}`,
    `Inscripción subasta ${AU_LOTE.id} · ${d.empresa}`);
  render();
  if (+steps) myBid(+steps);
}

function avisarme(fecha) {
  const en = UI.lang === "en";
  modal(en ? "Let me know" : "Avísame", `
    <p class="hint">${en ? `We write to you before the auction of ${esc(fecha)} opens, with the lots and how to ask for samples.`
      : `Te escribimos antes de que abra la subasta del ${esc(fecha)}, con los lotes y cómo pedir muestras.`}</p>
    <div class="field"><label class="lbl" for="av-mail">${en ? "Email" : "Correo"}</label><input id="av-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none"></div>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
      <button class="btn primary" data-act="avisarme-ok" data-id="${esc(fecha)}">${en ? "Notify me" : "Avisarme"}</button></div>`, "narrow");
}
function avisarmeOk(fecha) {
  const en = UI.lang === "en", mail = $("#av-mail").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(mail)) return toast(en ? "Write a valid email." : "Escribe un correo válido.", { type: "err" });
  closeModal();
  registrar("aviso-subasta", { mail, subasta: fecha },
    `Hola ${CONFIG.marca}, avísenme de la subasta del ${fecha}. Mi correo: ${mail}`, `Aviso subasta ${fecha}`);
}

function resetAuction() { UI.au = newAuction(); render(); toast(UI.lang === "en" ? "Auction reset." : "Subasta reiniciada."); }

/* ---------- vista ---------- */
function viewSubasta() {
  const a = UI.au, l = AU_LOTE, en = UI.lang === "en", yo = postor();
  const quien = en
    ? [["For collectors and roasters abroad", "One lot of 30 kg of green (unroasted) Geisha from a single farm in Toledo. There will not be another one like it this year."],
       ["In US dollars, per kilo", `It opens at ${usd(a.start)}/kg (${usdLb(a.start)}). Whoever bids highest when the clock runs out takes all 30 kg.`],
       ["Register first", "We verify every bidder and send a 100 g sample to cup before the auction."]]
    : [["Para coleccionistas y tostadores del exterior", "Un solo lote de 30 kg de Geisha verde (sin tostar), de una finca de Toledo. Este año no habrá otro igual."],
       ["En dólares, por kilo", `Arranca en ${usd(a.start)}/kg (${usdLb(a.start)}). Quien tenga la puja más alta cuando se acabe el tiempo se lleva los 30 kg.`],
       ["Primero te inscribes", "Verificamos a cada postor y le mandamos una muestra de 100 g para catar antes de la subasta."]];
  const rules = en
    ? [["When is it valid?", "It is awarded if the top bid reaches the reserve price and at least 3 different buyers take part. If not, the lot goes back to the catalogue."],
       ["Anti-sniping extension", "A bid in the last 20 seconds extends the close by 20 more seconds. The lot goes to whoever values it most, not whoever bids last."],
       ["Identity and anonymity", "We verify every bidder; bidders only see each other's code."],
       ["Samples", "Registered bidders can ask for 100 g to cup before the auction."],
       ["If the winner does not pay", "The winner has 48 hours to confirm payment. If not, the lot goes to the runner-up."],
       ["Payment and shipping", "You pay in US dollars. The price is for the coffee ready in Cúcuta; international freight and export paperwork are quoted separately and we handle them with you."]]
    : [["¿Cuándo es válida?", "Se adjudica si la puja más alta alcanza el precio de reserva y participan al menos 3 compradores distintos. Si no, el lote vuelve al catálogo."],
       ["Extensión anti-último-segundo", "Una puja en los últimos 20 segundos extiende el cierre 20 segundos más. Gana quien más valora el lote, no quien puja al final."],
       ["Identidad y anonimato", "Los postores están verificados por nosotros, pero entre ellos solo ven un código."],
       ["Muestras previas", "Los inscritos pueden pedir 100 g para catar antes de la subasta."],
       ["Incumplimiento", "El ganador tiene 48 horas para confirmar el pago. Si no, el lote pasa al segundo postor."],
       ["Pago y envío", "Se paga en dólares. El precio es por el café listo en Cúcuta; el flete internacional y los trámites de exportación se cotizan aparte y los hacemos contigo."]];
  const upcoming = en
    ? [["12", "Oct", "Toledo microlots", "6 lots · 84–87 SCA"], ["26", "Oct", "Geisha and Sidra from Norte de Santander", "4 lots · 86+ SCA"], ["09", "Nov", "Experimental processes", "5 lots · anaerobic and honey"]]
    : [["12", "oct", "Microlotes de Toledo", "6 lotes · 84–87 SCA"], ["26", "oct", "Geisha y Sidra del Norte de Santander", "4 lotes · 86+ SCA"], ["09", "nov", "Procesos experimentales", "5 lotes · anaeróbicos y honey"]];
  return `<section class="auction">
    <div class="au-top">
      <div><p class="eyebrow reveal"><span class="live-dot ${a.ended ? "off" : ""}"></span> ${en ? "Auction · lot" : "Subasta · lote"} ${esc(l.id)}</p>
        <p class="au-sub reveal" style="--i:1">${en ? "Starting price" : "Precio de salida"} ${usd(a.start)}/kg (${usdLb(a.start)}) · ${en ? "minimum increment" : "incremento mínimo"} ${usd(a.incr)} · ${a.kg} kg ${en ? "of green coffee" : "de café verde"} · ${en ? "closes" : "cierra el"} ${esc(fechaCierre(a))}</p></div>
    </div>
    <div class="au-quien reveal" style="--i:1">${quien.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div>
    <div class="au-grid">
      <article class="au-panel au-lot reveal dark-art" style="--i:1">
        <p class="kicker">${esc(tr(l.finca))} · ${esc(l.municipio)}, Norte de Santander</p>
        <h2 class="au-title">${esc(tr(l.variedad))} <em>${esc(tr(l.proceso))}</em></h2>
        <ul class="au-facts">
          <li><b>${esc(l.puntaje)}</b><small>SCA · ${lvl(l.nivel)}</small></li>
          <li><b>${fmtNum(l.altitud)}</b><small>${en ? "m a.s.l. · verified" : "msnm · verificado"}</small></li>
          <li><b>${a.kg} kg</b><small>${en ? "green · single lot" : "verde · lote único"}</small></li>
          <li><b>${esc(l.factor)}</b><small>${en ? "Yield factor" : "Factor de rendimiento"}</small></li>
        </ul>
        <p class="au-detail">${esc(tr(l.detalle))}</p>
        <ul class="notes dark">${l.perfil.map((n) => `<li>${esc(tr(n))}</li>`).join("")}</ul>
        <p class="au-note">${en
          ? `Bought by us from ${esc(l.productor)}. We auction it because it is a small, exceptional lot: an auction gets it more value than 250 g bags would.`
          : `Comprado por nosotros a ${esc(l.productor)}. Lo subastamos porque es un lote pequeño y excepcional: la subasta le saca más valor que venderlo en bolsas de 250 g.`}</p>
        <div class="au-ridge">${ridge(l, { w: 420, h: 120, dark: true })}</div>
      </article>
      <div class="au-panel au-console reveal" style="--i:2">
        <div class="clock" id="au-clock"><div><span id="au-time">--:--</span><small id="au-clock-lbl">${en ? "left" : "restante"}</small></div></div>
        <div class="au-price"><span class="lbl">${en ? "Top bid · USD/kg" : "Puja más alta · USD/kg"}</span><b id="au-price">—</b><span class="au-total" id="au-total"></span></div>
        <div class="au-status" id="au-status"></div>
        <div id="au-controls"></div>
      </div>
      <aside class="au-panel au-feed reveal" style="--i:3">
        <div class="feed-head"><h3>${en ? "Live bids" : "Pujas en vivo"}</h3><span class="mono" id="au-part"></span></div>
        <ol id="au-feed"></ol>
      </aside>
    </div>
    <div class="au-lower">
      <section class="au-panel reveal" style="--i:4"><h3>${en ? "Room <em>rules</em>" : "Reglas <em>de la sala</em>"}</h3>
        ${rules.map(([tt, p], i) => `<details class="rule" ${i === 0 ? "open" : ""}><summary>${tt}</summary><p>${p}</p></details>`).join("")}</section>
      <section class="au-panel reveal" style="--i:5"><h3>${en ? "Upcoming <em>auctions</em>" : "Próximas <em>subastas</em>"}</h3><div class="upcoming">
        ${upcoming.map(([d, m, tt, s]) => `<div class="up"><div class="date"><b>${d}</b><small>${m}</small></div><p>${tt}<small>${s}</small></p><button class="btn sm" data-act="remind" data-id="${d} ${m}">${en ? "Notify me" : "Avisarme"}</button></div>`).join("")}
        </div>
        ${yo ? `<p class="au-note">${en ? "Registered as" : "Inscrito como"} <b>${esc(yo.empresa)}</b>.</p>` : ""}
        ${demo() ? `<button class="btn sm" data-act="au-reset" style="margin-top:10px">${en ? "Reset demo auction" : "Reiniciar subasta de demostración"}</button>` : ""}</section>
    </div>
  </section>`;
}

function controlsHTML() {
  const a = UI.au, en = UI.lang === "en";
  if (a.ended) {
    const r = a.result;
    if (!r.valid) return `<div class="au-result lose"><h3>${en ? "No sale" : "Subasta desierta"}</h3><p>${r.reserva
      ? (en ? "The reserve price was not reached." : "No se alcanzó el precio de reserva.")
      : (en ? "Fewer than 3 buyers took part." : "Participaron menos de 3 compradores.")} ${en ? "The lot goes back to the catalogue and we sell it roasted." : "El lote vuelve al catálogo y lo vendemos tostado."}</p>
      <div class="btns"><button class="btn" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button></div></div>`;
    return r.top.me
      ? `<div class="au-result"><h3>${en ? "Awarded to you" : "Adjudicado a ti"}</h3><p>${a.kg} kg × ${usd(r.top.p)} = <b>${usd(r.top.p * a.kg)}</b>. ${en ? "You have 48 h to confirm payment; we will write to you." : "Tienes 48 h para confirmar el pago; te escribimos."}</p>
         <div class="btns"><button class="btn primary" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button></div></div>`
      : `<div class="au-result"><h3>${en ? "Awarded" : "Adjudicado"}</h3><p>${esc(r.top.who)} (${esc(r.top.city)}) ${en ? "won at" : "ganó con"} ${usd(r.top.p)}/kg.</p>
         <div class="btns"><button class="btn" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button></div></div>`;
  }
  const yo = postor();
  return `<div class="bidbox"><span class="lbl">${en ? "Your bid · minimum" : "Tu puja · mínimo"} <span class="mono" id="au-min"></span></span>
    <div class="quick">${[1, 2, 5].map((s) => `<button class="qbtn" data-act="bid" data-steps="${s}"><span data-q="${s}"></span><small>${s === 1 ? (en ? "minimum" : "mínimo") : `+${s - 1} ${en ? "incr." : "incr."}`}</small></button>`).join("")}</div>
    <div class="bid-row"><input id="au-custom" class="au-input" type="number" step="1" inputmode="numeric" placeholder="${en ? "Other amount" : "Otro monto"}" aria-label="${en ? "Bid amount" : "Monto de la puja"}"><button class="bidbtn" data-act="bid-custom">${en ? "Bid" : "Pujar"}</button></div>
    <p class="au-note">${yo
      ? (en ? `You bid as <b>${esc(yo.empresa)}</b>; others see a code. A bid is a commitment to buy.` : `Pujas como <b>${esc(yo.empresa)}</b>; los demás ven un código. Pujar es un compromiso de compra.`)
      : (en ? "To bid you register first (one minute). A bid is a commitment to buy." : "Para pujar te inscribes primero (un minuto). Pujar es un compromiso de compra.")}</p></div>`;
}

function updateAuction() {
  const a = UI.au, clock = $("#au-clock"), en = UI.lang === "en"; if (!clock) return;
  const left = Math.max(0, a.endsAt - Date.now());
  clock.style.setProperty("--p", a.ended ? 0 : Math.min(100, (left / VENTANA_MS) * 100).toFixed(2));
  clock.classList.toggle("urgent", !a.ended && left < EXT_MS);
  clock.classList.toggle("done", a.ended);
  $("#au-time").textContent = a.ended ? "00:00" : restante(left);
  $("#au-clock-lbl").textContent = a.ended ? t("cerrada") : (en ? "left" : "restante");

  const c = $("#au-controls"), mode = a.ended ? "end" : (postor() ? "postor" : "comprador");
  const changed = a.bids.length !== a.rendered, remount = c.dataset.mode !== mode;
  if (remount) { c.innerHTML = controlsHTML(); c.dataset.mode = mode; }
  if (!changed && !remount) { refreshAgo(); return; }
  a.rendered = a.bids.length;

  const top = topBid(a), priceEl = $("#au-price"), txt = usd(top ? top.p : a.start);
  if (priceEl.textContent !== txt) { priceEl.textContent = txt; priceEl.classList.remove("flash"); void priceEl.offsetWidth; priceEl.classList.add("flash"); }
  $("#au-total").textContent = top ? `${usdLb(top.p)} · ${a.kg} kg × ${txt} = ${usd(top.p * a.kg)} · ${en ? "leader" : "líder"}: ${top.me ? (en ? "you" : "tú") : top.who}` : (en ? "No bids yet" : "Sin pujas todavía");
  const ext = a.bids.filter((b) => b.sys).length, ok = top && top.p >= a.reserve;
  $("#au-status").innerHTML = `<span class="rpill ${ok ? "ok" : ""}">${ok ? (en ? "Reserve met" : "Reserva alcanzada") : (en ? "Reserve not met" : "Reserva no alcanzada")}</span>
    ${top?.me && !a.ended ? `<span class="rpill me">${en ? "You are winning" : "Vas ganando"}</span>` : ""}
    ${!top?.me && a.bids.some((b) => b.me) && !a.ended ? `<span class="rpill warn">${en ? "Outbid" : "Te superaron"}</span>` : ""}
    ${ext ? `<span class="rpill">${ext} ${en ? (ext > 1 ? "extensions" : "extension") : (ext > 1 ? "extensiones" : "extensión")}</span>` : ""}`;
  $("#au-part").textContent = `${participants(a)} ${en ? "bidders" : "participantes"}`;
  const min = $("#au-min");
  if (min) { min.textContent = usd(minBid(a)); document.querySelectorAll("[data-q]").forEach((q) => (q.textContent = usd(minBid(a) + (q.dataset.q - 1) * a.incr))); }
  const topId = top?.id;
  $("#au-feed").innerHTML = a.bids.slice(0, 14).map((b) => b.sys
    ? `<li class="bid sys ${b.id > a.seen ? "new" : ""}">${en ? "Bid in the last 20 s · close extended" : "Puja en los últimos 20 s · cierre extendido"}</li>`
    : `<li class="bid ${b.id === topId ? "top" : ""} ${b.me ? "me" : ""} ${b.id > a.seen ? "new" : ""}"><span class="who">${esc(b.who)} <span class="muted">· ${esc(b.city)}</span></span><span class="p">${usd(b.p)}</span><span class="t" data-t="${b.t}">${ago(b.t)}</span></li>`).join("");
  a.seen = a.n;
}
function refreshAgo() { document.querySelectorAll("#au-feed [data-t]").forEach((el) => (el.textContent = ago(+el.dataset.t))); }

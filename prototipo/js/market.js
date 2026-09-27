/* ============================================================
   MERCADO (uso interno): referencias del día, conversiones y
   cuándo conviene sacar el café.
   ============================================================ */
/* ---------- referencias automáticas: FNC y Banco de la República ---------- */
const MERCADO_API = CONFIG.sitio + "/api/mercado";
const CADA_MS = 30 * 60 * 1000;                     // el panel vuelve a mirar cada 30 minutos
const M = () => (S.mercado ||= { historial: [], leido: null, error: null });

/* anota el día en el historial (una fila por fecha) y aplica los valores al cotizador */
function aplicarReferencias({ precioCarga, fecha, ny, trm }, fuente) {
  const h = M().historial, previo = h.find((x) => x.fecha < fecha) || null;
  const fila = { fecha, precioCarga, ny, trm, fuente };
  const i = h.findIndex((x) => x.fecha === fecha);
  if (i >= 0) h[i] = fila; else h.push(fila);
  h.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  if (h.length > 120) h.length = 120;
  const antes = CONFIG.fnc.precioCarga;
  Object.assign(CONFIG.fnc, { precioCarga, fecha });
  Object.assign(CONFIG.mercado, { ny, trm });
  if (UI.q) UI.q.precioCarga = precioCarga;
  S.cfg = { fnc: { ...CONFIG.fnc }, mercado: { ...CONFIG.mercado } };
  save();
  return { antes, previo };
}

const cambio = (a, b) => (a && b ? { d: b - a, pct: ((b - a) / a) * 100 } : null);
const flecha = (d) => (d > 0 ? "sube" : d < 0 ? "baja" : "igual");

async function actualizarMercado({ avisar = true } = {}) {
  const m = M();
  try {
    const r = await fetch(MERCADO_API, { cache: "no-store" });
    const d = await r.json();
    if (!d.precioCarga || !d.fecha) throw new Error(d.error || "La FNC no respondió");
    const nuevo = d.fecha !== CONFIG.fnc.fecha || d.precioCarga !== CONFIG.fnc.precioCarga;
    const { antes } = aplicarReferencias({ precioCarga: d.precioCarga, fecha: d.fecha, ny: d.ny ?? CONFIG.mercado.ny, trm: d.trm ?? d.tasaFnc ?? CONFIG.mercado.trm }, "FNC");
    m.leido = d.leido; m.error = null; m.trmFecha = d.trmFecha; m.tasaFnc = d.tasaFnc; save();
    const c = cambio(antes, d.precioCarga);
    if (nuevo && avisar && c && c.d) toast(`La FNC ${c.d > 0 ? "subió" : "bajó"} el precio: ${cop(antes)} → ${cop(d.precioCarga)} (${c.d > 0 ? "+" : ""}${fmtNum(c.pct, 1)} %). El cotizador ya lo usa.`);
    else if (avisar === "siempre") toast("Referencias al día.");
  } catch (e) {
    m.error = String(e.message || e); save();
    if (avisar) toast("No se pudo leer el precio de la FNC. Puedes escribirlo a mano en Mercado.", { type: "err" });
  }
  if (sesionActiva()) { UI.animate = false; render(); }
}

let relojMercado = null;
function vigilarMercado() {
  if (relojMercado) return;
  actualizarMercado();
  relojMercado = setInterval(() => sesionActiva() && actualizarMercado(), CADA_MS);
  /* al volver a la pestaña después de un rato, mira de una vez */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && sesionActiva() && Date.now() - Date.parse(M().leido || 0) > CADA_MS) actualizarMercado();
  });
}

/* franja del panel: el precio de hoy y cuánto se movió frente al día anterior publicado */
function avisoMercado() {
  const m = M(), h = m.historial, hoy = h[0], ayer = h[1], c = hoy && ayer ? cambio(ayer.precioCarga, hoy.precioCarga) : null;
  const hora = m.leido ? new Date(m.leido).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }) : null;
  return `<div class="mkt-aviso ${c ? flecha(c.d) : ""}">
    <span><span class="lbl">Precio FNC · carga</span> <b class="mono">${cop(CONFIG.fnc.precioCarga)}</b></span>
    ${c && c.d ? `<span class="mkt-delta">${c.d > 0 ? "▲" : "▼"} ${cop(Math.abs(c.d))} · ${c.d > 0 ? "+" : ""}${fmtNum(c.pct, 1)} % desde el ${fmtFecha(ayer.fecha)}</span>` : ""}
    <span class="hint">Publicado el ${fmtFecha(CONFIG.fnc.fecha)} · ${m.error ? `<b class="neg">sin conexión con la FNC</b>` : hora ? `revisado a las ${hora}` : "sin revisar todavía"}</span>
    <button class="btn sm" data-act="mkt-auto">Revisar ahora</button></div>`;
}

function guardarMercado() {
  aplicarReferencias({ precioCarga: num("m-carga", CONFIG.fnc.precioCarga), fecha: $("#m-fecha").value || CONFIG.fnc.fecha,
    ny: num("m-ny", CONFIG.mercado.ny), trm: num("m-trm", CONFIG.mercado.trm) }, "manual");
  render();
  toast("Referencias guardadas a mano. El cotizador ya usa estos valores.");
}

function historialMercado() {
  const h = M().historial.slice(0, 30);
  if (!h.length) return "";
  const vals = [...h].reverse().map((x) => x.precioCarga), min = Math.min(...vals), max = Math.max(...vals), rango = max - min || 1;
  const linea = vals.length > 1 ? `<svg class="mkt-linea" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"
        points="${vals.map((v, i) => `${((i / (vals.length - 1)) * 300).toFixed(1)},${(56 - ((v - min) / rango) * 52).toFixed(1)}`).join(" ")}"/></svg>` : "";
  return `<section class="section">
    <div class="section-head"><p class="eyebrow">Historial</p><h2>Cómo se ha movido <em>el precio</em></h2>
      <p>Una fila por día en que la FNC publicó precio. Se llena sola cada vez que se abre el panel.</p></div>
    ${linea}
    <div class="table-scroll"><table class="cmp-table mkt-table">
      <thead><tr><th>Fecha</th><th>Carga FNC</th><th>Cambio</th><th>Por kg pergamino</th><th>Bolsa NY (US¢/lb)</th><th>TRM</th><th>Fuente</th></tr></thead>
      <tbody>${h.map((x, i) => { const c = h[i + 1] ? cambio(h[i + 1].precioCarga, x.precioCarga) : null;
        return `<tr><th>${fmtFecha(x.fecha)}</th><td class="mono">${cop(x.precioCarga)}</td>
          <td class="mono ${c && c.d > 0 ? "pos" : c && c.d < 0 ? "neg" : ""}">${c && c.d ? `${c.d > 0 ? "+" : "−"}${cop(Math.abs(c.d))} (${c.d > 0 ? "+" : ""}${fmtNum(c.pct, 1)} %)` : "—"}</td>
          <td class="mono">${cop(x.precioCarga / 125)}</td><td class="mono">${fmtNum(x.ny, 2)}</td><td class="mono">${cop(x.trm)}</td><td>${esc(x.fuente)}</td></tr>`; }).join("")}</tbody>
    </table></div></section>`;
}

/* Precio internacional equivalente: US¢/lb → COP por kg de café verde */
const nyCopKgVerde = () => (CONFIG.mercado.ny / 100) * CONFIG.mercado.trm / 0.4536;

function viewMercado() {
  const f = CONFIG.fnc, m = CONFIG.mercado;
  const factores = [88, 90, 92, 94, 96, 98, 100];
  const calendario = [
    ["Norte de Santander", "Cosecha principal", "sep – dic", "Es cuando hay café para comprar y cuando más baja el precio en finca. Confirmar el calendario local del comité."],
    ["Norte de Santander", "Traviesa o mitaca", "abr – jun", "Menos volumen; buen momento para microlotes y para vender lo guardado."],
    ["Brasil", "Cosecha", "may – sep", "Marca el precio mundial: cosecha grande en Brasil empuja el contrato C hacia abajo."],
    ["Mercado", "Trimestre de escasez", "mar – may", "Los inventarios del hemisferio norte están bajos antes de la cosecha brasileña; los cafés diferenciados se pagan mejor."],
  ];
  const señales = [
    ["Vender ya", "El contrato C está alto y el peso débil (TRM alta): el precio interno sube con las dos cosas.", "hot"],
    ["Guardar", "Café de 86+ puntos en plena cosecha: el mercado está lleno de café corriente y el especial se diluye.", "ref"],
    ["Guardar con cuidado", "El pergamino bien seco aguanta meses, pero la catación pierde puntos: hay que catar de nuevo a los 6 meses.", "ref"],
    ["No guardar", "Café con factor alto o humedad por encima de 12 %: se deteriora rápido. Sacarlo pronto.", "max"],
  ];
  return `<div class="view-head">
      <div><p class="eyebrow reveal">Uso interno</p>
        <h2 class="reveal" style="--i:1">Mercado <em>del día</em></h2>
        <p class="reveal" style="--i:2">Se actualizan solos desde la FNC y el Banco de la República cada vez que abres el panel y cada 30 minutos. De ellos sale todo el cotizador. Si la FNC no responde, escríbelos a mano.</p></div>
    </div>
    <div class="mkt-grid reveal" style="--i:2">
      <div class="mkt"><span class="lbl">Precio interno FNC · carga de 125 kg</span>
        <input id="m-carga" class="mkt-in mono" type="number" step="5000" value="${f.precioCarga}">
        <small>factor 94 · ${cop(f.precioCarga / 125)} por kg de pergamino</small></div>
      <div class="mkt"><span class="lbl">Contrato C · Nueva York</span>
        <input id="m-ny" class="mkt-in mono" type="number" step="1" value="${m.ny}">
        <small>US¢ por libra · ${cop(nyCopKgVerde())} por kg verde</small></div>
      <div class="mkt"><span class="lbl">TRM oficial</span>
        <input id="m-trm" class="mkt-in mono" type="number" step="0.01" value="${m.trm}">
        <small>COP por dólar${S.mercado?.trmFecha ? " · vigente el " + fmtFecha(S.mercado.trmFecha) : ""}${S.mercado?.tasaFnc ? " · la FNC usó " + fmtNum(S.mercado.tasaFnc) : ""}</small></div>
      <div class="mkt"><span class="lbl">Fecha de la referencia</span>
        <input id="m-fecha" class="mkt-in" type="date" value="${f.fecha}">
        <small>Publicado por la FNC cada día hábil</small></div>
      <div class="mkt act"><button class="btn primary" data-act="mkt-auto">Revisar ahora</button>
        <button class="btn sm" data-act="mkt-save">Guardar a mano</button>
        <small>Fuente: federaciondecafeteros.org · datos.gov.co (TRM)</small></div>
    </div>
    ${historialMercado()}

    <section class="section">
      <div class="section-head"><p class="eyebrow">Tabla rápida</p><h2>Precio según <em>el factor</em></h2>
        <p>El precio se mueve con lo que rinde la carga: a factor 94 rinde 93,1 kg de excelso; a factor 100 solo 87,5 kg.</p></div>
      <div class="table-scroll"><table class="cmp-table mkt-table">
        <thead><tr><th>Factor</th>${factores.map((x) => `<th class="${x === 94 ? "best" : ""}">${x}</th>`).join("")}</tr></thead>
        <tbody>
          <tr><th>kg de excelso por carga</th>${factores.map((x) => `<td class="mono">${fmtNum((125 * 70) / x, 1)}</td>`).join("")}</tr>
          <tr><th>COP por carga</th>${factores.map((x) => `<td class="mono">${cop(f.precioCarga * (94 / x))}</td>`).join("")}</tr>
          <tr><th>COP por kg pergamino</th>${factores.map((x) => `<td class="mono">${cop(precioComiteKg(x))}</td>`).join("")}</tr>
          <tr><th>COP por arroba (12,5 kg)</th>${factores.map((x) => `<td class="mono">${cop(precioComiteKg(x) * 12.5)}</td>`).join("")}</tr>
        </tbody></table></div>
      <p class="hint">Cálculo propio a partir del precio de referencia. Las cooperativas aplican además castigos por humedad y por taza, así que el pago real puede ser algo menor.</p>
    </section>

    <section class="section">
      <div class="section-head"><p class="eyebrow">Equivalencias</p><h2>Las cuentas <em>de bolsillo</em></h2></div>
      <div class="eqs">
        ${[["1 carga", "125 kg de pergamino seco = 10 arrobas"], ["1 arroba", "12,5 kg"], ["Factor 94", "94 kg de pergamino → 70 kg de excelso"],
           ["Trilla", "1 kg de pergamino → " + fmtNum(70 / 94, 3) + " kg de verde a factor 94"], ["Cereza", "~5 kg de cereza → 1 kg de pergamino seco"],
           ["Tueste", "1 kg de verde → ~0,83 kg tostado (17 % de merma)"], ["Bolsa de 250 g", "~" + fmtNum(1000 / 250, 1) + " bolsas por kg tostado"],
           ["Humedad", "Base de negociación: 12 %. Más húmedo, menos peso real"]].map(([k, v]) => `<div class="eq"><b>${k}</b><span>${v}</span></div>`).join("")}
      </div>
    </section>

    <section class="section">
      <div class="section-head"><p class="eyebrow">Calendario</p><h2>Cuándo hay café <em>y cuándo falta</em></h2></div>
      <div class="table-scroll"><table class="cmp-table"><thead><tr><th>Dónde</th><th>Qué</th><th>Cuándo</th><th>Qué significa para nosotros</th></tr></thead>
        <tbody>${calendario.map(([a, b, c, d]) => `<tr><th>${a}</th><td>${b}</td><td class="mono">${c}</td><td>${d}</td></tr>`).join("")}</tbody></table></div>
    </section>

    <section class="section">
      <div class="section-head"><p class="eyebrow">Señales</p><h2>Vender <em>o guardar</em></h2></div>
      <div class="signals">${señales.map(([t, d, k]) => `<div class="sig ${k}"><b>${t}</b><span>${d}</span></div>`).join("")}</div>
      <p class="hint">Contexto a septiembre de 2026: tras dos años de precios altos por escasez, el mercado espera una cosecha récord en Brasil y más oferta, aunque los inventarios siguen bajos. Revisar antes de decidir si guardamos café esperando mejor precio.</p>
    </section>`;
}

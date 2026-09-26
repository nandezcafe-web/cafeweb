/* ============================================================
   MERCADO (uso interno): referencias del día, conversiones y
   cuándo conviene sacar el café.
   ============================================================ */
function aplicarCfgGuardada() {
  if (S.cfg?.fnc) Object.assign(CONFIG.fnc, S.cfg.fnc);
  if (S.cfg?.mercado) Object.assign(CONFIG.mercado, S.cfg.mercado);
}
function guardarMercado() {
  CONFIG.fnc.precioCarga = num("m-carga", CONFIG.fnc.precioCarga);
  CONFIG.fnc.fecha = $("#m-fecha").value || CONFIG.fnc.fecha;
  CONFIG.mercado.ny = num("m-ny", CONFIG.mercado.ny);
  CONFIG.mercado.trm = num("m-trm", CONFIG.mercado.trm);
  if (UI.q) UI.q.precioCarga = CONFIG.fnc.precioCarga;
  S.cfg = { fnc: { ...CONFIG.fnc }, mercado: { ...CONFIG.mercado } };
  save(); render();
  toast("Referencias actualizadas. El cotizador ya usa estos valores.");
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
        <p class="reveal" style="--i:2">Actualiza estos tres números antes de salir a comprar. De ellos sale todo el cotizador.</p></div>
    </div>
    <div class="mkt-grid reveal" style="--i:2">
      <div class="mkt"><span class="lbl">Precio interno FNC · carga de 125 kg</span>
        <input id="m-carga" class="mkt-in mono" type="number" step="5000" value="${f.precioCarga}">
        <small>factor 94 · ${cop(f.precioCarga / 125)} por kg de pergamino</small></div>
      <div class="mkt"><span class="lbl">Contrato C · Nueva York</span>
        <input id="m-ny" class="mkt-in mono" type="number" step="1" value="${m.ny}">
        <small>US¢ por libra · ${cop(nyCopKgVerde())} por kg verde</small></div>
      <div class="mkt"><span class="lbl">TRM</span>
        <input id="m-trm" class="mkt-in mono" type="number" step="10" value="${m.trm}">
        <small>COP por dólar</small></div>
      <div class="mkt"><span class="lbl">Fecha de la referencia</span>
        <input id="m-fecha" class="mkt-in" type="date" value="${f.fecha}">
        <small>Publicado por la FNC cada día hábil</small></div>
      <div class="mkt act"><button class="btn primary" data-act="mkt-save">Guardar referencias</button>
        <small>Fuente: federaciondecafeteros.org · preciocafe.com</small></div>
    </div>

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
           ["Tueste", "1 kg de verde → ~0,83 kg tostado (17 % de merma)"], ["Bolsa de 340 g", "~" + fmtNum(1000 / 340, 1) + " bolsas por kg tostado"],
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

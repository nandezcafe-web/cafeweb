/* ============================================================
   COTIZADOR (uso interno): cuánto podemos pagar en la finca
   Cadena: cereza → pergamino seco → excelso (trilla) → tostado → bolsas
   ============================================================ */
function nuevaCot() {
  return { estado: "Pergamino seco", kg: 125, factor: 94, humedad: 11, sca: 85,
    precioCarga: CONFIG.fnc.precioCarga, ...COSTOS, presentacion: 250, precioVenta: 38000 };
}

function calcCot(d) {
  const CER = Math.max(1, d.cerezaAPergamino);
  const kgPerg = d.estado === "Cereza" ? d.kg / CER : d.estado === "Verde" ? (d.kg * d.factor) / 70 : d.kg;
  const kgPerg12 = pesoSeco12(kgPerg, d.humedad);
  const kgVerde = d.estado === "Verde" ? d.kg : kgExcelso(kgPerg12, d.factor);
  const comiteKg = (d.precioCarga * (CONFIG.fnc.factorBase / d.factor)) / 125;
  const valorComite = comiteKg * kgPerg12;

  const kgTostado = kgVerde * (1 - d.mermaTueste / 100);
  const bolsas = Math.floor((kgTostado * 1000) / Math.max(1, d.presentacion));
  const ingresos = bolsas * d.precioVenta;

  const costoProceso = d.transporte * kgPerg + d.trilla * kgPerg + d.tueste * kgVerde + d.empaque * bolsas + (ingresos * d.indirectos) / 100;
  const maxTotal = ingresos * (1 - d.margenObjetivo / 100) - costoProceso;   // lo máximo que puede costar el café
  const maxKg = kgPerg12 > 0 ? maxTotal / kgPerg12 : 0;
  const sugeridoKg = Math.min(comiteKg * (1 + d.primaSugerida / 100), Math.max(maxKg, 0));
  const sugeridoTope = comiteKg * (1 + d.primaSugerida / 100) > maxKg;

  const compra = sugeridoKg * kgPerg12;
  const costoTotal = compra + costoProceso;
  const utilidad = ingresos - costoTotal;
  const margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;
  const costoBolsa = bolsas ? costoTotal / bolsas : 0;
  const extraProductor = (sugeridoKg - comiteKg) * kgPerg12;

  return { kgPerg, kgPerg12, kgVerde, kgTostado, bolsas, comiteKg, valorComite, maxKg, sugeridoKg, sugeridoTope,
    ingresos, costoProceso, compra, costoTotal, utilidad, margen, costoBolsa, extraProductor,
    equilibrioBolsa: bolsas ? costoTotal / bolsas : 0 };
}

const fIn = (id, label, val, { step = 1, suf = "", min = 0 } = {}) =>
  `<div class="field"><label class="lbl" for="q-${id}">${label}${suf ? ` <span class="unit">${suf}</span>` : ""}</label>
   <input id="q-${id}" class="input mono" type="number" step="${step}" min="${min}" value="${val}" data-q="${id}"></div>`;

function viewCotizador() {
  const d = (UI.q ||= nuevaCot());
  return `<div class="view-head">
      <div><p class="eyebrow reveal">Uso interno · no es parte de la tienda</p>
        <h2 class="reveal" style="--i:1">Cotizador <em>de finca</em></h2>
        <p class="reveal" style="--i:2">Antes de ofrecer un precio: qué le pagaría hoy el comité por ese café, cuánto podemos pagar nosotros como máximo y con cuánto margen quedamos.</p></div>
      <div class="ref-chip reveal" style="--i:3">
        <span class="lbl">Referencia FNC · ${fmtFecha(CONFIG.fnc.fecha)}</span>
        <b class="mono">${cop(CONFIG.fnc.precioCarga)}</b><small>carga de 125 kg · factor 94</small>
        <button class="btn sm" data-act="atab" data-tab="mercado">Actualizar</button></div>
    </div>
    <div class="cot">
      <form class="cot-form" onsubmit="return false">
        <section class="wpanel">
          <h3>1 · El café que ofrecen</h3>
          <div class="form-grid">
            <div class="field"><label class="lbl" for="q-estado">Estado</label>
              <select id="q-estado" class="input" data-q="estado">${["Cereza", "Pergamino seco", "Verde"].map((o) => `<option ${o === d.estado ? "selected" : ""}>${o}</option>`).join("")}</select></div>
            ${fIn("kg", "Cantidad", d.kg, { suf: "kg" })}
            ${fIn("factor", "Factor de rendimiento", d.factor, { step: 0.5, suf: "kg cps → 70 kg excelso" })}
            ${fIn("humedad", "Humedad", d.humedad, { step: 0.5, suf: "%" })}
            ${fIn("sca", "Puntaje SCA", d.sca, { step: 0.25, suf: "si ya está catado" })}
            ${fIn("cerezaAPergamino", "Cereza → pergamino", d.cerezaAPergamino, { step: 0.1, suf: "kg : 1 kg" })}
          </div>
          <p class="hint">El factor es lo que más mueve el precio: a factor 94, 125 kg de pergamino rinden 93 kg de excelso; a factor 100 solo rinden 87,5 kg.</p>
        </section>
        <section class="wpanel">
          <h3>2 · Costos hasta la bolsa</h3>
          <div class="form-grid">
            ${fIn("transporte", "Transporte", d.transporte, { step: 50, suf: "COP/kg pergamino" })}
            ${fIn("trilla", "Trilla", d.trilla, { step: 50, suf: "COP/kg pergamino" })}
            ${fIn("tueste", "Tueste (maquila)", d.tueste, { step: 100, suf: "COP/kg verde" })}
            ${fIn("empaque", "Empaque y etiqueta", d.empaque, { step: 100, suf: "COP/bolsa" })}
            ${fIn("mermaTueste", "Merma de tueste", d.mermaTueste, { step: 0.5, suf: "%" })}
            ${fIn("indirectos", "Indirectos y ventas", d.indirectos, { step: 0.5, suf: "% de la venta" })}
          </div>
        </section>
        <section class="wpanel">
          <h3>3 · Cómo lo vendemos</h3>
          <div class="form-grid">
            ${fIn("presentacion", "Presentación", d.presentacion, { step: 10, suf: "gramos" })}
            ${fIn("precioVenta", "Precio de venta", d.precioVenta, { step: 500, suf: "COP por bolsa" })}
            ${fIn("margenObjetivo", "Margen objetivo", d.margenObjetivo, { step: 1, suf: "%" })}
            ${fIn("primaSugerida", "Prima sobre el comité", d.primaSugerida, { step: 1, suf: "% que ofrecemos de entrada" })}
            ${fIn("precioCarga", "Precio FNC por carga", d.precioCarga, { step: 5000, suf: "COP · factor 94" })}
          </div>
        </section>
      </form>
      <aside class="cot-res" id="cot-res"></aside>
    </div>
    ${comprasHTML()}`;
}

function cotResHTML() {
  const d = UI.q, r = calcCot(d);
  const max = Math.max(r.comiteKg, r.sugeridoKg, r.maxKg, 1);
  const barra = (label, v, cls) => `<div class="cbar ${cls}"><span>${label}</span><i style="--w:${Math.max(0, v / max).toFixed(3)}"></i><b class="mono">${cop(v)}</b></div>`;
  const alertas = [];
  if (d.humedad > 12) alertas.push(["warn", `Humedad ${d.humedad} %: el peso se ajusta a base 12 % (${fmtNum(r.kgPerg12)} kg). Pide que lo sequen o descuenta el peso.`]);
  if (d.humedad < 10) alertas.push(["warn", `Humedad ${d.humedad} %: café sobresecado, pierde calidad en taza.`]);
  if (d.factor > 96) alertas.push(["warn", `Factor ${d.factor}: mucha pasilla y broca. Rinde poco; ofrece menos o no compres.`]);
  if (r.sugeridoTope) alertas.push(["bad", `La prima de ${d.primaSugerida} % se pasa del máximo. Ofrece hasta ${cop(r.maxKg)}/kg o sube el precio de venta.`]);
  if (r.margen < d.margenObjetivo - 0.5) alertas.push(["bad", `Margen ${r.margen.toFixed(1)} %, por debajo del objetivo.`]);
  if (d.sca >= 86) alertas.push(["good", `${d.sca} SCA: candidato a subasta o a línea especial, no a la mezcla de casa.`]);
  if (r.utilidad <= 0) alertas.push(["bad", "A este precio de venta el lote pierde plata."]);

  return `<div class="res-card">
      <span class="lbl">Máximo que podemos pagar</span>
      <b class="big mono">${cop(r.maxKg)}<small>/kg pergamino</small></b>
      <p class="hint">Con margen objetivo del ${d.margenObjetivo} %. Por encima de esto, el negocio no da.</p>
      <div class="cbars">
        ${barra("Comité hoy", r.comiteKg, "ref")}
        ${barra("Nuestra oferta", r.sugeridoKg, "hot")}
        ${barra("Nuestro tope", r.maxKg, "max")}
      </div>
      <div class="prow-au"><span>Oferta sugerida por el lote</span><b>${cop(r.sugeridoKg * r.kgPerg12)}</b></div>
      <div class="prow-au"><span>Le pagarían en el comité</span><b>${cop(r.valorComite)}</b></div>
      <div class="prow-au total"><span>El productor gana de más</span><b>${cop(r.extraProductor)}</b></div>
    </div>
    <div class="res-card">
      <span class="lbl">De este lote salen</span>
      <div class="chain">
        <div><b class="mono">${fmtNum(r.kgPerg12)}</b><small>kg pergamino (12 %)</small></div>
        <div><b class="mono">${fmtNum(r.kgVerde)}</b><small>kg verde tras trilla</small></div>
        <div><b class="mono">${fmtNum(r.kgTostado)}</b><small>kg tostado</small></div>
        <div class="end"><b class="mono">${fmtNum(r.bolsas)}</b><small>bolsas de ${d.presentacion} g</small></div>
      </div>
      <div class="prow-au"><span>Venta total</span><b>${cop(r.ingresos)}</b></div>
      <div class="prow-au"><span>Compra del café</span><b>−${cop(r.compra)}</b></div>
      <div class="prow-au"><span>Trilla, tueste, empaque, fletes</span><b>−${cop(r.costoProceso)}</b></div>
      <div class="prow-au total"><span>Utilidad bruta</span><b>${cop(r.utilidad)} · ${r.margen.toFixed(1)} %</b></div>
      <div class="prow-au"><span>Costo por bolsa</span><b>${cop(r.costoBolsa)}</b></div>
      <div class="prow-au"><span>Precio mínimo por bolsa</span><b>${cop(r.equilibrioBolsa)}</b></div>
    </div>
    ${alertas.length ? `<ul class="alerts">${alertas.map(([k, t]) => `<li class="al-${k}">${t}</li>`).join("")}</ul>` : ""}
    <div class="res-actions">
      <button class="btn sm" data-act="cot-reset">Limpiar</button>
      <button class="btn primary sm" data-act="cot-save">Registrar como compra</button>
    </div>`;
}

function renderCot() { const el = $("#cot-res"); if (el) el.innerHTML = cotResHTML(); }

function cotSave() {
  const d = UI.q, r = calcCot(d);
  modal("Registrar <em>compra</em>", `<div class="form-grid">
      <div class="field"><label class="lbl" for="cs-prod">Productor</label><input id="cs-prod" class="input" placeholder="Nombre"></div>
      <div class="field"><label class="lbl" for="cs-finca">Finca</label><input id="cs-finca" class="input" placeholder="Finca"></div>
      <div class="field"><label class="lbl" for="cs-mun">Municipio</label><input id="cs-mun" class="input" value="Chinácota"></div>
      <div class="field"><label class="lbl" for="cs-precio">Precio acordado (COP/kg)</label><input id="cs-precio" class="input mono" type="number" step="100" value="${Math.round(r.sugeridoKg)}"></div>
      <div class="field"><label class="lbl" for="cs-destino">Destino</label><select id="cs-destino" class="input"><option>Tostado</option><option>Subasta</option><option>Venta en verde</option></select></div>
    </div>
    <p class="hint">Queda ${fmtNum(d.kg)} kg de ${d.estado.toLowerCase()}, factor ${d.factor}, humedad ${d.humedad} %.</p>
    <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="cot-save-ok">Guardar</button></div>`, "narrow");
}
function cotSaveOk() {
  const d = UI.q;
  const c = { id: nextId("C"), productor: $("#cs-prod").value.trim() || "Sin nombre", finca: $("#cs-finca").value.trim() || "—",
    municipio: $("#cs-mun").value.trim(), fecha: isoToday(), estadoCafe: d.estado, kg: d.kg, factor: d.factor, humedad: d.humedad,
    precioKg: +$("#cs-precio").value || 0, destino: $("#cs-destino").value, estado: "EN BODEGA" };
  S.compras.unshift(c); save(); closeModal(); render();
  toast(`Compra ${c.id} registrada: ${fmtNum(c.kg)} kg a ${cop(c.precioKg)}/kg.`);
}

function comprasHTML() {
  if (!S.compras.length) return "";
  const kg = S.compras.reduce((s, c) => s + c.kg, 0), inv = S.compras.reduce((s, c) => s + c.kg * c.precioKg, 0);
  return `<section class="section">
    <div class="view-head"><div><h2>Café <em>comprado</em></h2>
      <p>${S.compras.length} compras · ${fmtNum(kg)} kg · ${copK(inv)} invertidos</p></div></div>
    <div class="list">${S.compras.map((c, i) => `<div class="item" style="--i:${i}">
      <span class="avatar">${esc(c.productor[0] || "?")}</span>
      <div><p class="kicker">${esc(c.id)} · ${fmtFecha(c.fecha)} · ${esc(c.municipio)}</p>
        <h4>${esc(c.productor)} <em class="muted">${esc(c.finca)}</em></h4>
        <p class="mono">${fmtNum(c.kg)} kg ${esc(c.estadoCafe.toLowerCase())} · factor ${c.factor} · ${cop(c.precioKg)}/kg = ${cop(c.kg * c.precioKg)}</p>
        <p class="hint" style="margin:6px 0 0">Rinde ~${fmtNum(kgExcelso(c.kg, c.factor))} kg verde · destino: ${esc(c.destino.toLowerCase())}</p></div>
      <div class="item-actions"><span class="status">${esc(c.estado.toLowerCase())}</span></div></div>`).join("")}</div>
  </section>`;
}

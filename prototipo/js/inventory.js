/* ============================================================
   INVENTARIO (uso interno): de la compra a la bolsa vendida.
   Responde: ¿cuánta plata hay quieta en bodega y cuánto llevamos recuperado?
   ============================================================ */
const ETAPAS = ["EN BODEGA", "TRILLADO", "TOSTADO", "EMPACADO", "VENDIDO"];

const costoTotal = (c) => Object.values(c.costos || {}).reduce((s, v) => s + v, 0);
const costoBolsa = (c) => (c.bolsas ? costoTotal(c) / c.bolsas : 0);
const recuperado = (c) => c.ingresos || 0;
const enJuego = (c) => Math.max(0, costoTotal(c) - recuperado(c));      // plata todavía sin recuperar
const factorReal = (c) => (c.kgVerde ? (c.kg * 70) / c.kgVerde : null);
const mermaReal = (c) => (c.kgVerde && c.kgTostado ? (1 - c.kgTostado / c.kgVerde) * 100 : null);
const dias = (iso) => Math.round((Date.now() - new Date(iso + "T00:00:00")) / 86400000);
/* Valor de venta de lo que queda, al precio del producto ligado (o al último precio conocido) */
function valorPendiente(c) {
  const p = S.productos.find((x) => x.loteId === c.id);
  const precio = p ? p.precio : c.precioVenta || 0;
  return bolsasLibres(c) * precio;
}

function viewInventario() {
  const abiertas = S.compras.filter((c) => c.estado !== "VENDIDO");
  const invertido = S.compras.reduce((s, c) => s + costoTotal(c), 0);
  const quieto = S.compras.reduce((s, c) => s + enJuego(c), 0);
  const recup = S.compras.reduce((s, c) => s + recuperado(c), 0);
  const porVender = S.compras.reduce((s, c) => s + valorPendiente(c), 0);
  const kgBodega = abiertas.reduce((s, c) => s + (c.kgTostado || c.kgVerde || c.kg), 0);
  return `<div class="view-head">
      <div><p class="eyebrow reveal">Uso interno</p>
        <h2 class="reveal" style="--i:1">Inventario <em>y costos reales</em></h2>
        <p class="reveal" style="--i:2">Cada lote desde que se compra hasta que se vende la última bolsa. Aquí se ve cuánta plata está quieta.</p></div>
      <div class="ref-chip reveal" style="--i:3"><span class="lbl">Plata sin recuperar</span><b class="mono">${copK(quieto)}</b>
        <small>${fmtNum(kgBodega)} kg en bodega</small></div>
    </div>
    <div class="kpis reveal" style="--i:3">
      <div class="kpi"><b data-count="${invertido}" data-pre="$">${cop(invertido)}</b><small>invertido en total</small></div>
      <div class="kpi ${quieto > recup ? "alert" : ""}"><b data-count="${quieto}" data-pre="$">${cop(quieto)}</b><small>sin recuperar</small></div>
      <div class="kpi"><b data-count="${recup}" data-pre="$">${cop(recup)}</b><small>ya vendido</small></div>
      <div class="kpi"><b data-count="${porVender}" data-pre="$">${cop(porVender)}</b><small>valor de lo que queda</small></div>
      <div class="kpi"><b data-count="${recup + porVender - invertido}" data-pre="$">${cop(recup + porVender - invertido)}</b><small>utilidad si se vende todo</small></div>
    </div>
    <div class="list">${S.compras.map(loteCard).join("")}</div>
    <p class="hint">Los costos que no se han registrado todavía (trilla, tueste, empaque) no están sumados: el costo por bolsa sube cuando se registren.</p>`;
}

function loteCard(c, i) {
  const idx = ETAPAS.indexOf(c.estado), total = costoTotal(c), rec = recuperado(c), pend = valorPendiente(c);
  const util = rec + pend - total, margen = rec + pend > 0 ? (util / (rec + pend)) * 100 : 0;
  const fr = factorReal(c), mm = mermaReal(c), d = dias(c.fecha);
  const stepper = `<div class="stepper" aria-label="Etapa: ${esc(c.estado)}">${ETAPAS.map((s, k) =>
    `${k ? `<i class="${k <= idx ? "on" : ""}"></i>` : ""}<b class="${k <= idx ? "on" : ""} ${k === idx ? "now" : ""}" title="${s.toLowerCase()}"></b>`).join("")}</div>
    <div class="stepper-label">${esc(c.estado.toLowerCase())} · ${d} días en bodega</div>`;
  const acciones = {
    "EN BODEGA": `<button class="btn primary sm" data-act="inv-paso" data-id="${c.id}" data-p="trilla">Registrar trilla</button>`,
    "TRILLADO": `<button class="btn primary sm" data-act="inv-paso" data-id="${c.id}" data-p="tueste">Registrar tueste</button>`,
    "TOSTADO": `<button class="btn primary sm" data-act="inv-paso" data-id="${c.id}" data-p="empaque">Registrar empaque</button>`,
    "EMPACADO": `<button class="btn primary sm" data-act="inv-paso" data-id="${c.id}" data-p="venta">Registrar venta directa</button>`,
    "VENDIDO": `<span class="status">cerrado</span>`,
  }[c.estado];
  const detalle = [
    [`${fmtNum(c.kg)} kg pergamino`, `factor declarado ${c.factor}${fr ? ` · real ${fr.toFixed(1)}` : ""}`],
    c.kgVerde ? [`${fmtNum(c.kgVerde)} kg verde`, `tras trilla`] : null,
    c.kgTostado ? [`${fmtNum(c.kgTostado)} kg tostado`, `merma ${mm.toFixed(1)} %`] : null,
    c.bolsas ? [`${fmtNum(c.bolsas)} bolsas`, `${fmtNum(Math.round(c.bolsasVendidas || 0))} vendidas · ${fmtNum(bolsasLibres(c))} en stock`] : null,
  ].filter(Boolean);
  return `<div class="item lote" style="--i:${i}">
    <div><p class="kicker">${esc(c.id)} · ${fmtFecha(c.fecha)} · ${esc(c.municipio)}</p>
      <h4>${esc(c.productor)} <em class="muted">${esc(c.finca)}</em></h4>
      <div class="chain small">${detalle.map(([a, b], k) => `<div class="${k === detalle.length - 1 ? "end" : ""}"><b class="mono">${a}</b><small>${b}</small></div>`).join("")}</div>
      ${stepper}</div>
    <div class="lote-num">
      <div class="prow-au"><span>Compra a ${cop(c.precioKg)}/kg · <b class="sobre">+${Math.round((c.precioKg / precioComiteKg(c.factor) - 1) * 100)} %</b> sobre la referencia del día</span><b>${cop(c.costos.compra)}</b></div>
      ${["trilla", "tueste", "empaque", "otros"].filter((k) => c.costos[k]).map((k) => `<div class="prow-au"><span>${k[0].toUpperCase() + k.slice(1)}</span><b>${cop(c.costos[k])}</b></div>`).join("")}
      <div class="prow-au"><span>Costo total${c.bolsas ? ` · ${cop(costoBolsa(c))}/bolsa` : ""}</span><b>${cop(total)}</b></div>
      <div class="prow-au"><span>Recuperado</span><b>${cop(rec)}</b></div>
      <div class="prow-au"><span>Queda por vender</span><b>${cop(pend)}</b></div>
      <div class="prow-au total"><span>Utilidad proyectada</span><b>${cop(util)} · ${margen.toFixed(0)} %</b></div>
      ${d > 120 && enJuego(c) > 0 ? `<p class="al-warn mini">${d} días en bodega: la catación pierde vigencia y la plata sigue quieta.</p>` : ""}
      ${fr && fr > c.factor + 1.5 ? `<p class="al-bad mini">El factor real (${fr.toFixed(1)}) salió peor que el declarado (${c.factor}): rindió menos de lo pagado.</p>` : ""}
      <div class="item-actions">${acciones}</div>
    </div></div>`;
}

/* ---------- registrar cada paso ---------- */
const PASOS = {
  trilla: { titulo: "Registrar trilla", campos: [["kgVerde", "Café verde obtenido (kg)", (c) => Math.round(kgExcelso(c.kg, c.factor) * 10) / 10], ["costo", "Costo de la trilla (COP)", (c) => Math.round(c.kg * COSTOS.trilla)]], estado: "TRILLADO" },
  tueste: { titulo: "Registrar tueste", campos: [["kgTostado", "Café tostado obtenido (kg)", (c) => Math.round(c.kgVerde * (1 - COSTOS.mermaTueste / 100) * 10) / 10], ["costo", "Costo del tueste (COP)", (c) => Math.round(c.kgVerde * COSTOS.tueste)]], estado: "TOSTADO" },
  empaque: { titulo: "Registrar empaque", campos: [["presentacion", "Presentación (gramos)", () => 340], ["precioVenta", "Precio de venta por bolsa (COP)", () => 32000], ["costo", "Costo de empaque y etiquetas (COP)", (c) => Math.round((c.kgTostado * 1000 / 340) * COSTOS.empaque)]], estado: "EMPACADO" },
  venta: { titulo: "Registrar venta directa", campos: [["bolsas", "Bolsas vendidas", () => 10], ["precio", "Precio por bolsa (COP)", (c) => c.precioVenta || 32000]], estado: "EMPACADO" },
};

function invPaso(id, paso) {
  const c = S.compras.find((x) => x.id === id), p = PASOS[paso];
  UI.paso = { id, paso };
  modal(`${p.titulo} · <em>${esc(c.id)}</em>`, `<div class="form-grid">
      ${p.campos.map(([k, label, def]) => `<div class="field"><label class="lbl" for="ip-${k}">${label}</label>
        <input id="ip-${k}" class="input mono" type="number" step="1" value="${def(c)}"></div>`).join("")}
    </div>
    <p class="hint">${paso === "trilla" ? "Con el peso real calculamos el factor verdadero del lote."
      : paso === "tueste" ? "Con el peso tostado sale la merma real, que casi siempre es distinta a la estimada."
      : paso === "empaque" ? "Al empacar creamos el café en la tienda y cada venta descuenta de este lote."
      : "Para ventas de contado, ferias o cafeterías que no pasan por la tienda."}</p>
    <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="inv-paso-ok">Guardar</button></div>`, "narrow");
}

function invPasoOk() {
  const { id, paso } = UI.paso, c = S.compras.find((x) => x.id === id);
  const v = (k) => num("ip-" + k, 0);
  if (paso === "trilla") { c.kgVerde = v("kgVerde"); c.costos.trilla = v("costo"); c.estado = "TRILLADO"; }
  if (paso === "tueste") { c.kgTostado = v("kgTostado"); c.costos.tueste = v("costo"); c.estado = "TOSTADO"; }
  if (paso === "empaque") {
    const g = v("presentacion") || 340;
    c.bolsas = Math.floor((c.kgTostado * 1000) / g); c.bolsasVendidas = c.bolsasVendidas || 0;
    c.precioVenta = v("precioVenta"); c.costos.empaque = v("costo"); c.estado = "EMPACADO";
    const p = { id: nextId("P"), loteId: c.id, nombre: c.municipio, sub: `Lote ${c.id}`, origen: `${c.finca} · ${c.municipio}`,
      altitud: 1700, proceso: "Lavado", variedad: "Por definir", puntaje: c.sca || 84, tueste: "Medio", notas: ["Recién empacado"],
      presentacion: g, precio: c.precioVenta, stock: c.bolsas, nivel: "DECLARADO", fuente: "Nuestra tostión", fecha: isoToday() };
    S.productos.unshift(p);
    toast(`${fmtNum(c.bolsas)} bolsas listas. Ya aparecen en la tienda.`, { label: "Ver tienda", act: () => go("tienda") });
  }
  if (paso === "venta") {
    const n = Math.min(v("bolsas"), bolsasLibres(c)), precio = v("precio");
    c.bolsasVendidas = (c.bolsasVendidas || 0) + n; c.ingresos = (c.ingresos || 0) + n * precio;
    const p = S.productos.find((x) => x.loteId === c.id); if (p) p.stock = Math.max(0, p.stock - n);
    if (!bolsasLibres(c)) c.estado = "VENDIDO";
    toast(`Venta registrada: ${n} bolsas por ${cop(n * precio)}.`);
  }
  save(); closeModal(); render();
}

/* Las ventas de la tienda se descuentan del lote que las produjo */

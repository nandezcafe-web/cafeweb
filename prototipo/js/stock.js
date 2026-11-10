/* ============================================================
   PANEL · STOCK
   Lo que queda de cada presentación para vender en la página.
   La cifra de verdad vive en la hoja Stock de Google: la tienda la
   lee al cargar, cada pedido la descuenta y cada cancelación la
   devuelve. Aquí se ve y se corrige a mano (llegó café, se dañó una
   bolsa, el conteo no cuadra).
   Esto es solo el stock de venta. El inventario por lote (bodega,
   trilla, tueste) y los costos van en el otro panel.
   ============================================================ */
const ST = { datos: null, cargando: false, error: null };
const ST_POCO = 5;   /* de aquí para abajo, la fila se marca */

function stCargar() {
  if (!CONFIG.registro || !coClave()) return;
  ST.cargando = true; ST.error = null; render();
  fetch(CONFIG.registro + "?accion=existencias&clave=" + encodeURIComponent(coClave()))
    .then((r) => r.json())
    .then((j) => {
      ST.cargando = false;
      if (!j.ok) ST.error = j.error === "clave" ? "La clave no coincide. Cámbiala en la pestaña Correos." : "El script respondió con un error.";
      else if (!Array.isArray(j.existencias)) ST.error = "viejo";
      else ST.datos = j;
      render();
    })
    .catch(() => { ST.cargando = false; ST.error = "No se pudo conectar con la hoja. Si el script se actualizó, publica una versión nueva de la implementación."; render(); });
}

/* El catálogo dice qué presentaciones existen; la hoja, cuánto queda de cada una.
   Una presentación sin fila en la hoja todavía no ha tenido pedidos: la tienda
   usa el número del catálogo hasta que entre el primero o se fije aquí. */
function stFilas() {
  const hoja = {}, vistas = {}, filas = [];
  ST.datos.existencias.forEach((x) => { hoja[x.id] = x; });
  S.productos.forEach((p) => p.variantes.forEach((v) => {
    const id = `${p.id}-${v.g}`, nombre = `${tx(p.nombre)} ${gramos(v.g)}`;
    vistas[id] = vistas[id + "-pre"] = true;
    /* en preventa todavía no hay bolsas: lo que se vende es el cupo de reservas */
    const pre = enPreventa(p);
    filas.push({ id, nombre, fila: hoja[id], catalogo: v.stock, pronto: !!p.proximamente, pre });
    if (pre || hoja[id + "-pre"]) filas.push({ id: id + "-pre", nombre: nombre + " · reservas", fila: hoja[id + "-pre"], catalogo: (CONFIG.preventa && CONFIG.preventa.cupo) || 0, cupo: true });
  }));
  /* lo que está en la hoja y ya no en el catálogo: se muestra para que no se pierda de vista */
  ST.datos.existencias.filter((x) => !vistas[x.id]).forEach((x) => filas.push({ id: x.id, nombre: x.nombre || x.id, fila: x, fuera: true }));
  return filas;
}

function viewStock() {
  if (!CONFIG.registro || !coClave()) return `<section class="co-vacio">
      <p class="eyebrow">Stock</p><h2>Primero, conecta la hoja</h2>
      <p class="hint">El stock vive en la misma Hoja de Google que los correos y los pedidos. Conéctala en la pestaña <b>Correos</b> y vuelve aquí.</p>
      <div class="co-fila"><button class="btn primary" data-act="atab" data-tab="correos">Ir a Correos</button></div></section>`;
  if (!ST.datos && !ST.cargando && !ST.error) setTimeout(stCargar, 0);
  if (ST.error === "viejo") return `<section class="co-vacio"><p class="eyebrow">Stock</p>
      <h2>Falta actualizar el script de la hoja</h2>
      <p class="hint">La hoja todavía corre la versión anterior. Pega el <code>tools/correos/Codigo.gs</code> nuevo en el proyecto de Apps Script y publica una <b>nueva versión</b> de la misma implementación. Mientras tanto puedes corregir el stock directo en la hoja, columna <code>stock</code>.</p>
      <div class="co-fila"><button class="btn primary" data-act="st-cargar">Ya lo actualicé</button></div></section>`;
  if (!ST.datos) return `<section class="co-vacio"><p class="eyebrow">Stock</p>
      <h2>${ST.error ? "No se pudo cargar" : "Cargando el stock…"}</h2>
      ${ST.error ? `<p class="err">${esc(ST.error)}</p><div class="co-fila"><button class="btn" data-act="st-cargar">Intentar otra vez</button></div>` : ""}</section>`;

  const filas = stFilas(), venta = filas.filter((f) => !f.cupo && !f.fuera && !f.pronto && !f.pre), cupos = filas.filter((f) => f.cupo);
  const queda = (f) => (f.fila ? f.fila.stock : f.catalogo || 0);
  const kpi = (n, txt, alerta) => `<div class="mkt${alerta && n ? " op-alerta" : ""}"><small>${txt}</small><b class="mono co-n">${fmtNum(n)}</b></div>`;

  return `<section class="co op">
    <div class="section-head co-head"><p class="eyebrow">Stock de la tienda</p>
      <h2>Lo que queda <em>para vender</em></h2>
      <p class="hint">Es la cifra que ve la página. Cada pedido la descuenta y cada cancelación la devuelve; si la corriges aquí, la tienda la toma en la siguiente carga.</p>
      <div class="co-fila"><button class="btn sm" data-act="st-cargar">${ST.cargando ? "Actualizando…" : "Actualizar"}</button>
        <a class="btn sm" href="${esc(ST.datos.hoja)}" target="_blank" rel="noopener">Abrir la hoja</a></div></div>

    <div class="mkt-grid">${kpi(venta.reduce((s, f) => s + queda(f), 0), "Bolsas para vender")}
      ${kpi(venta.filter((f) => queda(f) === 0).length, "Presentaciones agotadas", true)}
      ${kpi(venta.filter((f) => queda(f) > 0 && queda(f) <= ST_POCO).length, `Con ${ST_POCO} o menos`, true)}
      ${cupos.length ? kpi(cupos.reduce((s, f) => s + queda(f), 0), "Reservas de preventa que quedan") : kpi(venta.length, "Presentaciones a la venta")}</div>

    <div class="table-scroll"><table class="b2b-tabla co-tabla op-tabla">
      <thead><tr><th>Presentación</th><th>Quedan</th><th>Estado</th><th>Último cambio</th><th></th></tr></thead>
      <tbody>${filas.map((f) => {
        const n = queda(f);
        const estado = f.fuera ? `<span class="op-estado op-cancelado">Ya no está en el catálogo</span>`
          : f.cupo ? (n === 0 ? `<span class="op-estado op-pagado">Cupo lleno</span>` : `<span class="op-estado op-nuevo">Cupo de preventa</span>`)
          : f.pre ? `<span class="op-estado op-cancelado">En preventa: aún sin bolsas</span>`
          : f.pronto ? `<span class="op-estado op-cancelado">Próximamente</span>`
          : n === 0 ? `<span class="op-estado op-pagado">Agotado</span>`
          : n <= ST_POCO ? `<span class="op-estado op-nuevo">Queda poco</span>` : `<span class="op-estado op-despachado">Disponible</span>`;
        return `<tr>
        <th scope="row">${esc(f.nombre)}<small class="mono">${esc(f.id)}</small></th>
        <td class="mono"><b>${fmtNum(n)}</b>${f.fila ? "" : `<small>${f.cupo ? "el cupo completo: aún sin reservas" : "del catálogo: aún sin pedidos"}</small>`}</td>
        <td>${estado}</td>
        <td class="mono">${f.fila ? coFecha(f.fila.actualizado) : "—"}</td>
        <td class="op-acc"><button class="btn sm" data-act="st-editar" data-id="${esc(f.id)}">Corregir</button></td></tr>`;
      }).join("")}</tbody></table></div>
    <p class="hint">Un pedido que nunca se paga deja sus bolsas apartadas hasta que lo canceles en <b>Pedidos</b>; las reservas de la pasarela se sueltan solas a las 2 horas.</p>
  </section>`;
}

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-act^='st-']"); if (!el || el.disabled) return;
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case "st-cargar": ST.error = null; return stCargar();
    case "st-editar": {
      const f = stFilas().find((x) => x.id === id); if (!f) return;
      return modal(`Corregir <em>${esc(f.nombre)}</em>`, `
        <p class="hint">${f.cupo ? "Cuántas reservas de preventa quedan por tomar." : "Cuántas bolsas quedan de verdad para vender."} Reemplaza la cifra de la hoja.</p>
        <div class="field"><label class="lbl" for="st-n">Quedan</label>
          <input id="st-n" class="input mono" type="number" min="0" step="1" inputmode="numeric" value="${f.fila ? f.fila.stock : f.catalogo || 0}"></div>
        <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="st-guardar" data-id="${esc(id)}">Guardar</button></div>`, "narrow");
    }
    case "st-guardar": {
      const f = stFilas().find((x) => x.id === id), n = parseInt($("#st-n")?.value, 10);
      if (!f) return;
      if (!(n >= 0)) return toast("Escribe un número de cero para arriba.", { type: "err" });
      closeModal();
      return fetch(CONFIG.registro, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ accion: "stock", clave: coClave(), id, stock: n, nombre: f.nombre }) })
        .then((r) => r.json())
        .then((j) => { if (!j.ok) throw new Error(j.error); toast(`${f.nombre}: quedan ${fmtNum(n)}.`); stCargar(); })
        .catch(() => toast("No se guardó. Revisa la conexión y vuelve a intentar.", { type: "err" }));
    }
  }
});

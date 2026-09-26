/* ============================================================
   CLIENTES (uso interno): quién compra, cada cuánto y a quién llamar
   ============================================================ */
const TIPOS = ["Cafetería", "Tostador", "Tienda", "Oficina", "Persona"];

const pedidosDe = (id) => S.pedidos.filter((p) => p.clienteId === id).sort((a, b) => b.fecha.localeCompare(a.fecha));
const totalCliente = (id) => pedidosDe(id).reduce((s, p) => s + p.total, 0);

/* Días promedio entre pedidos: sirve para saber cuándo deberían volver a pedir */
function frecuencia(id) {
  const f = pedidosDe(id).map((p) => new Date(p.fecha + "T00:00:00")).sort((a, b) => a - b);
  if (f.length < 2) return null;
  let s = 0; for (let i = 1; i < f.length; i++) s += (f[i] - f[i - 1]) / 86400000;
  return Math.round(s / (f.length - 1));
}
function estadoCliente(id) {
  const ps = pedidosDe(id); if (!ps.length) return { k: "nuevo", label: "sin pedidos" };
  const d = dias(ps[0].fecha), fr = frecuencia(id);
  if (d > 120) return { k: "perdido", label: `perdido · ${d} días`, d };
  if (fr && d > fr * 1.5) return { k: "riesgo", label: `se atrasó · ${d} días`, d, fr };
  if (!fr && d > 60) return { k: "riesgo", label: `no repite · ${d} días`, d };
  if (ps.length >= 2) return { k: "fiel", label: `cada ~${fr} días`, d, fr };
  return { k: "nuevo", label: `nuevo · hace ${d} días`, d };
}
function cafePreferido(id) {
  const c = {};
  pedidosDe(id).forEach((p) => p.items.forEach((i) => (c[i.nombre] = (c[i.nombre] || 0) + i.n)));
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return top ? { nombre: top[0], n: top[1] } : null;
}

function viewClientes() {
  const cs = S.clientes.map((c) => ({ ...c, total: totalCliente(c.id), n: pedidosDe(c.id).length, est: estadoCliente(c.id) }))
    .sort((a, b) => b.total - a.total);
  const ventas = S.pedidos.reduce((s, p) => s + p.total, 0);
  const ticket = S.pedidos.length ? ventas / S.pedidos.length : 0;
  const repiten = cs.filter((c) => c.n >= 2).length;
  const alerta = cs.filter((c) => ["riesgo", "perdido"].includes(c.est.k));
  const mes = S.pedidos.filter((p) => dias(p.fecha) <= 30).reduce((s, p) => s + p.total, 0);

  /* Ranking de cafés por unidades vendidas */
  const porCafe = {};
  S.pedidos.forEach((p) => p.items.forEach((i) => {
    porCafe[i.nombre] ||= { n: 0, plata: 0 };
    porCafe[i.nombre].n += i.n; porCafe[i.nombre].plata += i.n * i.precio;
  }));
  const ranking = Object.entries(porCafe).sort((a, b) => b[1].plata - a[1].plata);
  const maxPlata = Math.max(...ranking.map(([, v]) => v.plata), 1);

  return `<div class="view-head">
      <div><p class="eyebrow reveal">Uso interno</p>
        <h2 class="reveal" style="--i:1">Clientes <em>y recompra</em></h2>
        <p class="reveal" style="--i:2">Conseguir un cliente nuevo cuesta; que el de siempre vuelva a pedir, no. Aquí está a quién llamar esta semana.</p></div>
      <button class="btn primary reveal" style="--i:3" data-act="cl-nuevo">Registrar venta</button>
    </div>
    <div class="kpis reveal" style="--i:3">
      <div class="kpi"><b data-count="${cs.length}">${cs.length}</b><small>clientes</small></div>
      <div class="kpi"><b data-count="${ventas}" data-pre="$">${cop(ventas)}</b><small>vendido en total</small></div>
      <div class="kpi"><b data-count="${mes}" data-pre="$">${cop(mes)}</b><small>últimos 30 días</small></div>
      <div class="kpi"><b data-count="${ticket}" data-pre="$">${cop(ticket)}</b><small>pedido promedio</small></div>
      <div class="kpi ${alerta.length ? "alert" : ""}"><b data-count="${alerta.length}">${alerta.length}</b><small>por reactivar</small></div>
    </div>

    ${alerta.length ? `<div class="llamar reveal"><h3>Para llamar hoy</h3>
      <div class="chips">${alerta.slice(0, 6).map((c) => `<button class="chip" data-act="cl-wa" data-id="${c.id}">${esc(c.nombre)} · ${c.est.d} días</button>`).join("")}</div></div>` : ""}

    <div class="list">${cs.length ? cs.map(clienteCard).join("") : `<div class="empty"><h3>Sin clientes todavía</h3><p>Los pedidos de la tienda crean el cliente solo.</p></div>`}</div>

    <section class="section">
      <div class="section-head"><p class="eyebrow">Qué se vende</p><h2>Cafés <em>más pedidos</em></h2></div>
      <div class="rank">${ranking.map(([nombre, v]) => `<div class="rk">
        <span class="rk-n">${esc(nombre)}</span>
        <span class="rk-bar"><i style="--w:${(v.plata / maxPlata).toFixed(3)}"></i></span>
        <span class="mono">${fmtNum(v.n)} u · ${cop(v.plata)}</span></div>`).join("")}</div>
    </section>`;
}

function clienteCard(c, i) {
  const pref = cafePreferido(c.id), ps = pedidosDe(c.id), ult = ps[0];
  return `<div class="item cliente" style="--i:${i}">
    <span class="avatar">${esc(c.nombre[0])}</span>
    <div><p class="kicker">${esc(c.tipo)} · ${esc(c.ciudad)}${c.tel ? " · " + esc(c.tel) : ""}</p>
      <h4>${esc(c.nombre)}</h4>
      <p>${c.n} ${c.n === 1 ? "pedido" : "pedidos"} · ${cop(c.total)} en total${ult ? ` · último ${fmtFecha(ult.fecha)}` : ""}</p>
      ${pref ? `<p class="hint" style="margin:6px 0 0">Su café: <b>${esc(pref.nombre)}</b> (${pref.n} unidades)</p>` : ""}
    </div>
    <div class="item-actions">
      <span class="est ${c.est.k}">${c.est.label}</span>
      <button class="btn sm" data-act="cl-ver" data-id="${c.id}">Historial</button>
      <button class="btn primary sm" data-act="cl-wa" data-id="${c.id}">Escribirle</button>
    </div></div>`;
}

function clienteVer(id) {
  const c = S.clientes.find((x) => x.id === id), ps = pedidosDe(id), est = estadoCliente(id), fr = frecuencia(id);
  modal(`${esc(c.nombre)} · <em>${esc(c.ciudad)}</em>`, `
    <div class="offer-sum"><div><span class="lbl">Pedidos</span><b>${ps.length}</b></div>
      <div><span class="lbl">Total</span><b class="mono">${cop(totalCliente(id))}</b></div>
      <div><span class="lbl">Cada</span><b>${fr ? fr + " días" : "—"}</b></div></div>
    <div class="table-scroll"><table class="cmp-table"><tbody>
      ${ps.map((p) => `<tr><th>${fmtFecha(p.fecha)}<small class="src">${esc(p.id)}</small></th>
        <td>${p.items.map((i) => `${i.n} × ${esc(i.nombre)}`).join("<br>")}</td>
        <td class="mono">${cop(p.total)}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="hint">${est.k === "fiel" ? `Pide cada ~${fr} días. Escribirle unos días antes evita que se quede sin café.`
      : est.k === "riesgo" ? `Lleva ${est.d} días sin pedir y suele pedir cada ${fr || "—"}. Vale una llamada.`
      : est.k === "perdido" ? `Lleva ${est.d} días sin comprar. Ofrécele algo nuevo o pregúntale qué pasó.`
      : "Cliente nuevo: el segundo pedido es el que define si se queda."}</p>
    <div class="dlg-actions"><button class="btn" data-act="cl-nuevo" data-id="${id}">Registrar venta</button>
      <button class="btn primary" data-act="cl-wa" data-id="${id}">Escribirle por WhatsApp</button></div>`, "narrow");
}

/* Mensaje sugerido según su historia */
function clienteWa(id) {
  const c = S.clientes.find((x) => x.id === id), est = estadoCliente(id), pref = cafePreferido(id);
  const nuevo = S.productos.find((p) => p.stock > 0 && (!pref || p.nombre !== pref.nombre));
  const msg = est.k === "fiel"
    ? `Hola ${c.nombre}, ¿cómo van? Ya casi cumplen ${est.fr} días del último pedido de ${pref?.nombre || "café"}. ¿Les preparo otro despacho esta semana?`
    : est.k === "riesgo" || est.k === "perdido"
    ? `Hola ${c.nombre}, hace ${est.d} días no hacen pedido. Tenemos ${nuevo ? nuevo.nombre + " " + nuevo.sub : "café fresco"} recién tostado. ¿Les mando una muestra?`
    : `Hola ${c.nombre}, ¿cómo les fue con el ${pref?.nombre || "café"}? Si les gustó, les separo el siguiente lote.`;
  if (CONFIG.whatsapp && c.tel) window.open(`https://wa.me/57${c.tel.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  else modal(`Mensaje para <em>${esc(c.nombre)}</em>`, `<pre class="pre">${esc(msg)}</pre>
    <p class="hint">${c.tel ? "Configura tu WhatsApp en CONFIG para abrirlo directo." : "Este cliente no tiene teléfono guardado."}</p>
    <div class="dlg-actions"><button class="btn primary" data-act="close">Listo</button></div>`, "narrow");
}

/* Registrar una venta hecha por fuera de la tienda */
function clienteNuevo(id) {
  const c = id ? S.clientes.find((x) => x.id === id) : null;
  const disp = S.productos.filter((p) => p.stock > 0);
  modal("Registrar <em>venta</em>", `<div class="form-grid">
      <div class="field"><label class="lbl" for="cn-nombre">Cliente</label>
        <input id="cn-nombre" class="input" list="clientes-l" value="${esc(c?.nombre || "")}" placeholder="Nombre o negocio">
        <datalist id="clientes-l">${S.clientes.map((x) => `<option value="${esc(x.nombre)}">`).join("")}</datalist></div>
      <div class="field"><label class="lbl" for="cn-tipo">Tipo</label><select id="cn-tipo" class="input">${TIPOS.map((t) => `<option ${t === c?.tipo ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label class="lbl" for="cn-ciudad">Ciudad</label><input id="cn-ciudad" class="input" value="${esc(c?.ciudad || "Cúcuta")}"></div>
      <div class="field"><label class="lbl" for="cn-tel">WhatsApp</label><input id="cn-tel" class="input" type="tel" value="${esc(c?.tel || "")}" placeholder="300 000 0000"></div>
      <div class="field"><label class="lbl" for="cn-prod">Café</label><select id="cn-prod" class="input">${disp.map((p) => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.sub)} (${p.stock} disp.)</option>`).join("")}</select></div>
      <div class="field"><label class="lbl" for="cn-n">Unidades</label><input id="cn-n" class="input mono" type="number" min="1" value="1"></div>
    </div>
    <p class="hint">La venta descuenta el stock y se suma al lote que produjo ese café.</p>
    <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="cl-guardar">Guardar venta</button></div>`, "narrow");
}

function clienteGuardar() {
  const nombre = $("#cn-nombre").value.trim();
  if (!nombre) return toast("Falta el nombre del cliente.", { type: "err" });
  const prod = S.productos.find((p) => p.id === $("#cn-prod").value);
  const n = Math.max(1, Math.min(prod?.stock || 0, num("cn-n", 1)));
  if (!prod || !n) return toast("No hay stock de ese café.", { type: "err" });
  let cl = S.clientes.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase());
  if (!cl) { cl = { id: nextId("CL"), nombre, tipo: $("#cn-tipo").value, ciudad: $("#cn-ciudad").value.trim(), tel: $("#cn-tel").value.trim() }; S.clientes.unshift(cl); }
  else { cl.tel = $("#cn-tel").value.trim() || cl.tel; cl.ciudad = $("#cn-ciudad").value.trim() || cl.ciudad; }
  S.pedidos.unshift({ id: nextId("PD"), clienteId: cl.id, nombre: cl.nombre, ciudad: cl.ciudad, fecha: isoToday(), canal: "directo",
    items: [{ id: prod.id, nombre: prod.nombre, n, precio: prod.precio }], total: n * prod.precio });
  prod.stock -= n; atribuirVenta(prod, n);
  save(); closeModal(); render();
  toast(`Venta a ${esc(cl.nombre)}: ${n} × ${esc(prod.nombre)} = ${cop(n * prod.precio)}.`);
}


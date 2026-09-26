/* ============================================================
   PÁGINA PÚBLICA DEL CAFÉ: ficha del Geisha, pedido y lista de espera
   ============================================================ */
const varSel = (p) => p.variantes.find((v) => v.g === (UI.variante || p.variantes.find((x) => x.principal).g)) || p.variantes[0];
const enCarrito = (id, g) => UI.carrito.find((i) => i.id === id && i.g === g);
const totalCarrito = () => UI.carrito.reduce((s, i) => s + i.n * i.precio, 0);
const unidadesCarrito = () => UI.carrito.reduce((s, i) => s + i.n, 0);

/* Tarjeta corta, para el inicio */
function cafeCard(p, i = 0) {
  const v = p.variantes.find((x) => x.principal) || p.variantes[0];
  const quedan = p.variantes.reduce((s, x) => s + x.stock, 0);
  return `<article class="card-cafe reveal" style="--i:${i}">
    <div class="cc-art" data-act="go" data-to="geisha" role="button" tabindex="0" aria-label="Ver ${esc(p.nombre)}">
      ${ridge(p, { w: 420, h: 200 })}
      <span class="state st-publicado">${quedan} disponibles</span>
      <div class="cc-score"><b>${esc(p.puntaje)}</b><small>SCA · ${LV[p.nivel].label}</small></div>
    </div>
    <div class="cc-body">
      <p class="kicker">${esc(p.municipio)} · ${fmtNum(p.altitud)} msnm · ${esc(p.cosecha)}</p>
      <h3>${esc(p.nombre)}</h3>
      <p class="notas-linea">${p.notas.join(" · ")}</p>
      <div class="cc-foot"><b class="mono">${cop(v.precio)}</b><small>${gramos(v.g)}</small>
        <button class="btn primary sm" data-act="go" data-to="geisha">Ver el café</button></div>
    </div></article>`;
}

/* Tarjeta del lote en subasta */
function subastaCard(i = 0) {
  const a = UI.au, l = AU_LOTE, top = topBid(a);
  return `<article class="card-cafe dark reveal dark-art" style="--i:${i}">
    <div class="cc-art" data-act="go" data-to="subasta" role="button" tabindex="0" aria-label="Ir a la subasta">
      ${ridge(l, { w: 420, h: 200, dark: true })}
      <span class="state st-en-subasta">${a.ended ? "cerrada" : "en vivo"}</span>
      <div class="cc-score"><b>${esc(l.puntaje)}</b><small>SCA · verificado</small></div>
    </div>
    <div class="cc-body">
      <p class="kicker">${esc(l.municipio)} · ${fmtNum(l.altitud)} msnm · ${a.kg} kg</p>
      <h3>${esc(l.variedad)} <em>${esc(l.proceso)}</em></h3>
      <p class="notas-linea">${l.perfil.join(" · ")}</p>
      <div class="cc-foot"><b class="mono" data-live-price>${cop(top ? top.p : a.start)}</b><small>por kg verde</small>
        <button class="btn primary sm" data-act="go" data-to="subasta"><span class="live-dot ${a.ended ? "off" : ""}"></span> ${a.ended ? "Ver resultado" : "Pujar"}</button></div>
    </div></article>`;
}

/* ---------- la ficha completa ---------- */
function viewGeisha() {
  const p = geisha(), v = varSel(p), f = p.ficha;
  const sobre = ((p.pago.pagadoKg / p.pago.referenciaKg - 1) * 100).toFixed(0);
  const atributo = ([k, a]) => `<div class="attr" style="--c:${LV[a.nivel].c}">
      <span class="lbl">${k}</span><b>${esc(a.v)}${k === "Altitud" ? " msnm" : ""}</b>
      <span class="lvtag" style="--c:${LV[a.nivel].c}">${LV[a.nivel].label}</span>
      <small>${esc(a.fuente)} · ${fmtFecha(a.fecha)}</small>
      ${a.detalle ? `<small>${esc(a.detalle)}</small>` : ""}</div>`;
  return `<article class="prod">
    <div class="prod-art reveal">
      <div class="prod-card dark-art">
        <p class="kicker">${esc(CONFIG.marca)} · ${esc(p.municipio)}</p>
        <h2 class="prod-title">${esc(p.variedad)}<br><em>${esc(p.proceso)}</em></h2>
        <p class="prod-score">${esc(p.puntaje)}<small>SCA</small></p>
        <div class="hc-ridge">${ridge(p, { w: 460, h: 200, dark: true })}</div>
      </div>
      <ul class="notas-chips">${p.notas.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    </div>

    <div class="prod-buy reveal" style="--i:1">
      <p class="eyebrow">Cosecha ${esc(p.cosecha)} · ${p.variantes.reduce((s, x) => s + x.stock, 0)} unidades</p>
      <h1>${esc(p.nombre)}</h1>
      <p class="lede">${esc(p.historia)}</p>

      <div class="vars" role="radiogroup" aria-label="Presentación">
        ${p.variantes.map((x) => `<button class="var ${x.g === v.g ? "on" : ""}" data-act="var" data-g="${x.g}" aria-pressed="${x.g === v.g}" ${x.stock ? "" : "disabled"}>
          <b>${gramos(x.g)}</b><span>${esc(x.label)}</span><small>${x.stock ? esc(x.nota) : "agotado"}</small>
          <span class="mono precio">${cop(x.precio)}</span></button>`).join("")}
      </div>

      <div class="buy-row">
        <div><b class="precio-grande mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${cop((v.precio / v.g) * 1000)} por kg</small></div>
        <button class="btn primary lg" data-act="add" data-g="${v.g}" ${v.stock ? "" : "disabled"}>Agregar al pedido</button>
      </div>
      <p class="hint">${v.stock} disponibles de esta presentación · molienda a elegir al confirmar · envíos desde Cúcuta.</p>

      <div class="pago">
        <div><span class="lbl">Le pagamos al productor</span><b class="mono">${cop(p.pago.pagadoKg)}</b><small>por kg de pergamino</small></div>
        <div><span class="lbl">Precio de referencia ese día</span><b class="mono">${cop(p.pago.referenciaKg)}</b><small>FNC · ${fmtFecha(p.pago.fecha)}</small></div>
        <div class="mas"><b>+${sobre} %</b><small>por encima de la referencia</small></div>
      </div>
    </div>

    <section class="prod-ficha reveal" style="--i:2">
      <div class="section-head"><p class="eyebrow">La ficha</p><h2>Cada dato dice <em>quién lo comprobó</em></h2>
        <p>Casi todas las marcas cuentan la historia. Nosotros además decimos de dónde sale cada número y cuándo se midió.</p></div>
      <div class="attrs-grid">
        ${atributo(["Variedad", f.variedad])}${atributo(["Altitud", f.altitud])}${atributo(["Proceso", f.proceso])}
        ${atributo(["Puntaje SCA", f.puntaje])}${atributo(["Factor de rendimiento", f.factor])}${atributo(["Cosecha", f.cosecha])}
      </div>
      <div class="leyenda">${Object.values(LV).map((o) => `<span><i style="--c:${o.c}"></i><b>${o.label}:</b> ${o.desc}</span>`).join("")}</div>
    </section>

    <section class="prod-receta reveal" style="--i:3">
      <div class="section-head"><p class="eyebrow">Cómo prepararlo</p><h2>La receta <em>de la casa</em></h2>
        <p>Un café así no se debe improvisar. Empieza por aquí y ajusta a tu gusto.</p></div>
      <div class="receta">${Object.entries({ Método: p.receta.metodo, Café: p.receta.dosis, Agua: p.receta.agua, Temperatura: p.receta.temp, Tiempo: p.receta.tiempo, Molienda: p.receta.molienda })
        .map(([k, val]) => `<div><span class="lbl">${k}</span><b>${esc(val)}</b></div>`).join("")}</div>
      <p class="hint">Si te queda amargo, muele más grueso. Si queda aguado, muele más fino.</p>
    </section>

    <section class="espera reveal" style="--i:4">
      <div><h3>Cuando se acabe, se acabó</h3>
        <p>Son 60 kilos de una sola cosecha. Déjanos tu correo y te avisamos antes de que salga el próximo lote.</p></div>
      <form class="espera-form" onsubmit="return false">
        <input id="esp-mail" class="input" type="email" placeholder="tu@correo.com" aria-label="Correo">
        <button class="btn primary" data-act="espera">Avisarme</button>
      </form>
    </section>
  </article>`;
}

/* ---------- pedido ---------- */
function addCarrito(g) {
  const p = geisha(), v = p.variantes.find((x) => x.g === +g);
  const c = enCarrito(p.id, v.g);
  if (c) { if (c.n < v.stock) c.n++; else return toast("No queda más de esa presentación.", { type: "err" }); }
  else UI.carrito.push({ id: p.id, g: v.g, n: 1, precio: v.precio, nombre: `${p.nombre} ${gramos(v.g)}` });
  render();
  toast(`${esc(p.nombre)} ${gramos(v.g)} agregado.`, { label: "Ver pedido", act: abrirPedido });
}

function renderTray() {
  const t = $("#tray");
  if (!UI.carrito.length || UI.view === "admin") { t.hidden = true; return; }
  t.hidden = false;
  t.innerHTML = `<span>${unidadesCarrito()} ${unidadesCarrito() === 1 ? "bolsa" : "bolsas"} · <b class="mono">${cop(totalCarrito())}</b></span>
    <button class="btn sm" data-act="carrito-clear">Vaciar</button>
    <button class="btn sm primary" data-act="pedido">Hacer pedido</button>`;
}

function abrirPedido() {
  const filas = UI.carrito.map((i) => `<tr><th>${esc(i.nombre)}</th>
      <td class="qty"><button class="btn sm" data-act="qty" data-g="${i.g}" data-d="-1" aria-label="Quitar uno">−</button>
      <span class="mono">${i.n}</span>
      <button class="btn sm" data-act="qty" data-g="${i.g}" data-d="1" aria-label="Agregar uno">+</button></td>
      <td class="mono">${cop(i.precio * i.n)}</td></tr>`).join("");
  modal("Tu <em>pedido</em>", `<div class="table-scroll"><table class="cmp-table"><tbody>${filas}
    <tr><th>Total</th><td></td><td class="mono"><b>${cop(totalCarrito())}</b></td></tr></tbody></table></div>
    <div class="form-grid" style="margin-top:16px">
      <div class="field"><label class="lbl" for="pd-nombre">Nombre o negocio</label><input id="pd-nombre" class="input" placeholder="Tu nombre"></div>
      <div class="field"><label class="lbl" for="pd-ciudad">Ciudad</label><input id="pd-ciudad" class="input" value="Cúcuta"></div>
      <div class="field"><label class="lbl" for="pd-tel">WhatsApp</label><input id="pd-tel" class="input" type="tel" placeholder="300 000 0000"></div>
      <div class="field"><label class="lbl" for="pd-molienda">Molienda</label><select id="pd-molienda" class="input"><option>En grano</option><option>Filtro / V60</option><option>Prensa francesa</option><option>Espresso</option></select></div>
    </div>
    <p class="hint">Confirmamos por WhatsApp disponibilidad, envío y forma de pago.</p>
    <div class="dlg-actions"><button class="btn" data-act="close">Seguir viendo</button><button class="btn primary" data-act="pedido-enviar">Enviar pedido</button></div>`, "narrow");
}

function cambiarCantidad(g, d) {
  const p = geisha(), v = p.variantes.find((x) => x.g === +g), c = enCarrito(p.id, +g);
  if (!c) return;
  c.n = Math.max(0, Math.min(v.stock, c.n + d));
  if (!c.n) UI.carrito = UI.carrito.filter((i) => !(i.id === p.id && i.g === +g));
  renderTray();
  if (UI.carrito.length) abrirPedido(); else { closeModal(); render(); }
}

function enviarPedido() {
  const nombre = $("#pd-nombre").value.trim();
  if (!nombre) return toast("Escribe tu nombre.", { type: "err" });
  const p = geisha(), molienda = $("#pd-molienda").value;
  const cl = upsertCliente(nombre, $("#pd-ciudad").value.trim(), $("#pd-tel").value.trim());
  const items = UI.carrito.map((i) => ({ id: p.id, nombre: i.nombre, n: i.n, precio: i.precio }));
  const pedido = { id: nextId("PD"), clienteId: cl.id, canal: "tienda", nombre, ciudad: cl.ciudad, tel: cl.tel, molienda,
    items, total: totalCarrito(), fecha: isoToday() };
  S.pedidos.unshift(pedido);
  /* descuenta stock de cada presentación y lo atribuye al lote */
  UI.carrito.forEach((i) => {
    const v = p.variantes.find((x) => x.g === i.g); v.stock = Math.max(0, v.stock - i.n);
    atribuirVenta(p, (i.n * i.g) / p.presentacion, i.precio * i.n);   // en bolsas equivalentes de la presentación principal
  });
  p.stock = p.variantes.find((x) => x.principal).stock;
  UI.carrito = []; save(); closeModal(); render();
  const texto = `Hola ${CONFIG.marca}, quiero pedir:\n${items.map((i) => `· ${i.n} × ${i.nombre}`).join("\n")}\nMolienda: ${molienda}\nTotal: ${cop(pedido.total)}\nNombre: ${nombre}${pedido.ciudad ? " · " + pedido.ciudad : ""}`;
  if (CONFIG.whatsapp) window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  toast(`Pedido ${pedido.id} por ${cop(pedido.total)}.`, CONFIG.whatsapp ? {} : { label: "Ver mensaje", act: () => modal("Mensaje del pedido", `<pre class="pre">${esc(texto)}</pre><p class="hint">Pon tu número en <code>CONFIG.whatsapp</code> para que se envíe solo.</p>`, "narrow") });
}

function listaEspera() {
  const mail = $("#esp-mail").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(mail)) return toast("Escribe un correo válido.", { type: "err" });
  S.espera.unshift({ mail, fecha: isoToday() }); save();
  $("#esp-mail").value = "";
  toast("Listo, te avisamos antes de que salga el próximo lote.");
}

/* ============================================================
   CAFÉS: catálogo por finca, ficha del café, pedido y pago
   ============================================================ */
const varSel = (p) => p.variantes.find((v) => v.g === (UI.variante?.[p.id] || p.variantes.find((x) => x.principal).g)) || p.variantes[0];
const enCarrito = (id, g) => UI.carrito.find((i) => i.id === id && i.g === g);
const totalCarrito = () => UI.carrito.reduce((s, i) => s + i.n * i.precio, 0);
const unidadesCarrito = () => UI.carrito.reduce((s, i) => s + i.n, 0);
const stockTotal = (p) => p.variantes.reduce((s, x) => s + x.stock, 0);

/* ---------- tarjetas ---------- */
function cafeCard(p, i = 0) {
  const f = fincaDe(p), v = p.variantes.find((x) => x.principal) || p.variantes[0];
  return `<article class="card-cafe reveal" style="--i:${i}">
    <div class="cc-art" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
      ${ridge(p, { w: 420, h: 200 })}
      <span class="state st-publicado">${stockTotal(p)} ${t("disponibles")}</span>
      <div class="cc-score"><b>${esc(p.puntaje)}</b><small style="color:${LV[p.nivel].c}">SCA · ${lvl(p.nivel)}</small></div>
    </div>
    <div class="cc-body">
      <p class="kicker">${esc(f.finca || "")}<br>${esc(p.altitud ? fmtNum(p.altitud) + " msnm" : "")}</p>
      <h3>${esc(tx(p.nombre))}</h3>
      <p class="notas-linea">${tx(p.notas).join(" · ")}</p>
      <div class="cc-foot"><b class="mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${esc(tx(p.sale)).toLowerCase()}</small>
        <button class="btn primary sm" data-act="cafe" data-id="${p.id}">${t("ver_cafe")}</button></div>
    </div></article>`;
}

function subastaCard(i = 0) {
  const a = UI.au, l = AU_LOTE, top = topBid(a);
  return `<article class="card-cafe dark reveal dark-art" style="--i:${i}">
    <div class="cc-art" data-act="go" data-to="subasta" role="button" tabindex="0" aria-label="${t("nav_subasta")}">
      ${ridge(l, { w: 420, h: 200, dark: true })}
      <span class="state st-en-subasta">${a.ended ? t("cerrada") : t("en_vivo")}</span>
      <div class="cc-score"><b>${esc(l.puntaje)}</b><small>SCA</small></div>
    </div>
    <div class="cc-body">
      <p class="kicker">${esc(l.productor)}, ${esc(l.municipio)}<br>${a.kg} kg de café verde</p>
      <h3>${esc(l.variedad)} <em>${esc(l.proceso)}</em></h3>
      <p class="notas-linea">${l.perfil.join(" · ")}</p>
      <div class="cc-foot"><b class="mono" data-live-price>${cop(top ? top.p : a.start)}</b><small>${t("por_kg")}</small>
        <button class="btn primary sm" data-act="go" data-to="subasta">${a.ended ? t("ver_cafe") : (UI.lang === "en" ? "Bid" : "Pujar")}</button></div>
    </div></article>`;
}

function fincaCard(f, i = 0) {
  const cafes = S.productos.filter((p) => p.fincaId === f.id);
  return `<article class="finca reveal ${f.propia ? "propia" : ""}" style="--i:${i}">
    <div class="finca-art">${ridge(f, { w: 380, h: 120 })}</div>
    <div class="finca-body">
      <p class="kicker">${esc(f.municipio)} · ${fmtNum(f.altitud)} msnm</p>
      <h3>${esc(f.finca)}</h3>
      <p class="finca-prod">${esc(f.productor)}${f.exclusiva ? ` <span class="excl">${UI.lang === "en" ? "exclusive" : "exclusivo"}</span>` : ""}</p>
      <p class="hint">${esc(tx(f.historia))}</p>
      <div class="finca-foot">
        <span class="var-chip">${esc(f.variedad)}</span>
        ${f.proxima ? `<span class="pronto">${UI.lang === "en" ? "First harvest" : "Primera cosecha"} ${f.proxima}</span>`
          : cafes.length ? `<button class="btn sm" data-act="cafe" data-id="${cafes[0].id}">${t("ver_cafe")}</button>`
          : `<button class="btn sm" data-act="go" data-to="subasta">${t("nav_subasta")}</button>`}
      </div>
    </div></article>`;
}

/* ---------- catálogo ---------- */
function viewCafes() {
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${UI.lang === "en" ? "What we have now" : "Lo que hay ahora"}</p>
        <h2 class="reveal" style="--i:1">${UI.lang === "en" ? "One coffee per <em>farm</em>" : "Un café por <em>finca</em>"}</h2>
        <p class="reveal" style="--i:2">${UI.lang === "en"
          ? "We buy from farms in Norte de Santander. Each one grows a different variety, and we sell it under its own name."
          : "Le compramos a fincas de Norte de Santander. Cada una tiene su variedad y la vendemos con su propio nombre."}</p></div>
    </div>
    <div class="dos">${S.productos.map((p, i) => cafeCard(p, i)).join("")}${subastaCard(S.productos.length)}</div>
    <section class="section">
      <div class="section-head"><p class="eyebrow">${UI.lang === "en" ? "The farms" : "Las fincas"}</p>
        <h2>${UI.lang === "en" ? "Who grows <em>what we sell</em>" : "Quién cultiva <em>lo que vendemos</em>"}</h2></div>
      <div class="fincas">${S.fincas.map((f, i) => fincaCard(f, i)).join("")}</div>
    </section>`;
}

/* ---------- ficha del café ---------- */
function viewCafe() {
  const p = prodById(UI.cafe) || S.productos[0], f = fincaDe(p), v = varSel(p), fi = p.ficha;
  const sobre = ((p.pago.pagadoKg / p.pago.referenciaKg - 1) * 100).toFixed(0);
  const attr = (k, a) => `<div class="attr" style="--c:${LV[a.nivel].c}">
      <span class="lbl">${k}</span><b>${esc(a.v)}</b>
      <span class="lvtag" style="--c:${LV[a.nivel].c}">${lvl(a.nivel)}</span>
      <small>${esc(a.fuente)} · ${fmtFecha(a.fecha)}</small>${a.detalle ? `<small>${esc(a.detalle)}</small>` : ""}</div>`;
  const R = p.receta;
  return `<article class="prod">
    <div class="prod-top">
    <div class="prod-art reveal">
      <div class="prod-card dark-art">
        <p class="kicker">${esc(CONFIG.marca)} · ${esc(f.municipio || "")}</p>
        <h2 class="prod-title">${esc(p.variedad)}<br><em>${esc(p.proceso)}</em></h2>
        <p class="prod-score">${esc(p.puntaje)}<small>SCA</small></p>
        <div class="hc-ridge">${ridge(p, { w: 460, h: 200, dark: true })}</div>
      </div>
      <ul class="notas-chips">${tx(p.notas).map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      <div class="foto-pend">${UI.lang === "en" ? "Photo of the farm and the producer" : "Foto de la finca y del productor"}</div>
    </div>

    <div class="prod-buy reveal" style="--i:1">
      <p class="eyebrow">${esc(f.productor || "")}, ${esc(f.finca || "")}</p>
      <h1>${esc(tx(p.nombre))}</h1>
      <p class="lede">${esc(tx(f.historia || { es: "", en: "" }))}</p>

      <div class="vars" role="radiogroup" aria-label="${UI.lang === "en" ? "Size" : "Presentación"}">
        ${p.variantes.map((x) => `<button class="var ${x.g === v.g ? "on" : ""}" data-act="var" data-p="${p.id}" data-g="${x.g}" aria-pressed="${x.g === v.g}" ${x.stock ? "" : "disabled"}>
          <b>${gramos(x.g)}</b><span>${esc(tx(x.label))}</span><small>${x.stock ? esc(tx(x.nota)) : t("agotado")}</small>
          <span class="mono precio">${cop(x.precio)}</span></button>`).join("")}
      </div>

      <p class="sale"><span class="sale-tag">${esc(tx(p.sale))}</span> ${esc(tx(p.saleNota))}</p>

      <div class="buy-row">
        <div><b class="precio-grande mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${cop((v.precio / v.g) * 1000)} ${t("por_kg")}</small></div>
        <button class="btn primary lg" data-act="add" data-p="${p.id}" data-g="${v.g}" ${v.stock ? "" : "disabled"}>${t("agregar")}</button>
      </div>
      <p class="hint">${v.stock} ${t("disponibles")} · ${UI.lang === "en" ? "ships from Cúcuta" : "envíos desde Cúcuta"}</p>

    </div>

    <section class="prod-ficha reveal" style="--i:2">
      <div class="section-head"><p class="eyebrow">${t("ficha")}</p>
        <h2>${UI.lang === "en" ? "Every number says <em>who checked it</em>" : "Cada dato dice <em>quién lo comprobó</em>"}</h2></div>
      <div class="attrs-grid">
        ${attr(UI.lang === "en" ? "Variety" : "Variedad", fi.variedad)}${attr(UI.lang === "en" ? "Altitude" : "Altitud", fi.altitud)}
        ${attr(UI.lang === "en" ? "Process" : "Proceso", fi.proceso)}${attr(UI.lang === "en" ? "SCA score" : "Puntaje SCA", fi.puntaje)}
        ${attr(UI.lang === "en" ? "Yield factor" : "Factor de rendimiento", fi.factor)}
      </div>
      <div class="leyenda">${Object.values(LV).map((o) => `<span><i style="--c:${o.c}"></i><b>${tx(o.label)}:</b> ${tx(o.desc)}</span>`).join("")}</div>
    </section>

    <section class="prod-receta reveal" style="--i:3">
      <div class="section-head"><p class="eyebrow">${t("receta")}</p>
        <h2>${UI.lang === "en" ? "The house <em>recipe</em>" : "La receta <em>de la casa</em>"}</h2></div>
      <div class="receta">${[[UI.lang === "en" ? "Method" : "Método", R.metodo], [UI.lang === "en" ? "Coffee" : "Café", R.dosis],
        [UI.lang === "en" ? "Water" : "Agua", R.agua], [UI.lang === "en" ? "Temp." : "Temperatura", R.temp],
        [UI.lang === "en" ? "Time" : "Tiempo", R.tiempo], [UI.lang === "en" ? "Grind" : "Molienda", tx(R.molienda)]]
        .map(([k, val]) => `<div><span class="lbl">${k}</span><b>${esc(val)}</b></div>`).join("")}</div>
      <p class="hint">${UI.lang === "en" ? "Too bitter: grind coarser. Too weak: grind finer." : "Si queda amargo, muele más grueso. Si queda aguado, muele más fino."}</p>
    </section>

    <section class="cierre reveal" style="--i:4">
      <p>${UI.lang === "en"
        ? "Each lot is one harvest, and then it is gone. The subscription is the only way to be sure the next one reaches you."
        : "Cada lote es una cosecha y se acaba. La suscripción es la única forma de asegurar que el próximo te llegue."}</p>
      <button class="btn primary" data-act="go" data-to="suscripcion">${UI.lang === "en" ? "See the subscription" : "Ver la suscripción"}</button>
    </section>
  </article>`;
}

/* ---------- pedido y pago ---------- */
const CART_KEY = "nandez-carrito";
function guardarCarrito() { try { localStorage.setItem(CART_KEY, JSON.stringify(UI.carrito)); } catch {} }
function cargarCarrito() {
  try {
    const v = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(v)) return;
    UI.carrito = v.filter((i) => { const p = prodById(i.id); return p && p.variantes.some((x) => x.g === i.g && x.stock > 0); });
  } catch {}
}
function addCarrito(pid, g) {
  const p = prodById(pid), v = p.variantes.find((x) => x.g === +g), c = enCarrito(p.id, v.g);
  if (c) { if (c.n < v.stock) c.n++; else return toast(UI.lang === "en" ? "No more of that size." : "No queda más de esa presentación.", { type: "err" }); }
  else UI.carrito.push({ id: p.id, g: v.g, n: 1, precio: v.precio, nombre: `${tx(p.nombre)} ${gramos(v.g)}` });
  guardarCarrito(); render(); abrirCarrito();
}

function renderTray() {
  const el = $("#tray");
  if (!UI.carrito.length || $("#cart")?.open) { el.hidden = true; return; }
  el.hidden = false;
  const n = unidadesCarrito();
  el.innerHTML = `<span>${n} ${n === 1 ? (UI.lang === "en" ? "bag" : "bolsa") : (UI.lang === "en" ? "bags" : "bolsas")} · <b class="mono">${cop(totalCarrito())}</b></span>
    <button class="btn sm primary" data-act="carrito">${UI.lang === "en" ? "View order" : "Ver el pedido"}</button>`;
}

function abrirCarrito() {
  const d = $("#cart"); if (!d) return;
  renderCarrito();
  if (!d.open) d.showModal();
  renderTray();
}
function cerrarCarrito() { const d = $("#cart"); if (d?.open) d.close(); renderTray(); }

function renderCarrito() {
  const en = UI.lang === "en", cuerpo = $("#cart-body"); if (!cuerpo) return;
  if (!UI.carrito.length) {
    cuerpo.innerHTML = `<div class="cart-vacio">
      <p>${en ? "Nothing here yet." : "Todavía no hay nada."}</p>
      <button class="btn primary" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button></div>`;
    return;
  }
  const E = CONFIG.envio, envio = totalCarrito() >= E.gratisDesde ? 0 : E.costo;
  cuerpo.innerHTML = `
    <ul class="cart-items">${UI.carrito.map((i) => {
      const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
      return `<li class="cart-item">
        <div class="cart-art">${ridge(p, { w: 120, h: 90, label: false })}</div>
        <div class="cart-txt"><b>${esc(tx(p.nombre))}</b><small>${gramos(i.g)} · ${esc(tx(p.sale)).toLowerCase()}</small>
          <div class="cart-qty">
            <button class="btn sm" data-act="qty" data-p="${i.id}" data-g="${i.g}" data-d="-1" aria-label="${en ? "Remove one" : "Quitar uno"}">−</button>
            <span class="mono">${i.n}</span>
            <button class="btn sm" data-act="qty" data-p="${i.id}" data-g="${i.g}" data-d="1" aria-label="${en ? "Add one" : "Agregar uno"}" ${i.n >= v.stock ? "disabled" : ""}>+</button>
            <button class="cart-del" data-act="quitar" data-p="${i.id}" data-g="${i.g}">${en ? "Remove" : "Quitar"}</button>
          </div></div>
        <b class="mono cart-precio">${cop(i.precio * i.n)}</b></li>`;
    }).join("")}</ul>

    <div class="cart-sumas">
      <div><span>${en ? "Subtotal" : "Subtotal"}</span><b class="mono">${cop(totalCarrito())}</b></div>
      <div><span>${en ? "Shipping" : "Envío"}</span><b class="mono">${envio ? cop(envio) : (en ? "Free" : "Gratis")}</b></div>
      <div class="cart-total"><span>${t("total")}</span><b class="mono">${cop(totalCarrito() + envio)}</b></div>
      <p class="hint">${envio
        ? (en ? "Free shipping from " : "Envío gratis desde ") + cop(E.gratisDesde) + ". "
        : ""}${en ? "Arrives in " : "Llega en "}${tx(E.dias)} ${en ? "with " : "por "}${esc(E.transportadora)}.</p>
    </div>

    <div class="form-grid cart-form">
      <div class="field"><label class="lbl" for="pd-nombre">${en ? "Name" : "Nombre o negocio"}</label><input id="pd-nombre" class="input" autocomplete="name" enterkeyhint="next"></div>
      <div class="field"><label class="lbl" for="pd-ciudad">${en ? "City" : "Ciudad"}</label><input id="pd-ciudad" class="input" value="Cúcuta" autocomplete="address-level2"></div>
      <div class="field"><label class="lbl" for="pd-tel">WhatsApp</label><input id="pd-tel" class="input" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="done" placeholder="300 000 0000"></div>
    </div>`;
  const pie = $("#cart-foot");
  if (pie) pie.innerHTML = UI.carrito.length
    ? `<button class="btn" data-act="pedido-wa">${t("pedir_wa")}</button>
       <button class="btn primary" data-act="pedido-mp" ${CONFIG.pagos.mercadoPago ? "" : "disabled"}>${t("pagar_mp")}</button>
       <p class="hint">${CONFIG.pagos.mercadoPago
         ? (en ? "Card, PSE, Nequi or cash through Mercado Pago." : "Tarjeta, PSE, Nequi o efectivo con Mercado Pago.")
         : (en ? "Online payment is not connected yet: we confirm on WhatsApp." : "El pago en línea todavía no está conectado: confirmamos por WhatsApp.")}</p>`
    : "";
}

function cambiarCantidad(pid, g, d) {
  const p = prodById(pid), v = p.variantes.find((x) => x.g === +g), c = enCarrito(pid, +g);
  if (!c) return;
  c.n = Math.max(0, Math.min(v.stock, c.n + d));
  if (!c.n) UI.carrito = UI.carrito.filter((i) => !(i.id === pid && i.g === +g));
  guardarCarrito(); renderCarrito(); renderNav(); renderTray();
}
function quitarDelCarrito(pid, g) {
  UI.carrito = UI.carrito.filter((i) => !(i.id === pid && i.g === +g));
  guardarCarrito(); renderCarrito(); renderNav(); renderTray();
}

function datosPedido() {
  const nombre = $("#pd-nombre").value.trim();
  if (!nombre) { toast(UI.lang === "en" ? "Write your name." : "Escribe tu nombre.", { type: "err" }); return null; }
  return { nombre, ciudad: $("#pd-ciudad").value.trim(), tel: $("#pd-tel").value.trim() };
}

function registrarPedido(d, canal) {
  const cl = upsertCliente(d.nombre, d.ciudad, d.tel);
  const items = UI.carrito.map((i) => ({ id: i.id, nombre: i.nombre, n: i.n, precio: i.precio }));
  const pedido = { id: nextId("PD"), clienteId: cl.id, canal, nombre: d.nombre, ciudad: d.ciudad, tel: d.tel,
    items, total: totalCarrito(), fecha: isoToday() };
  S.pedidos.unshift(pedido);
  UI.carrito.forEach((i) => {
    const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
    v.stock = Math.max(0, v.stock - i.n);
    p.stock = (p.variantes.find((x) => x.principal) || p.variantes[0]).stock;
    atribuirVenta(p, (i.n * i.g) / p.presentacion, i.precio * i.n);
  });
  const texto = `Hola ${CONFIG.marca}, quiero pedir:\n${items.map((i) => `· ${i.n} × ${i.nombre}`).join("\n")}\nTotal: ${cop(pedido.total)}\n${d.nombre}${d.ciudad ? " · " + d.ciudad : ""}`;
  UI.carrito = []; guardarCarrito(); save(); cerrarCarrito(); closeModal(); render();
  return { pedido, texto };
}

function pedidoWA() {
  const d = datosPedido(); if (!d) return;
  const { pedido, texto } = registrarPedido(d, "whatsapp");
  if (CONFIG.whatsapp) window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  else modal(UI.lang === "en" ? "Order message" : "Mensaje del pedido", `<pre class="pre">${esc(texto)}</pre>
    <p class="hint">${UI.lang === "en" ? "Set CONFIG.whatsapp to send it automatically." : "Pon el número en CONFIG.whatsapp para que se envíe solo."}</p>`, "narrow");
  toast(`${pedido.id} · ${cop(pedido.total)}`);
}

/* Mercado Pago: link de pago por producto, link general, o /api/checkout (Checkout Pro) */
async function pedidoMP() {
  const d = datosPedido(); if (!d) return;
  const items = UI.carrito.map((i) => ({ id: `${i.id}-${i.g}`, title: i.nombre, quantity: i.n, unit_price: i.precio }));
  const directo = UI.carrito.length === 1 && CONFIG.pagos.porProducto[`${UI.carrito[0].id}-${UI.carrito[0].g}`];
  const { pedido } = registrarPedido(d, "mercadopago");
  if (directo) return void window.open(directo, "_blank", "noopener");
  const url = CONFIG.pagos.mercadoPago;
  if (url.startsWith("/api/")) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, pedido: pedido.id, comprador: { nombre: d.nombre, ciudad: d.ciudad, tel: d.tel } }) });
      const j = await r.json();
      if (j.init_point) return void (window.location.href = j.init_point);
      throw new Error(j.error || "sin init_point");
    } catch (e) {
      toast(UI.lang === "en" ? "Payment could not start; we will confirm on WhatsApp." : "No se pudo abrir el pago; lo confirmamos por WhatsApp.", { type: "err" });
      return;
    }
  }
  window.open(url, "_blank", "noopener");
}

function listaEspera() {
  const mail = $("#esp-mail").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(mail)) return toast(UI.lang === "en" ? "Write a valid email." : "Escribe un correo válido.", { type: "err" });
  S.espera.unshift({ mail, fecha: isoToday() }); save(); $("#esp-mail").value = "";
  toast(UI.lang === "en" ? "Done, we will let you know." : "Listo, te avisamos.");
}

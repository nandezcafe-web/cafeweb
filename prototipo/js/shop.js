/* ============================================================
   CAFÉS: catálogo por finca, ficha del café, pedido y pago
   ============================================================ */
const varSel = (p) => p.variantes.find((v) => v.g === (UI.variante?.[p.id] || p.variantes.find((x) => x.principal).g)) || p.variantes[0];
const enCarrito = (id, g) => UI.carrito.find((i) => i.id === id && i.g === g);
const totalCarrito = () => UI.carrito.reduce((s, i) => s + i.n * i.precio, 0);
const unidadesCarrito = () => UI.carrito.reduce((s, i) => s + i.n, 0);
const principal = (p) => p.variantes.find((x) => x.principal) || p.variantes[0];
/* la presentación puede venderse distinto al café (el kilo de Castillo va en grano) */
const saleDe = (p, v) => (v && v.sale) || p.sale;
const saleNotaDe = (p, v) => (v && v.saleNota) || p.saleNota;
const envioDe = (subtotal) => (subtotal >= CONFIG.envio.gratisDesde ? 0 : CONFIG.envio.costo);

/* ---------- tarjetas ---------- */
/* ---------- la foto de cada café ----------
   Convención: /img/productos/<id del café en minúsculas>.webp y su versión
   @0.5x. Por ahora son pruebas hechas con el empaque en diseño; cuando lleguen
   las fotos reales se reemplazan con el mismo nombre y nada más cambia.
   Si un café todavía no tiene foto, se muestra el dibujo de su montaña. */
const CON_FOTO = new Set(["P-GEI", "P-CAS"]);
function fotoProducto(p, { sizes = "(min-width:900px) 360px, 70vw", clase = "prod-foto", prioridad = false } = {}) {
  if (!CON_FOTO.has(p.id)) return ridge(p, { w: 420, h: 200 });
  const base = `/img/productos/${p.id.toLowerCase()}`;
  return `<img class="${clase}" src="${foto(base + ".webp")}" srcset="${foto(base + "@0.5x.webp")} 452w, ${foto(base + ".webp")} 904w"
    sizes="${sizes}" width="904" height="827" alt="${esc(UI.lang === "en" ? `Bag of ${tx(p.nombre)}` : `Bolsa de ${tx(p.nombre)}`)}"
    ${prioridad ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function cafeCard(p, i = 0) {
  const f = fincaDe(p), v = principal(p);
  return `<article class="card-cafe reveal" style="--i:${i}">
    <div class="cc-art${CON_FOTO.has(p.id) ? " con-foto" : ""}" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
      ${fotoProducto(p)}
      <span class="state st-publicado">${v.stock} ${t("disponibles")}</span>
      <div class="cc-score"><b>${esc(p.puntaje)}</b><small style="color:${LV[p.nivel].c}">SCA · ${lvl(p.nivel)}</small></div>
    </div>
    <div class="cc-body">
      <p class="kicker">${esc(tr(f.finca || ""))}<br>${esc(p.altitud ? msnm(p.altitud) : "")}</p>
      <h3>${esc(tx(p.nombre))}</h3>
      <p class="notas-linea">${tx(p.notas).join(" · ")}</p>
      <div class="cc-foot"><b class="mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${esc(tx(saleDe(p, v))).toLowerCase()}</small>
        <button class="btn primary sm" data-act="cafe" data-id="${p.id}">${t("ver_cafe")}</button></div>
    </div></article>`;
}

function subastaCard(i = 0) {
  const a = UI.au, l = AU_LOTE, top = topBid(a), en = UI.lang === "en";
  return `<article class="card-cafe dark reveal dark-art" style="--i:${i}">
    <div class="cc-art" data-act="go" data-to="subasta" role="button" tabindex="0" aria-label="${t("nav_subasta")}">
      ${ridge(l, { w: 420, h: 200, dark: true })}
      <span class="state st-en-subasta">${a.ended ? t("cerrada") : t("en_vivo")}</span>
      <div class="cc-score"><b>${esc(l.puntaje)}</b><small>SCA</small></div>
    </div>
    <div class="cc-body">
      <p class="kicker">${en ? "For collectors and roasters" : "Para coleccionistas y tostadores"}<br>${esc(l.productor)}, ${esc(l.municipio)} · ${a.kg} kg ${en ? "green coffee" : "de café verde"}</p>
      <h3>${esc(tr(l.variedad))} <em>${esc(tr(l.proceso))}</em></h3>
      <p class="notas-linea">${l.perfil.map(tr).join(" · ")}</p>
      <div class="cc-foot"><b class="mono" data-live-price>${usd(top ? top.p : a.start)}</b><small>${t("por_kg")} ${en ? "green" : "verde"}</small>
        <button class="btn primary sm" data-act="go" data-to="subasta">${a.ended ? t("ver_cafe") : (en ? "See the auction" : "Ver la subasta")}</button></div>
    </div></article>`;
}

function fincaCard(f, i = 0) {
  const cafes = S.productos.filter((p) => p.fincaId === f.id), en = UI.lang === "en";
  return `<article class="finca reveal ${f.propia ? "propia" : ""}" style="--i:${i}">
    <div class="finca-art">${ridge(f, { w: 380, h: 120 })}</div>
    <div class="finca-body">
      <p class="kicker">${esc(f.municipio)} · ${msnm(f.altitud)}</p>
      <h3>${esc(tr(f.finca))}</h3>
      <p class="finca-prod">${esc(tr(f.productor))}${f.exclusiva ? ` <span class="excl">${en ? "exclusive" : "exclusivo"}</span>` : ""}</p>
      <p class="hint">${esc(tx(f.historia))}</p>
      <div class="finca-foot">
        <span class="var-chip">${esc(tr(f.variedad))}</span>
        ${f.proxima ? `<span class="pronto">${en ? "First harvest" : "Primera cosecha"} ${f.proxima}</span>`
          : cafes.length ? `<button class="btn sm" data-act="cafe" data-id="${cafes[0].id}">${t("ver_cafe")}</button>`
          : `<button class="btn sm" data-act="go" data-to="subasta">${t("nav_subasta")}</button>`}
      </div>
    </div></article>`;
}

/* ---------- para cafeterías: precio por volumen ---------- */
function bloqueCafeterias() {
  const en = UI.lang === "en";
  const filas = S.productos.map((p) => {
    const b = principal(p), k = p.variantes.find((x) => x.g === 1000);
    return `<tr><th scope="row">${esc(tx(p.nombre))}<small>${esc(p.puntaje)} SCA</small></th>
      <td class="mono">${cop(b.precio)}<small>${gramos(b.g)}</small></td>
      <td class="mono">${k ? cop(k.precio) : "—"}<small>${k ? (en ? "whole bean" : "en grano") : ""}</small></td>
      <td><button class="btn sm" data-act="cotizar" data-id="${p.id}">${en ? "Quote" : "Cotizar"}</button></td></tr>`;
  }).join("");
  return `<section class="section b2b" id="cafeterias">
    <div class="section-head"><p class="eyebrow">${en ? "For cafés and roasters" : "Para cafeterías y tostadores"}</p>
      <h2>${en ? "Coffee by the <em>kilo</em>" : "Café por <em>kilos</em>"}</h2>
      <p>${en ? "The kilo ships whole bean, roasted in the week you order. From 5 kg a month we quote a volume price and can roast to your profile."
        : "El kilo va en grano y se tuesta la semana del pedido. Desde 5 kg al mes te cotizamos precio por volumen y podemos tostar a tu perfil."}</p></div>
    <div class="table-scroll"><table class="b2b-tabla">
      <thead><tr><th>${en ? "Coffee" : "Café"}</th><th>${en ? "Bag" : "Bolsa"}</th><th>1 kg</th><th>${en ? "5 kg or more" : "5 kg o más"}</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
    <p class="hint">${en ? "Monthly supply of 2 kg: see the Café plan in the subscription." : "Suministro de 2 kg al mes: mira el plan Cafetería en la suscripción."}
      <a href="${ruta("suscripcion")}" data-act="go" data-to="suscripcion">${en ? "See the plan" : "Ver el plan"}</a></p>
  </section>`;
}

function cotizar(id) {
  const en = UI.lang === "en";
  modal(en ? "Volume quote" : "Cotización por volumen", `
    <p class="hint">${en ? `We answer by ${canalContacto()} with the price per kilo and the roasting date.` : `Te respondemos por ${canalContacto()} con el precio por kilo y la fecha de tueste.`}</p>
    <div class="form-grid">
      <div class="field"><label class="lbl" for="ct-negocio">${en ? "Business" : "Negocio"}</label><input id="ct-negocio" class="input" autocomplete="organization"></div>
      <div class="field"><label class="lbl" for="ct-ciudad">${en ? "City" : "Ciudad"}</label><input id="ct-ciudad" class="input" autocomplete="address-level2"></div>
      <div class="field"><label class="lbl" for="ct-cafe">${en ? "Coffee" : "Café"}</label>
        <select id="ct-cafe" class="input">${S.productos.map((p) => `<option value="${p.id}" ${p.id === id ? "selected" : ""}>${esc(tx(p.nombre))}</option>`).join("")}</select></div>
      <div class="field"><label class="lbl" for="ct-kg">${en ? "Kilos a month" : "Kilos al mes"}</label><input id="ct-kg" class="input" type="number" inputmode="numeric" min="1" value="5"></div>
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="ct-tel">WhatsApp</label><input id="ct-tel" class="input" type="tel" inputmode="tel" autocomplete="tel" placeholder="300 000 0000"></div>
    </div>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
      <button class="btn primary" data-act="cotizar-ok">${en ? "Ask for the quote" : "Pedir la cotización"}</button></div>`, "narrow");
}
function cotizarOk() {
  const en = UI.lang === "en", negocio = $("#ct-negocio").value.trim();
  if (!negocio) return toast(en ? "Write the name of your business." : "Escribe el nombre del negocio.", { type: "err" });
  const p = prodById($("#ct-cafe").value), d = { negocio, ciudad: $("#ct-ciudad").value.trim(), kg: $("#ct-kg").value, tel: $("#ct-tel").value.trim(), cafe: tx(p.nombre) };
  const texto = `Hola ${CONFIG.marca}, quiero cotizar café para mi negocio.\nNegocio: ${d.negocio}${d.ciudad ? " · " + d.ciudad : ""}\nCafé: ${d.cafe}\nKilos al mes: ${d.kg}${d.tel ? "\nWhatsApp: " + d.tel : ""}`;
  enviarAviso("cotizacion", d);
  closeModal();
  abrirContacto(texto, `Cotización · ${d.negocio}`);
  toast(en ? `Send the message that opened in your ${canalContacto()}.` : `Envía el mensaje que se abrió en tu ${canalContacto()}.`);
}

/* abre WhatsApp o el correo con el mensaje ya escrito */
function abrirContacto(texto, asunto) {
  const url = contactoURL(texto, asunto);
  if (url.startsWith("mailto:")) window.location.href = url;
  else window.open(url, "_blank", "noopener");
}

/* Registros cortos (suscripción, postores, avisos): al formulario si existe;
   si no, se abre el mensaje para que la persona lo envíe y de verdad nos llegue */
function registrar(tipo, datos, texto, asunto) {
  const en = UI.lang === "en";
  if (CONFIG.formulario) {
    enviarAviso(tipo, datos).then((ok) => toast(ok ? (en ? "Done, we will write to you." : "Listo, te escribimos.")
      : (en ? "It did not go through. Write to " : "No se pudo enviar. Escríbenos a ") + CONFIG.correo, ok ? {} : { type: "err" }));
    return;
  }
  abrirContacto(texto, asunto);
  toast(en ? `Send the message that opened in your ${canalContacto()} so it reaches us.` : `Envía el mensaje que se abrió en tu ${canalContacto()} para que nos llegue.`);
}

/* ---------- catálogo ---------- */
function viewCafes() {
  const en = UI.lang === "en";
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${en ? "This harvest" : "Esta cosecha"}</p>
        <h2 class="reveal" style="--i:1">${en ? "What we have <em>at home</em>" : "Lo que tenemos <em>en casa</em>"}</h2>
        <p class="reveal" style="--i:2">${en
          ? "These are the coffees we are roasting right now. Each one comes from a neighbouring farm in Norte de Santander and carries the name of whoever grew it."
          : "Estos son los cafés que estamos tostando ahora. Cada uno viene de una finca vecina de Norte de Santander y lleva el nombre de quien lo cultivó."}</p></div>
    </div>
    <div class="dos">${S.productos.map((p, i) => cafeCard(p, i)).join("")}${subastaCard(S.productos.length)}</div>
    ${bloqueCafeterias()}
    <section class="section">
      <div class="section-head"><p class="eyebrow">${en ? "The neighbours" : "Los vecinos"}</p>
        <h2>${en ? "Who <em>grows it</em>" : "Quién <em>lo cultiva</em>"}</h2></div>
      <div class="fincas">${S.fincas.map((f, i) => fincaCard(f, i)).join("")}</div>
    </section>`;
}

/* ---------- ficha del café ---------- */
function viewCafe() {
  const p = prodById(UI.cafe) || S.productos[0], f = fincaDe(p), v = varSel(p), fi = p.ficha, en = UI.lang === "en";
  const E = CONFIG.envio;
  /* la ficha como registro de campo: una fila por dato, columnas alineadas */
  const attr = (k, a, fmt = (x) => tr(x)) => `<tr style="--c:${LV[a.nivel].c}">
      <th scope="row">${k}</th>
      <td class="fv">${esc(fmt(a.v))}${a.detalle ? `<small>${esc(tr(a.detalle))}</small>` : ""}</td>
      <td class="fn"><span class="lvtag">${lvl(a.nivel)}</span></td>
      <td class="ff">${esc(tr(a.fuente))}<small>${fmtFecha(a.fecha)}</small></td></tr>`;
  const R = p.receta;
  const enGrano = tx(saleDe(p, v)) === tx({ es: "En grano", en: "Whole bean" });
  const sinMolino = enGrano
    ? ` <a class="enlace" href="${esc(contactoURL(en ? `Hi, I want the ${tx(p.nombre)} but I have no grinder.` : `Hola, quiero el ${tx(p.nombre)} pero no tengo molino.`, tx(p.nombre)))}" target="_blank" rel="noopener">${en ? "No grinder? Write to us." : "¿No tienes molino? Escríbenos."}</a>`
    : "";
  return `<article class="prod">
    <div class="prod-top">
    <div class="prod-buy reveal">
      <p class="eyebrow">${esc(tr(f.productor || ""))}, ${esc(tr(f.finca || ""))}</p>
      <h1>${esc(tx(p.nombre))}</h1>
      <p class="lede">${esc(tx(f.historia || { es: "", en: "" }))}</p>

      <div class="vars" role="radiogroup" aria-label="${en ? "Size" : "Presentación"}">
        ${p.variantes.map((x) => `<button class="var ${x.g === v.g ? "on" : ""}" role="radio" aria-checked="${x.g === v.g}" data-act="var" data-p="${p.id}" data-g="${x.g}"
          aria-label="${esc(`${gramos(x.g)} · ${tx(x.label)} · ${cop(x.precio)}${x.stock ? "" : " · " + t("agotado")}`)}" ${x.stock ? "" : "disabled"}>
          <b>${gramos(x.g)}</b><span>${esc(tx(x.label))}</span><small>${x.stock ? esc(tx(x.nota)) : t("agotado")}</small>
          <span class="mono precio">${cop(x.precio)}</span></button>`).join("")}
      </div>

      <p class="sale"><span class="sale-tag">${esc(tx(saleDe(p, v)))}</span> <span>${esc(tx(saleNotaDe(p, v)))}${sinMolino}</span></p>

      <div class="buy-row">
        <div><b class="precio-grande mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${cop((v.precio / v.g) * 1000)} ${t("por_kg")}</small></div>
        <button class="btn primary lg" data-act="add" data-p="${p.id}" data-g="${v.g}" ${v.stock ? "" : "disabled"}>${t("agregar")}</button>
      </div>
      <p class="hint">${v.stock} ${t("disponibles")} · ${en
        ? `ships from Cúcuta within Colombia in ${tx(E.dias)} · ${cop(E.costo)}, free from ${cop(E.gratisDesde)}`
        : `sale de Cúcuta y llega en ${tx(E.dias)} · envío ${cop(E.costo)}, gratis desde ${cop(E.gratisDesde)}`}</p>
    </div>

    <div class="prod-art reveal" style="--i:1">
      <div class="prod-escena">
        ${fotoProducto(p, { sizes: "(min-width:900px) 560px, 90vw", prioridad: true })}
        <p class="prod-sello"><b>${esc(p.puntaje)}</b><small>SCA</small></p>
      </div>
      <ul class="notas-chips">${tx(p.notas).map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      <div class="foto-pend">${en ? "Photo of the farm and the producer" : "Foto de la finca y del productor"}</div>
    </div>
    </div>

    <section class="prod-ficha reveal" style="--i:2">
      <div class="section-head"><p class="eyebrow">${t("ficha")}</p>
        <h2>${en ? "Every number says <em>who checked it</em>" : "Cada dato dice <em>quién lo comprobó</em>"}</h2></div>
      <table class="ficha-tabla">
        <thead><tr><th scope="col">${en ? "Data" : "Dato"}</th><th scope="col">${en ? "Value" : "Valor"}</th><th scope="col">${en ? "Level" : "Nivel"}</th><th scope="col">${en ? "Who checked it" : "Quién lo comprobó"}</th></tr></thead>
        <tbody>
        ${attr(en ? "Variety" : "Variedad", fi.variedad)}${attr(en ? "Altitude" : "Altitud", fi.altitud, msnm)}
        ${attr(en ? "Process" : "Proceso", fi.proceso)}${attr(en ? "SCA score" : "Puntaje SCA", fi.puntaje, (x) => x)}
        ${attr(en ? "Yield factor" : "Factor de rendimiento", fi.factor, (x) => x)}
        </tbody>
      </table>
      <dl class="leyenda">${Object.values(LV).map((o) => `<div style="--c:${o.c}"><dt><i></i>${tx(o.label)}</dt><dd>${tx(o.desc)}</dd></div>`).join("")}</dl>
    </section>

    <section class="prod-receta reveal" style="--i:3">
      <div class="section-head"><p class="eyebrow">${t("receta")}</p>
        <h2>${en ? "The house <em>recipe</em>" : "La receta <em>de la casa</em>"}</h2></div>
      <div class="receta">${[[en ? "Method" : "Método", en && R.metodo === "Prensa francesa" ? "French press" : R.metodo], [en ? "Coffee" : "Café", R.dosis],
        [en ? "Water" : "Agua", R.agua], [en ? "Temp." : "Temperatura", R.temp],
        [en ? "Time" : "Tiempo", R.tiempo], [en ? "Grind" : "Molienda", tx(R.molienda)]]
        .map(([k, val]) => `<div><span class="lbl">${k}</span><b>${esc(val)}</b></div>`).join("")}</div>
      <p class="hint">${en ? "Too bitter: grind coarser. Too weak: grind finer." : "Si queda amargo, muele más grueso. Si queda aguado, muele más fino."}</p>
    </section>

    <section class="cierre reveal" style="--i:4">
      <p>${en
        ? "Each lot comes from a single harvest, and it runs out. If you want the next one to reach your door, there is the subscription."
        : "Cada lote es de una sola cosecha y se acaba. Si quieres que el siguiente te llegue a la casa, está la suscripción."}</p>
      <button class="btn" data-act="go" data-to="suscripcion">${en ? "See the subscription" : "Ver la suscripción"}</button>
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
    $("#cart-foot").innerHTML = "";
    return;
  }
  const E = CONFIG.envio, envio = envioDe(totalCarrito()), falta = E.gratisDesde - totalCarrito();
  cuerpo.innerHTML = `
    <ul class="cart-items">${UI.carrito.map((i) => {
      const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
      return `<li class="cart-item">
        <div class="cart-art">${CON_FOTO.has(p.id) ? fotoProducto(p, { sizes: "72px", clase: "" }) : ridge(p, { w: 120, h: 90, label: false })}</div>
        <div class="cart-txt"><b>${esc(tx(p.nombre))}</b><small>${gramos(i.g)} · ${esc(tx(saleDe(p, v))).toLowerCase()}</small>
          <div class="cart-qty">
            <button class="btn sm" data-act="qty" data-p="${i.id}" data-g="${i.g}" data-d="-1" aria-label="${en ? "Remove one" : "Quitar uno"}">−</button>
            <span class="mono">${i.n}</span>
            <button class="btn sm" data-act="qty" data-p="${i.id}" data-g="${i.g}" data-d="1" aria-label="${en ? "Add one" : "Agregar uno"}" ${i.n >= v.stock ? "disabled" : ""}>+</button>
            <button class="cart-del" data-act="quitar" data-p="${i.id}" data-g="${i.g}">${en ? "Remove" : "Quitar"}</button>
          </div></div>
        <b class="mono cart-precio">${cop(i.precio * i.n)}</b></li>`;
    }).join("")}</ul>

    <div class="cart-sumas">
      <div><span>Subtotal</span><b class="mono">${cop(totalCarrito())}</b></div>
      <div><span>${en ? "Shipping" : "Envío"}</span><b class="mono">${envio ? cop(envio) : (en ? "Free" : "Gratis")}</b></div>
      <div class="cart-total"><span>${t("total")}</span><b class="mono">${cop(totalCarrito() + envio)}</b></div>
      <p class="hint">${envio
        ? (en ? `Add ${cop(falta)} more and shipping is free. ` : `Te faltan ${cop(falta)} para el envío gratis. `)
        : ""}${en ? "Arrives in " : "Llega en "}${tx(E.dias)} ${en ? "with " : "por "}${esc(E.transportadora)}${en ? ", anywhere in Colombia." : ", a cualquier ciudad de Colombia."}</p>
    </div>

    <div class="form-grid cart-form">
      <div class="field"><label class="lbl" for="pd-nombre">${en ? "Name" : "Nombre o negocio"}</label><input id="pd-nombre" class="input" autocomplete="name" enterkeyhint="next"></div>
      <div class="field"><label class="lbl" for="pd-ciudad">${en ? "City" : "Ciudad"}</label><input id="pd-ciudad" class="input" autocomplete="address-level2" enterkeyhint="next"></div>
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="pd-tel">${en ? "WhatsApp (to confirm your order)" : "WhatsApp (para confirmarte el pedido)"}</label><input id="pd-tel" class="input" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="done" placeholder="300 000 0000"></div>
    </div>`;
  const pie = $("#cart-foot"), mp = !!CONFIG.pagos.mercadoPago;
  pie.innerHTML = `
    ${mp ? `<button class="btn primary" data-act="pedido-mp">${t("pagar_mp")}</button>` : ""}
    <button class="btn ${mp ? "" : "primary"}" data-act="pedido-wa">${en ? `Send order by ${canalContacto()}` : `Enviar pedido por ${canalContacto()}`}</button>
    <p class="hint">${mp
      ? (en ? "Card, PSE, Nequi or cash through Mercado Pago." : "Tarjeta, PSE, Nequi o efectivo con Mercado Pago.")
      : (en ? `No payment yet: we confirm the order and you pay by ${tx(CONFIG.pagos.manual)}.`
            : `Todavía no pagas: te confirmamos el pedido y pagas por ${tx(CONFIG.pagos.manual)}.`)}</p>`;
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
  const nombre = $("#pd-nombre").value.trim(), ciudad = $("#pd-ciudad").value.trim(), en = UI.lang === "en";
  if (!nombre) { toast(en ? "Write your name." : "Escribe tu nombre.", { type: "err" }); $("#pd-nombre").focus(); return null; }
  if (!ciudad) { toast(en ? "Write the city it goes to." : "Escribe la ciudad a la que va.", { type: "err" }); $("#pd-ciudad").focus(); return null; }
  return { nombre, ciudad, tel: $("#pd-tel").value.trim() };
}

/* número de pedido que no choca entre clientes: fecha + cuatro letras al azar */
const numeroPedido = () => "NDZ-" + isoToday().slice(5).replace("-", "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

function registrarPedido(d, canal) {
  const cl = upsertCliente(d.nombre, d.ciudad, d.tel);
  const subtotal = totalCarrito(), envio = envioDe(subtotal), total = subtotal + envio;
  const items = UI.carrito.map((i) => {
    const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
    return { id: i.id, nombre: i.nombre, n: i.n, precio: i.precio, forma: tx(saleDe(p, v)) };
  });
  const pedido = { id: numeroPedido(), clienteId: cl.id, canal, nombre: d.nombre, ciudad: d.ciudad, tel: d.tel,
    items, subtotal, envio, total, fecha: isoToday() };
  S.pedidos.unshift(pedido);
  UI.carrito.forEach((i) => {
    const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
    v.stock = Math.max(0, v.stock - i.n);
    p.stock = principal(p).stock;
    atribuirVenta(p, (i.n * i.g) / p.presentacion, i.precio * i.n);
  });
  const L = (a) => a.join("\n");
  const texto = L([
    `Hola ${CONFIG.marca}, quiero hacer el pedido ${pedido.id}:`,
    ...items.map((i) => `· ${i.n} × ${i.nombre} (${i.forma.toLowerCase()}) = ${cop(i.precio * i.n)}`),
    `Subtotal: ${cop(subtotal)}`,
    `Envío: ${envio ? cop(envio) : "gratis"}`,
    `Total: ${cop(total)}`,
    `${d.nombre} · ${d.ciudad}${d.tel ? " · WhatsApp " + d.tel : ""}`,
  ]);
  UI.carrito = []; guardarCarrito(); save(); cerrarCarrito(); render();
  enviarAviso("pedido", { ...pedido, texto });
  return { pedido, texto };
}

/* Después de pedir: número, qué sigue y el mensaje a la vista por si no se abrió */
function confirmacionPedido(pedido, texto) {
  const en = UI.lang === "en", canal = canalContacto(), url = contactoURL(texto, `Pedido ${pedido.id}`);
  modal(`${en ? "Order" : "Pedido"} <em>${esc(pedido.id)}</em>`, `
    <ol class="pasos-pedido">
      <li><b>${en ? `Send the message in your ${canal}.` : `Envía el mensaje en tu ${canal}.`}</b>
        <span>${en ? "It is already written. Until you send it, we do not receive your order." : "Ya está escrito. Hasta que lo envíes, no nos llega el pedido."}</span></li>
      <li><b>${en ? "We confirm and you pay." : "Te confirmamos y pagas."}</b>
        <span>${en ? `We reply with the total of ${cop(pedido.total)} and how to pay by ${tx(CONFIG.pagos.manual)}.` : `Te respondemos con el total de ${cop(pedido.total)} y cómo pagar por ${tx(CONFIG.pagos.manual)}.`}</span></li>
      <li><b>${en ? "We ship it." : "Lo despachamos."}</b>
        <span>${en ? `It arrives in ${tx(CONFIG.envio.dias)} with ${CONFIG.envio.transportadora}; we send you the tracking number.` : `Llega en ${tx(CONFIG.envio.dias)} por ${CONFIG.envio.transportadora}; te mandamos la guía para seguirlo.`}</span></li>
    </ol>
    <pre class="pre">${esc(texto)}</pre>
    <div class="dlg-actions">
      <button class="btn" data-act="copiar" data-texto="${esc(texto)}">${en ? "Copy message" : "Copiar mensaje"}</button>
      <a class="btn primary" href="${esc(url)}" ${url.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener"'}>${en ? `Open ${canal}` : `Abrir ${canal}`}</a></div>
    <p class="hint">${en ? `Something wrong? Write to ${CONFIG.correo} with your order number.` : `¿Algo salió mal? Escribe a ${CONFIG.correo} con tu número de pedido.`}</p>`, "narrow");
}

function pedidoWA() {
  const d = datosPedido(); if (!d) return;
  const { pedido, texto } = registrarPedido(d, CONFIG.whatsapp ? "whatsapp" : "correo");
  confirmacionPedido(pedido, texto);
  abrirContacto(texto, `Pedido ${pedido.id}`);
}

/* Mercado Pago: link de pago por producto, link general, o /api/checkout (Checkout Pro) */
async function pedidoMP() {
  const d = datosPedido(); if (!d) return;
  const items = UI.carrito.map((i) => ({ id: `${i.id}-${i.g}`, title: i.nombre, quantity: i.n, unit_price: i.precio }));
  const envio = envioDe(totalCarrito());
  if (envio) items.push({ id: "envio", title: UI.lang === "en" ? "Shipping" : "Envío", quantity: 1, unit_price: envio });
  const directo = UI.carrito.length === 1 && !envio && CONFIG.pagos.porProducto[`${UI.carrito[0].id}-${UI.carrito[0].g}`];
  const { pedido, texto } = registrarPedido(d, "mercadopago");
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
      toast(UI.lang === "en" ? "Payment could not start; send us the order instead." : "No se pudo abrir el pago; envíanos el pedido y lo confirmamos.", { type: "err" });
      return confirmacionPedido(pedido, texto);
    }
  }
  window.open(url, "_blank", "noopener");
}

function copiar(texto) {
  const ok = () => toast(UI.lang === "en" ? "Copied." : "Copiado.");
  try { navigator.clipboard.writeText(texto).then(ok, () => {}); } catch {}
}

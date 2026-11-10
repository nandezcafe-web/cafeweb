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
/* El bono de bienvenida de la comunidad. Debe ser el mismo BONO.pct de tools/correos/Codigo.gs,
   que es quien lo crea y lo valida; aquí solo se anuncia. El envío gratis se mide antes del descuento. */
const BONO_PCT = 10;
const descuentoCarrito = () => (UI.bono ? Math.round((totalCarrito() * UI.bono.pct) / 100) : 0);

/* El precio de un café que todavía no sale: si ya se sabe, se dice; si no,
   "por confirmar". Antes decía "por confirmar" aunque el precio estuviera puesto. */
const precioRotulo = (p, v, en) => (v.precio
  ? `<b class="mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${esc(tx(saleDe(p, v))).toLowerCase()}</small>`
  : `<b>${t("por_confirmar")}</b><small>${esc(tx(saleDe(p, v))).toLowerCase()}</small>`);

/* ---------- tarjetas ---------- */
/* ---------- la foto de cada café ----------
   Convención: /img/productos/<id del café en minúsculas> y su versión @0.5x,
   verticales a 800 × 1120, todas con la bolsa a la misma escala. Para cambiar una foto basta reemplazar el archivo
   con el mismo nombre. Si un café no tiene, se muestra el dibujo de su montaña. */
/* Qué productos tienen foto y en qué formato. Las tres bolsas de la marca
   nueva están en JPG; si algún día se recomprimen a WebP, basta cambiar la
   extensión aquí. */
const CON_FOTO = new Map([["P-CAS", "jpg"], ["P-PAR", "jpg"], ["P-BLE", "jpg"]]);
function fotoProducto(p, { sizes = "(min-width:900px) 360px, 70vw", clase = "prod-foto", prioridad = false } = {}) {
  const ext = CON_FOTO.get(p.id);
  if (!ext) return ridge(p, { w: 420, h: 200 });
  const base = `/img/productos/${p.id.toLowerCase()}`;
  return `<img class="${clase}" src="${foto(`${base}.${ext}`)}" srcset="${foto(`${base}@0.5x.${ext}`)} 400w, ${foto(`${base}.${ext}`)} 800w"
    sizes="${sizes}" width="800" height="1120" alt="${esc(UI.lang === "en" ? `Bag of ${tx(p.nombre)}` : `Bolsa de ${tx(p.nombre)}`)}"
    ${prioridad ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/* El sello de la preventa: cuántas bolsas del cupo quedan, para que se vea que son 90 y se acaban. */
function selloPreventa(p, v = principal(p)) {
  const en = UI.lang === "en";
  if (!CONFIG.preventa.cupo) return t("en_preventa");
  const n = quedanPreventa(v);
  return n > 0 ? `${t("en_preventa")} · ${en ? `${n} left` : `quedan ${n}`}` : (en ? "Pre-order sold out" : "Preventa agotada");
}

function cafeCard(p, i = 0) {
  const f = fincaDe(p), v = principal(p), en = UI.lang === "en", pronto = !!p.proximamente;
  return `<article class="card-cafe reveal${pronto ? " pronto" : ""}" style="--i:${i};--pc:${p.color || "#2F5A3C"}">
    <div class="cc-art${CON_FOTO.has(p.id) ? " con-foto" : ""}" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
      ${fotoProducto(p)}
      ${pronto ? `<span class="g-pronto">${t("proximamente")}<i>${esc(tx(p.sub))}</i></span>` : ""}
      ${pronto ? "" : `<span class="state st-publicado">${enPreventa(p) ? esc(selloPreventa(p, v)) : `${v.stock} ${t("disponibles")}`}</span>
      ${p.puntaje ? `<div class="cc-score"><b>${esc(p.puntaje)}</b><small style="color:${LV[p.nivel].c}">SCA · ${lvl(p.nivel)}</small></div>` : ""}`}
    </div>
    <div class="cc-body">
      <p class="kicker">${esc(f.mezcla ? tr(p.variedad) : tr(f.finca || t("por_confirmar")))}<br>${alturaDe(p) ? esc(alturaDe(p)) : (en ? "altitude to be confirmed" : "altura por confirmar")}</p>
      <h3>${esc(tx(p.nombre))}</h3>
      <p class="notas-linea">${tx(p.notas).join(" · ")}</p>
      <div class="cc-foot">${pronto
        ? `${precioRotulo(p, v, en)}<button class="btn sm" data-act="espera" data-id="${p.id}">${t("avisame")}</button>`
        : `<b class="mono">${cop(precioHoy(p, v))}</b><small>${gramos(v.g)} · ${esc(tx(saleDe(p, v))).toLowerCase()}</small>
        <button class="btn primary sm" data-act="cafe" data-id="${p.id}">${enPreventa(p) ? t("reserva_corta") : t("ver_cafe")}</button>`}</div>
    </div></article>`;
}

/* La tarjeta grande del inicio: la bolsa sobre su propia tinta, el número de la
   serie y el puntaje; abajo la finca, el nombre, las notas y el precio. */
function tarjetaInicio(p, i = 0) {
  const f = fincaDe(p), v = principal(p), en = UI.lang === "en", pronto = !!p.proximamente;
  return `<article class="g-prod g-io${pronto ? " pronto" : ""}" style="--pc:${p.color || "#2F5A3C"};--i:${i}">
    <div class="g-prod-art" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
      ${fotoProducto(p, { clase: "g-prod-foto", sizes: "(min-width:1000px) 400px, 90vw" })}
      ${pronto ? `<span class="g-pronto">${t("proximamente")}<i>${esc(tx(p.sub))}</i></span>` : ""}
      ${pronto || !p.puntaje ? "" : `<p class="g-prod-sca"><b>${esc(p.puntaje)}</b><small>SCA · ${lvl(p.nivel)}</small></p>`}
      ${enPreventa(p) ? `<span class="g-pronto">${esc(selloPreventa(p, v))}</span>` : ""}
      <span class="g-prod-n">0${i + 1}</span>
    </div>
    <div class="g-prod-body">
      <p class="g-kicker">${esc(f.mezcla ? tr(p.variedad) : tr(f.finca || t("por_confirmar")))} · ${alturaDe(p) ? esc(alturaDe(p)) : (en ? "altitude tbc" : "altura por confirmar")}</p>
      <h3>${esc(tx(p.nombre))}</h3>
      <p class="g-notas">${pronto ? esc(tx(p.sub)) : tx(p.notas).join(" · ")}</p>
      <div class="g-prod-foot">${pronto
        ? `${precioRotulo(p, v, en)}<button class="btn sm" data-act="espera" data-id="${p.id}">${t("avisame")}</button>`
        : `<b class="mono">${cop(precioHoy(p, v))}</b><small>${gramos(v.g)} · ${esc(tx(saleDe(p, v))).toLowerCase()}</small>
        <button class="btn primary sm" data-act="add" data-p="${p.id}" data-g="${v.g}" ${topeDe(p, v) ? "" : "disabled"}>${enPreventa(p) ? t("reserva_corta") : t("agregar")}</button>`}</div>
    </div></article>`;
}

/* Lista de espera de un café que todavía no sale: un correo y listo */
function listaEspera(id) {
  const p = itemById(id), en = UI.lang === "en";
  if (!p) return;
  modal(t("avisame"), `
    <p class="hint">${en ? `We write to you the day <b>${esc(tx(p.nombre))}</b> goes on sale, with its data sheet and price.`
      : `Te escribimos el día que salga <b>${esc(tx(p.nombre))}</b>, con su ficha y su precio.`}</p>
    <div class="field"><label class="lbl" for="le-mail">${en ? "Email" : "Correo"}</label><input id="le-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none"></div>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
      <button class="btn primary" data-act="espera-ok" data-id="${p.id}">${t("avisame")}</button></div>`, "narrow");
  setTimeout(() => $("#le-mail")?.focus(), 50);
}
function listaEsperaOk(id) {
  const p = itemById(id), en = UI.lang === "en", correo = ($("#le-mail")?.value || "").trim();
  if (!p || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { toast(en ? "Check the email." : "Revisa el correo.", { type: "err" }); return; }
  S.espera.push({ id: nextId("LE"), producto: p.id, correo, fecha: isoToday() }); save();
  closeModal();
  registrar("espera", { producto: tx(p.nombre), correo },
    en ? `Hi, let me know when ${tx(p.nombre)} is out. My email: ${correo}` : `Hola, avísenme cuando salga ${tx(p.nombre)}. Mi correo: ${correo}`,
    (en ? "Notify me: " : "Avísame: ") + tx(p.nombre));
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

/* enFicha: dentro de la ficha del café, donde "Ver el café" llevaría a la misma página */
function fincaCard(f, i = 0, { enFicha = false } = {}) {
  const cafes = S.productos.filter((p) => p.fincaId === f.id || (p.mezcla || []).includes(f.id)), en = UI.lang === "en";
  return `<article class="finca reveal ${f.propia ? "propia" : ""}" style="--i:${i}">
    <div class="finca-art">${ridge(f, { w: 380, h: 120 })}</div>
    <div class="finca-body">
      <p class="kicker">${esc([f.vereda, f.municipio].filter(Boolean).join(", "))} · ${f.altitud ? msnm(f.altitud) : (en ? "altitude to be confirmed" : "altura por confirmar")}</p>
      <h3>${esc(tr(f.finca))}</h3>
      ${conocido(f.productor) || f.exclusiva ? `<p class="finca-prod">${conocido(f.productor) ? esc(tr(f.productor)) : ""}${f.exclusiva ? ` <span class="excl">${en ? "exclusive" : "exclusivo"}</span>` : ""}</p>` : ""}
      ${historiaPublica(f) ? `<p class="hint">${esc(historiaPublica(f))}</p>` : ""}
      <div class="finca-foot">
        <span class="var-chip">${esc(tr(f.variedad))}</span>
        ${f.proxima ? `<span class="pronto">${en ? "First harvest" : "Primera cosecha"} ${f.proxima}</span>`
          : enFicha ? ""
          : cafes.length ? `<button class="btn sm" data-act="cafe" data-id="${cafes[0].id}">${t("ver_cafe")}</button>`
          : visible("subasta") ? `<button class="btn sm" data-act="go" data-to="subasta">${t("nav_subasta")}</button>` : ""}
      </div>
    </div></article>`;
}

/* ---------- para cafeterías: precio por volumen ---------- */
function bloqueCafeterias() {
  const en = UI.lang === "en";
  const filas = S.productos.filter((p) => !p.proximamente).map((p) => {
    const b = principal(p), k = p.variantes.find((x) => x.g === 1000);
    return `<tr><th scope="row">${esc(tx(p.nombre))}<small>${esc(p.puntaje)} SCA</small></th>
      <td class="mono">${cop(b.precio)}<small>${gramos(b.g)}</small></td>
      <td class="mono">${k ? cop(k.precio) : "—"}<small>${k ? (en ? "whole bean" : "en grano") : ""}</small></td>
      <td><button class="btn sm" data-act="cotizar" data-id="${p.id}">${en ? "Quote" : "Cotizar"}</button></td></tr>`;
  }).join("");
  return `<section class="section b2b" id="cafeterias">
    <div class="section-head"><p class="eyebrow">${en ? "For cafés and roasters" : "Para cafeterías y tostadores"}</p>
      <h2>${en ? "Coffee by the <em>kilo</em>" : "Café por <em>kilos</em>"}</h2>
      <p>${en ? "The kilo ships whole bean. From 5 kg a month we quote a volume price and can roast to your profile."
        : "El kilo va en grano. Desde 5 kg al mes te cotizamos precio por volumen y podemos tostar a tu perfil."}</p></div>
    <div class="table-scroll"><table class="b2b-tabla">
      <thead><tr><th>${en ? "Coffee" : "Café"}</th><th>${en ? "Bag" : "Bolsa"}</th><th>1 kg</th><th>${en ? "5 kg or more" : "5 kg o más"}</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
    <p class="hint">${en ? "Monthly supply of 2 kg: see the Barista plan in the subscription." : "Suministro de 2 kg al mes: mira el plan Barista en la suscripción."}
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
  if (CONFIG.registro || CONFIG.formulario) {
    enviarAviso(tipo, datos).then((ok) => {
      if (ok) return toast(en ? "Done, we will write to you." : "Listo, te escribimos.");
      abrirContacto(texto, asunto);
      toast(en ? `It did not save. Send the message that opened in your ${canalContacto()}.` : `No se pudo guardar. Envía el mensaje que se abrió en tu ${canalContacto()}.`, { type: "err" });
    });
    return;
  }
  abrirContacto(texto, asunto);
  toast(en ? `Send the message that opened in your ${canalContacto()} so it reaches us.` : `Envía el mensaje que se abrió en tu ${canalContacto()} para que nos llegue.`);
}

/* ---------- catálogo ---------- */
/* La tienda tiene dos puertas: cafés y accesorios. Esta fila las une en las tres páginas. */
function subnavTienda(activa) {
  const it = [["cafes", t("nav_cafes_esp")], ["accesorios", t("nav_accesorios")]];
  return `<nav class="g-subnav reveal" aria-label="${t("nav_tienda")}">
    <a href="${ruta("tienda")}" data-act="go" data-to="tienda"${activa === "tienda" ? ' aria-current="page"' : ""}>${t("nav_tienda")}</a>
    ${it.map(([v, txt]) => `<a href="${ruta(v)}" data-act="go" data-to="${v}"${activa === v ? ' aria-current="page"' : ""}>${txt}</a>`).join("")}</nav>`;
}

function viewTienda() {
  const en = UI.lang === "en", p = S.productos.find((x) => !x.proximamente) || S.productos[0];
  const n = S.productos.length, ya = S.productos.filter((x) => !x.proximamente).length;
  return `${subnavTienda("tienda")}
    <div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_tienda")}</p>
        <h1 class="reveal" style="--i:1">${en ? "Everything <em>from the house</em>" : "Todo lo <em>de la casa</em>"}</h1>
        <p class="reveal" style="--i:2">${en ? "Coffee from neighbouring farms, the gear to brew it and Nandez Coffee Gang merch."
          : "Café de fincas vecinas, lo necesario para prepararlo y el merch Nandez Coffee Gang."}</p></div>
    </div>
    <div class="g-puertas">
      <a class="g-puerta reveal" style="--pc:${p.color || "#2F5A3C"};--i:3" href="${ruta("cafes")}" data-act="go" data-to="cafes">
        <span class="g-puerta-art">${fotoProducto(p, { clase: "g-prod-foto", sizes: "(min-width:900px) 520px, 90vw" })}</span>
        <span class="g-puerta-txt"><small>01 · ${n} ${en ? "coffees" : "cafés"}${ya < n ? ` · ${ya} ${en ? "on sale" : "a la venta"}` : ""}</small>
          <b>${t("nav_cafes_esp")}</b><i>${en ? "Two single farm, whole bean, and a ground blend." : "Dos de una sola finca, en grano, y un blend molido."}</i></span></a>
      <a class="g-puerta oscura reveal" style="--i:4" href="${ruta("accesorios")}" data-act="go" data-to="accesorios">
        <span class="g-puerta-art"><img class="g-prod-foto" src="${foto("/img/productos/m-gor.jpg")}" width="640" height="640" alt="" loading="lazy" decoding="async"><span class="g-acc-pronto">${t("proximamente")}</span><span class="g-pronto">Nandez Coffee Gang<i>${t("proximamente")}</i></span></span>
        <span class="g-puerta-txt"><small>02 · ${accesoriosVisibles().length} ${en ? "pieces" : "piezas"} · ${t("proximamente").toLowerCase()}</small>
          <b>${t("nav_accesorios")}</b><i>${conPreparar()
            ? (en ? "Dripper, grinder, kettle, and things to wear." : "Gotero, molino, tetera, y algo para ponerse.")
            : (en ? `T-shirt, cap, mug and tote bag from ${CONFIG.comunidad}.` : `Camiseta, gorra, taza y bolsa de tela de ${CONFIG.comunidad}.`)}</i></span></a>
    </div>`;
}

function accesorioCard(a, i = 0) {
  /* Con foto, el merch se asoma borroso (el desenfoque va en el archivo: la foto
     nítida no se publica) y el nombre baja al texto de la tarjeta. */
  return `<article class="g-acc reveal${a.foto ? " con-foto" : ""}" style="--pc:${a.color};--i:${i}">
    <div class="g-acc-art" data-act="espera" data-id="${a.id}" role="button" tabindex="0" aria-label="${esc(`${tx(a.nombre)} · ${t("proximamente")} · ${t("avisame")}`)}">
      ${a.foto ? `<img class="g-acc-foto" src="${foto(a.foto)}" width="640" height="640" alt="" loading="lazy" decoding="async"><span class="g-acc-pronto">${t("proximamente")}</span>`
        : `<span class="g-acc-n">${String(i + 1).padStart(2, "0")}</span><b>${esc(tx(a.nombre))}</b>`}</div>
    <div class="g-acc-body">
      ${a.foto ? `<h3>${esc(tx(a.nombre))}</h3>` : ""}
      <p>${esc(tx(a.desc))}</p>
      <div class="g-prod-foot">${a.proximamente
        ? `${a.foto ? "" : `<b>${t("proximamente")}</b>`}<button class="btn sm" data-act="espera" data-id="${a.id}">${t("avisame")}</button>`
        : `<b class="mono">${cop(a.precio)}</b>`}</div>
    </div></article>`;
}

function viewAccesorios() {
  const en = UI.lang === "en", prep = conPreparar();
  const grupos = [["preparar", en ? "To brew at home" : "Para preparar en casa"], ["merch", "Merch " + esc(CONFIG.comunidad)]]
    .filter(([g]) => CONFIG.accesoriosVisibles.includes(g));
  return `${subnavTienda("accesorios")}
    <div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_tienda")} · ${t("nav_accesorios")}</p>
        <h1 class="reveal" style="--i:1">${prep ? (en ? "To brew it, <em>and to wear it</em>" : "Para prepararlo, <em>y para ponértelo</em>")
                                              : (en ? `Wear <em>${CONFIG.comunidad}</em>` : `Ponte <em>${CONFIG.comunidad}</em>`)}</h1>
        <p class="reveal" style="--i:2">${en ? "We are choosing each piece. Leave your email on the ones you want and we tell you the day they are out, with their price."
          : "Estamos escogiendo cada pieza. Deja tu correo en las que quieras y te avisamos el día que salgan, con su precio."}</p></div>
    </div>
    ${grupos.map(([g, titulo]) => `<section class="g-acc-grupo">
      ${grupos.length > 1 ? `<p class="g-kicker reveal">${titulo}</p>` : ""}
      <div class="g-accs">${ACCESORIOS.filter((a) => a.grupo === g).map((a, i) => accesorioCard(a, i)).join("")}</div>
    </section>`).join("")}`;
}

/* ---------- catálogo ---------- */
function viewCafes() {
  const en = UI.lang === "en";
  return `${subnavTienda("cafes")}
    <div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_tienda")} · ${t("nav_cafes_esp")}</p>
        <h1 class="reveal" style="--i:1">${en ? "Three coffees, <em>medium roast</em>" : "Tres cafés, <em>tostión media</em>"}</h1>
        <p class="reveal" style="--i:2">${en
          ? "Two from a single farm, whole bean, and a blend of the two, ground. All from Norte de Santander."
          : "Dos de una sola finca, en grano, y un blend de los dos, molido. Todos de Norte de Santander."}</p></div>
    </div>
    <div class="dos">${S.productos.map((p, i) => cafeCard(p, i)).join("")}${visible("subasta") ? subastaCard(S.productos.length) : ""}</div>
    ${CONFIG.cafeterias ? bloqueCafeterias() : ""}`;
}

/* ---------- la taza ----------
   La catación en una rueda chica: los ocho atributos del formato SCA, de 1 a 9, con
   la escala completa, sin acercarla para exagerar. Entra creciendo desde el centro
   al llegar a la vista, y tocar un atributo explica qué significa. El blend dibuja
   sus dos cafés, porque su taza es la unión de las dos catas. */
const ATRIBUTOS_TAZA = [
  ["fragancia", "Fragancia", "Fragrance", "El olor del café recién molido, antes del agua.", "The smell of freshly ground coffee, before the water."],
  ["aroma", "Aroma", "Aroma", "El olor cuando le cae el agua caliente.", "The smell once the hot water hits it."],
  ["sabor", "Sabor", "Flavor", "Lo que se siente al probarlo: gusto y aroma juntos.", "What you get when you taste it: taste and aroma together."],
  ["residual", "Residual", "Aftertaste", "Lo que queda en la boca después de tragar.", "What stays in your mouth after you swallow."],
  ["acidez", "Acidez", "Acidity", "La viveza de la taza, como la de una fruta.", "The brightness of the cup, like that of a fruit."],
  ["dulzor", "Dulzor", "Sweetness", "El dulce natural del café, sin azúcar.", "The coffee's natural sweetness, with no sugar."],
  ["boca", "Boca", "Mouthfeel", "El cuerpo y la textura sobre la lengua.", "The body and texture on the tongue."],
  ["global", "Global", "Overall", "La impresión general del catador.", "The cupper's overall impression."],
];
const seriesTaza = (p) => (p.taza.de ? p.taza.de.map(prodById) : [p]).map((q) => ({ n: tx(q.nombre), c: q.color, T: q.taza }));
function ruedaTaza(p, en) {
  const cx = 180, cy = 140, R = 92, n = ATRIBUTOS_TAZA.length, S2 = seriesTaza(p);
  const punto = (i, r) => { const a = (-90 + (i * 360) / n) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const radio = (v) => (R * (v - 1)) / 8;
  const linea = (f) => ATRIBUTOS_TAZA.map((_, i) => punto(i, f(i)).map((x) => x.toFixed(1)).join(",")).join(" ");
  const atributos = ATRIBUTOS_TAZA.map(([k, es, ing, de, dn], i) => {
    const [ex, ey] = punto(i, R), [x, y] = punto(i, R + 14), lado = Math.abs(x - cx) < 4 ? "middle" : x > cx ? "start" : "end";
    const alto = i === 0 ? y - 15 : i === 4 ? y + 7 : y - 2;
    const vals = S2.map((s) => s.T[k]), lo = Math.min(...vals), hi = Math.max(...vals), nombre = en ? ing : es;
    const dicho = S2.length > 1 ? S2.map((s) => `${s.n} ${s.T[k]}`).join(" · ") : (en ? `${lo} of 9` : `${lo} de 9`);
    return `<g class="tz-at" style="--i:${i}" tabindex="0" role="button" aria-label="${esc(`${nombre}: ${dicho}`)}" data-l="${esc(nombre)}" data-v="${esc(dicho)}" data-d="${esc(en ? dn : de)}">
      <line class="tz-eje" x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/>
      <circle class="tz-toque" cx="${x.toFixed(1)}" cy="${alto.toFixed(1)}" r="24"/>
      <text class="tz-k" x="${x.toFixed(1)}" y="${alto.toFixed(1)}" text-anchor="${lado}">${nombre}</text>
      <text class="tz-v" x="${x.toFixed(1)}" y="${(alto + 15).toFixed(1)}" text-anchor="${lado}">${lo === hi ? lo : `${lo}–${hi}`}</text></g>`;
  }).join("");
  return `<svg class="tz-rueda" viewBox="0 0 360 282" role="group" aria-label="${en ? "Cupping wheel" : "Rueda de la catación"}">
    ${[3, 5, 7, 9].map((v) => `<polygon class="tz-aro" points="${linea(() => radio(v))}"/>`).join("")}
    ${atributos}
    ${S2.map((s, m) => `<g class="tz-capa" style="--c:${s.c};--m:${m};transform-origin:${cx}px ${cy}px">
      <polygon class="tz-forma" points="${linea((i) => radio(s.T[ATRIBUTOS_TAZA[i][0]]))}"/>
      ${ATRIBUTOS_TAZA.map(([k], i) => { const [x, y] = punto(i, radio(s.T[k])); return `<circle class="tz-punto" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/>`; }).join("")}</g>`).join("")}
  </svg>`;
}
function bloqueTaza(p, en) {
  const T = p.taza;
  if (!T) return "";
  const S2 = seriesTaza(p);
  return `<section class="prod-taza">
      <div class="section-head"><p class="eyebrow">${en ? "The cup" : "La taza"}</p>
        <h2>${en ? "What the <em>cupper found</em>" : "Lo que encontró <em>el catador</em>"}</h2></div>
      <div class="tz g-io">
        <div class="tz-graf">${ruedaTaza(p, en)}
          ${S2.length > 1 ? `<ul class="tz-leyenda">${S2.map((s) => `<li style="--c:${s.c}">${esc(s.n)}</li>`).join("")}</ul>` : ""}</div>
        <div class="tz-dato">
          <p class="tz-total"><b>${esc(p.puntaje)}</b><small>${en ? "SCA points" : "Puntos SCA"}${T.de ? `<br>${en ? "both cuppings combined" : "unión de las dos catas"}` : ""}</small></p>
          <p class="tz-lee" aria-live="polite"><b>${en ? "Tap an attribute" : "Toca un atributo"}</b><span>${en ? "Each one is scored from 1 to 9; the total comes out of the SCA formula, it is not the sum." : "Cada uno va de 1 a 9; el total sale de la fórmula de la SCA, no es la suma."}</span></p>
          <dl>
            <div><dt>${en ? "Notes" : "Notas"}</dt><dd>${esc(tx(p.notas).join(", "))}</dd></div>
            ${T.datos.map(([k, v]) => `<div><dt>${esc(tx(k))}</dt><dd>${esc(tx(v))}</dd></div>`).join("")}
            <div><dt>${en ? "Cupped" : "Catado"}</dt><dd>${fmtFecha(T.fecha)}</dd></div>
          </dl>
        </div>
      </div>
    </section>`;
}
/* Tocar, señalar o llegar con el teclado a un atributo cuenta qué es. */
function leerTaza(e) {
  const a = e.target.closest?.(".tz-at");
  if (!a) return;
  const z = a.closest(".tz"), o = z.querySelector(".tz-lee");
  z.querySelectorAll(".tz-at.on").forEach((x) => x.classList.remove("on"));
  a.classList.add("on");
  o.innerHTML = `<b>${esc(a.dataset.l)} · ${esc(a.dataset.v)}</b><span>${esc(a.dataset.d)}</span>`;
}
if (typeof document !== "undefined" && document.addEventListener) ["pointerover", "focusin", "click"].forEach((t) => document.addEventListener(t, leerTaza));

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
  const pronto = !!p.proximamente, pre = enPreventa(p);
  const compra = pronto ? `
      <div class="pronto-aviso">
        <b>${t("proximamente")}</b>
        <p>${en ? "The data sheet and the price are still to be confirmed. Leave your email and we tell you the day it is out."
                : "La ficha y el precio están por confirmar. Deja tu correo y te avisamos el día que salga."}</p>
        <button class="btn primary" data-act="espera" data-id="${p.id}">${t("avisame")}</button>
      </div>
      <p class="sale"><span class="sale-tag">${esc(tx(saleDe(p, v)))}</span> <span>${esc(tx(saleNotaDe(p, v)))}</span></p>` : `
      <div class="vars" role="radiogroup" aria-label="${en ? "Size" : "Presentación"}">
        ${p.variantes.map((x) => `<button class="var ${x.g === v.g ? "on" : ""}" role="radio" aria-checked="${x.g === v.g}" data-act="var" data-p="${p.id}" data-g="${x.g}"
          aria-label="${esc(`${gramos(x.g)} · ${tx(x.label)} · ${cop(precioHoy(p, x))}${x.stock || pre ? "" : " · " + t("agotado")}`)}" ${x.stock || pre ? "" : "disabled"}>
          <b>${gramos(x.g)}</b><span>${esc(tx(x.label))}</span><small>${x.stock ? esc(tx(x.nota)) : (pre ? t("en_preventa") : t("agotado"))}</small>
          <span class="mono precio">${cop(x.precio)}</span></button>`).join("")}
      </div>

      <p class="sale"><span class="sale-tag">${esc(tx(saleDe(p, v)))}</span> <span>${esc(tx(saleNotaDe(p, v)))}${sinMolino}</span></p>

      <div class="buy-row">
        <div><b class="precio-grande mono">${cop(precioHoy(p, v))}</b><small>${gramos(v.g)} · ${cop((precioHoy(p, v) / v.g) * 1000)} ${t("por_kg")}</small></div>
        <button class="btn primary lg" data-act="add" data-p="${p.id}" data-g="${v.g}" ${topeDe(p, v) ? "" : "disabled"}>${pre ? t("reservar") : t("agregar")}</button>
      </div>
      ${pre ? `<p class="pre-aviso"><b>${en ? `Ships ${fmtFecha(entregaPreventa())}` : `Sale el ${fmtFecha(entregaPreventa())}`}</b>${CONFIG.preventa.cupo
        ? `<span>${en ? `${quedanPreventa(v)} of ${CONFIG.preventa.cupo} bags left` : `quedan ${quedanPreventa(v)} de ${CONFIG.preventa.cupo} bolsas`}</span>
           <i style="--q:${Math.round((quedanPreventa(v) / CONFIG.preventa.cupo) * 100)}%" aria-hidden="true"></i>` : ""}</p>` : ""}
      <p class="hint">${pre
        ? (en ? "Pre-order: you pay today and we ship it in the order reservations arrive" : "Preventa: pagas hoy y despachamos en el orden en que llegaron las reservas")
        : `${v.stock} ${t("disponibles")}`} · ${en
        ? `ships from Cúcuta within Colombia in ${tx(E.dias)} · ${cop(E.costo)}, free from ${cop(E.gratisDesde)}`
        : `sale de Cúcuta y llega en ${tx(E.dias)} · envío ${cop(E.costo)}, gratis desde ${cop(E.gratisDesde)}`}</p>`;
  return `<article class="prod" style="--pc:${p.color || "#2F5A3C"}">
    <div class="prod-top">
    <div class="prod-buy reveal">
      <p class="eyebrow">${esc([conocido(f.productor) && tr(f.productor), conocido(f.finca) && tr(f.finca), f.municipio && !String(f.finca || "").includes(f.municipio) && f.municipio].filter(Boolean).join(" · ") || t("nav_cafes_esp"))}</p>
      <h1>${esc(tx(p.nombre))}</h1>
      <p class="lede">${esc(historiaPublica(f) || (f.municipio
        ? (en ? `${esMolido(p) ? "Ground" : "Whole bean"} coffee from ${f.municipio}, Norte de Santander${p.altitud ? `, grown at ${msnm(p.altitud)}` : ""}${f.mezcla ? `. Varieties: ${tr(p.variedad)}` : ""}.`
              : `Café ${esMolido(p) ? "molido" : "en grano"} de ${f.municipio}, Norte de Santander${p.altitud ? `, cultivado a ${msnm(p.altitud)}` : ""}${f.mezcla ? `. Variedades: ${tr(p.variedad)}` : ""}.`)
        : (en ? "Whole bean coffee from Norte de Santander." : "Café en grano de Norte de Santander.")))}</p>
      ${compra}
    </div>

    <div class="prod-art reveal" style="--i:1">
      <div class="prod-escena${CON_FOTO.has(p.id) ? " con-foto" : ""}">
        ${pronto ? `<span class="g-pronto">${t("proximamente")}<i>${esc(tx(p.sub))}</i></span>` : ""}
        ${!pronto || CON_FOTO.has(p.id) ? fotoProducto(p, { sizes: "(min-width:900px) 560px, 90vw", prioridad: true }) : ""}
        ${pronto || !p.puntaje ? "" : `<p class="prod-sello"><b>${esc(p.puntaje)}</b><small>SCA</small></p>`}
      </div>
      <ul class="notas-chips">${tx(p.notas).map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    </div>
    </div>

    ${bloqueTaza(p, en)}

    <section class="prod-ficha reveal" style="--i:2">
      <div class="section-head"><p class="eyebrow">${t("ficha")}</p>
        <h2>${en ? "Every number says <em>who checked it</em>" : "Cada dato dice <em>quién lo comprobó</em>"}</h2></div>
      <table class="ficha-tabla">
        <thead><tr><th scope="col">${en ? "Data" : "Dato"}</th><th scope="col">${en ? "Value" : "Valor"}</th><th scope="col">${en ? "Level" : "Nivel"}</th><th scope="col">${en ? "Who checked it" : "Quién lo comprobó"}</th></tr></thead>
        <tbody>
        ${attr(en ? "Variety" : "Variedad", fi.variedad)}${attr(en ? "Altitude" : "Altitud", fi.altitud, msnm)}
        ${attr(en ? "Process" : "Proceso", fi.proceso)}${attr(en ? "Roasted" : "Tostión", fi.tostion, fmtFecha)}${attr(en ? "SCA score" : "Puntaje SCA", fi.puntaje, (x) => x)}
        </tbody>
      </table>
      <dl class="leyenda">${Object.values(LV).map((o) => `<div style="--c:${o.c}"><dt><i></i>${tx(o.label)}</dt><dd>${tx(o.desc)}</dd></div>`).join("")}</dl>
    </section>

    ${(() => {
      /* Quién lo cultiva: solo la finca de este café (las dos, en el blend), como
         complemento de la ficha. En la tienda, con los tres cafés, sobraba. */
      const fs = (p.mezcla || [p.fincaId]).map((id) => S.fincas.find((x) => x.id === id)).filter(Boolean);
      return fs.length ? `<section class="prod-fincas reveal" style="--i:3">
      <div class="section-head"><p class="eyebrow">${en ? "The farm" : "La finca"}</p>
        <h2>${en ? "Who <em>grows it</em>" : "Quién <em>lo cultiva</em>"}</h2></div>
      <div class="fincas n${fs.length}">${fs.map((x, i) => fincaCard(x, i, { enFicha: true })).join("")}</div>
    </section>` : "";
    })()}

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
function guardarCarrito() { try { localStorage.setItem(CART_KEY, JSON.stringify(UI.carrito)); } catch {} bitacoraCarrito(); }

/* El stock de verdad vive en la hoja; el navegador solo lo copia. Sin hoja
   conectada, la tienda sigue con los números del catálogo, como siempre. */
function cargarStock() {
  if (!CONFIG.registro) return Promise.resolve(false);
  return fetch(`${CONFIG.registro}?accion=stock`).then((r) => r.json()).catch(() => ({ ok: false }))
    .then((j) => {
      /* de paso, la hoja dice si ya recibe la bitácora de la página (medir.js) */
      medicionPropia(!!(j && j.ok && j.actividad === true));
      if (!j || !j.ok || !j.stock) return false;
      let cambio = false;
      S.productos.forEach((p) => {
        p.variantes.forEach((v) => {
          /* en preventa la hoja cuenta aparte lo que queda del cupo */
          const q = j.stock[`${p.id}-${v.g}-pre`];
          if (q != null && q !== v.cupoQueda) { v.cupoQueda = q; cambio = true; }
          const n = j.stock[`${p.id}-${v.g}`];
          if (n == null || n === v.stock) return;
          v.stock = n; cambio = true;
        });
        p.stock = principal(p).stock;
      });
      if (cambio) { podarCarrito(); save(); render(); renderNav(); renderTray(); if ($("#cart")?.open) renderCarrito(); }
      return cambio;
    });
}
/* Si la hoja dice que queda menos, el carrito se ajusta solo antes de pagar */
function podarCarrito() {
  if (!UI.carrito.length) return;
  const antes = JSON.stringify(UI.carrito);
  UI.carrito = UI.carrito.filter((i) => {
    const p = prodById(i.id), v = p && p.variantes.find((x) => x.g === i.g);
    const tope = v ? topeDe(p, v) : 0;
    if (!tope) return false;
    i.n = Math.min(i.n, tope);
    return true;
  });
  if (JSON.stringify(UI.carrito) === antes) return;
  guardarCarrito();
  toast(UI.lang === "en" ? "We updated your order: there is less left than we thought."
                         : "Ajustamos tu pedido: queda menos de lo que teníamos contado.", { type: "err" });
}
function cargarCarrito() {
  try {
    const v = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(v)) return;
    /* El precio se vuelve a leer del producto: un carrito guardado antes de un
       cambio de precio cobraría el viejo. La presentación que ya no existe se cae.
       El nombre no se toca: esto corre antes de que la URL fije el idioma. */
    UI.carrito = v.flatMap((i) => {
      const p = prodById(i.id), x = p && p.variantes.find((y) => y.g === i.g && y.stock > 0);
      return x ? [{ ...i, precio: x.precio }] : [];
    });
  } catch {}
}
/* El bono: llega en el enlace del correo de bienvenida (?bono=GANG-XXXXX) o se escribe en el carrito.
   Lo valida el script de la hoja; aquí solo se recuerda en el navegador hasta que se usa. */
const BONO_KEY = "nandez-bono";
function cargarBono() {
  try { const b = JSON.parse(localStorage.getItem(BONO_KEY)); if (b && b.codigo && b.pct) UI.bono = b; } catch {}
  const enlace = new URLSearchParams(location.search).get("bono");
  if (!enlace) return;
  history.replaceState(history.state, "", location.pathname + location.hash);
  validarBono(enlace, true);
}
function validarBono(codigo, desdeEnlace) {
  const en = UI.lang === "en", c = String(codigo || "").trim().toUpperCase();
  if (!c) return;
  if (!CONFIG.registro) return toast(en ? "Codes are not available yet." : "Los bonos todavía no están disponibles.", { type: "err" });
  UI.bonoCargando = true; renderCarrito();
  fetch(`${CONFIG.registro}?accion=bono&codigo=${encodeURIComponent(c)}`).then((r) => r.json()).catch(() => ({ ok: false, error: "red" }))
    .then((j) => {
      UI.bonoCargando = false;
      if (j.ok) {
        UI.bono = { codigo: j.codigo, pct: j.pct };
        try { localStorage.setItem(BONO_KEY, JSON.stringify(UI.bono)); } catch {}
        toast(en ? `Code ${j.codigo} applied: ${j.pct} % off this order.` : `Bono ${j.codigo} aplicado: ${j.pct} % menos en este pedido.`);
      } else {
        quitarBono(false);
        toast({ usado: en ? "That code was already used." : "Ese bono ya se usó.", vencido: en ? "That code has expired." : "Ese bono ya venció.",
          red: en ? "Could not check the code. Try again." : "No se pudo revisar el bono. Intenta otra vez." }[j.error]
          || (en ? "That code does not exist." : "Ese código no existe."), { type: "err" });
      }
      renderCarrito(); renderTray();
      if (j.ok && desdeEnlace && UI.carrito.length) abrirCarrito();
    });
}
function quitarBono(pintar = true) { UI.bono = null; try { localStorage.removeItem(BONO_KEY); } catch {} if (pintar) renderCarrito(); }

function addCarrito(pid, g) {
  const p = prodById(pid), v = p.variantes.find((x) => x.g === +g), c = enCarrito(p.id, v.g);
  const tope = topeDe(p, v);
  if (c) { if (c.n < tope) c.n++; else return toast(UI.lang === "en" ? "No more of that size." : "No queda más de esa presentación.", { type: "err" }); }
  else UI.carrito.push({ id: p.id, g: v.g, n: 1, precio: precioHoy(p, v), nombre: `${tx(p.nombre)} ${gramos(v.g)}` });
  medir("agregar", { nombre: tx(p.nombre), ids: [p.id], valor: precioHoy(p, v), n: 1 });
  guardarCarrito(); render(); abrirCarrito(); irAlPago();
}
/* Con los datos completos (los de la última compra), el carrito abre en el pago */
function irAlPago() {
  const llenos = ["pd-nombre", "pd-documento", "pd-tel", "pd-direccion", "pd-ciudad", "pd-depto", "pd-correo"].every((k) => $("#" + k)?.value.trim());
  /* un temporizador y no requestAnimationFrame: este último no corre si la pestaña no se pinta */
  if (llenos) setTimeout(() => $("#cart-body .pay")?.scrollIntoView({ block: "start" }), 60);
}

function renderTray() {
  const el = $("#tray");
  if (!UI.carrito.length || $("#cart")?.open) { el.hidden = true; return popPiso(); }
  el.hidden = false;
  const n = unidadesCarrito();
  el.innerHTML = `<span>${n} ${n === 1 ? (UI.lang === "en" ? "bag" : "bolsa") : (UI.lang === "en" ? "bags" : "bolsas")} · <b class="mono">${cop(totalCarrito())}</b></span>
    <button class="btn sm primary" data-act="carrito">${UI.lang === "en" ? "View order" : "Ver el pedido"}</button>`;
  /* la bandeja acaba de cambiar de tamaño: el pop-up del bono se reacomoda encima */
  popPiso();
}

function abrirCarrito() {
  const d = $("#cart"); if (!d) return;
  cargarStock();   /* al abrir el carrito se vuelve a preguntar: es el momento que importa */
  renderCarrito();
  if (!d.open) d.showModal();
  renderTray();
}
function cerrarCarrito() { const d = $("#cart"); if (d?.open) d.close(); renderTray(); }

/* El link personal de Mercado Pago abre la caja vacía: el cliente escribe el monto */
const mpEscribeMonto = () => /link\.mercadopago\./.test(CONFIG.pagos.mercadoPago);
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* La pasarela está lista cuando hay llave pública; sin ella el carrito sigue como antes */
const pasarelaLista = () => CONFIG.pagos.pasarela === "wompi" && /^pub_(test|prod)_/.test(CONFIG.pagos.wompi?.llavePublica || "");
/* Mercado Pago con total del servidor (api/checkout.js): se prende con pasarela: "mercadopago",
   cuando MP_ACCESS_TOKEN ya está en Vercel. Si el servidor no responde, el carrito ofrece el pago manual. */
const mpLista = () => CONFIG.pagos.pasarela === "mercadopago";
const tarjetaLista = () => mpLista() && /^(APP_USR|TEST)-/.test(CONFIG.pagos.mp?.llavePublica || "");
const pagoEnLinea = () => pasarelaLista() || mpLista();
const pasarelaNombre = () => (pasarelaLista() ? "Wompi" : "Mercado Pago");

/* Formas de pago que la tienda puede ofrecer hoy; la primera queda marcada */
function metodosPago() {
  const en = UI.lang === "en", ops = [];
  /* Con Wompi listo, el link de Mercado Pago sobra: pedirle a la persona que
     escriba el monto es justo el paso donde se caen las ventas. */
  if (pasarelaLista()) ops.push({
    id: "wompi", nom: en ? "Card, PSE or Nequi" : "Tarjeta, PSE o Nequi",
    sub: en ? "You pay right here, without leaving the page." : "Pagas aquí mismo, sin salir de la página.",
    marcas: ["Visa", "Mastercard", "PSE", "Nequi", "Bancolombia"],
    det: en ? "Wompi's secure checkout (Bancolombia group) opens over this page. Your card never goes through our servers."
            : "Se abre el pago seguro de Wompi (Grupo Bancolombia) encima de esta página. Tu tarjeta no pasa por nuestros servidores.",
  });
  else if (mpLista()) {
    /* Con la llave pública, la tarjeta se paga aquí mismo; PSE y Nequi siguen por
       Mercado Pago, que de todos modos manda al banco. Sin llave, todo va por allá. */
    if (tarjetaLista()) ops.push({
      id: "tarjeta", nom: en ? "Credit or debit card" : "Tarjeta de crédito o débito",
      sub: en ? "You pay right here, without leaving the page." : "Pagas aquí mismo, sin salir de la página.",
      marcas: ["Visa", "Mastercard", "Amex", "Diners"], tarjeta: true,
      det: en ? "Secure fields by Mercado Pago: your card never goes through our servers."
              : "Campos seguros de Mercado Pago: tu tarjeta no pasa por nuestros servidores.",
    });
    ops.push({
      id: "mp", nom: tarjetaLista() ? (en ? "PSE, Nequi or Mercado Pago account" : "PSE, Nequi o cuenta de Mercado Pago")
        : (en ? "Card, PSE or Nequi" : "Tarjeta, PSE o Nequi"),
      sub: en ? "Secure payment with Mercado Pago." : "Pago seguro con Mercado Pago.",
      marcas: tarjetaLista() ? ["PSE", "Nequi"] : ["Visa", "Mastercard", "PSE", "Nequi"],
      det: en ? "We take you to Mercado Pago to pay and bring you back here. Your card never goes through our servers."
              : "Te llevamos a Mercado Pago para pagar y te traemos de vuelta. Tu tarjeta no pasa por nuestros servidores.",
    });
  }
  else if (CONFIG.pagos.mercadoPago) ops.push({
    id: "mp", nom: "Mercado Pago",
    sub: en ? "Card, PSE, Nequi or cash." : "Tarjeta, PSE, Nequi o efectivo.",
    marcas: ["Visa", "Mastercard", "PSE", "Nequi"],
    det: mpEscribeMonto()
      ? (en ? "We open Mercado Pago and you type the total you see here, with your order number."
            : "Te abrimos Mercado Pago y escribes el total que ves aquí, con tu número de pedido.")
      : (en ? "You finish the payment on Mercado Pago and come back here."
            : "Terminas el pago en Mercado Pago y vuelves acá."),
  });
  ops.push({
    id: "manual", nom: mayus(tx(CONFIG.pagos.manual)),
    sub: en ? "You pay once we confirm the order." : "Pagas cuando te confirmamos el pedido.",
    marcas: en ? ["Transfer", "Nequi"] : ["Transferencia", "Nequi"],
    det: CONFIG.registro
      ? (en ? `The order reaches us, we write to you with the total and you pay by ${tx(CONFIG.pagos.manual)}.`
            : `Nos llega el pedido, te escribimos con el total y pagas por ${tx(CONFIG.pagos.manual)}.`)
      : (en ? `You send us the order by ${canalContacto()} and we reply with how to pay.`
            : `Nos envías el pedido por ${canalContacto()} y te respondemos cómo pagar.`),
  });
  return ops;
}
const pagoSel = () => { const ops = metodosPago(); return ops.some((o) => o.id === UI.pago) ? UI.pago : ops[0].id; };

/* Método de envío y método de pago, en bloques como los de un checkout */
function bloquePago(envio, E) {
  const en = UI.lang === "en", sel = pagoSel();
  const marcas = (xs) => `<span class="pay-marcas">${xs.map((m) => `<i>${esc(m)}</i>`).join("")}</span>`;
  return `
    <section class="pay">
      <h4 class="pay-t">${t("pago_envio")}</h4>
      <div class="pay-ops"><div class="pay-op fijo sel">
        <span class="pay-rd"></span>
        <span class="pay-nom">${esc(E.transportadora)} · ${en ? "Nationwide shipping" : "Envío nacional"}<small>${tx(E.dias)}</small></span>
        <b class="mono">${envio ? cop(envio) : en ? "Free" : "Gratis"}</b>
      </div></div>

      <h4 class="pay-t">${t("pago_titulo")}</h4>
      <p class="pay-sub">${t("pago_seguro")}</p>
      <div class="pay-ops" role="radiogroup" aria-label="${t("pago_titulo")}">
        ${metodosPago().map((o) => `
          <button type="button" class="pay-op${o.id === sel ? " sel" : ""}" data-pago="${o.id}" role="radio" aria-checked="${o.id === sel}">
            <span class="pay-rd"></span>
            <span class="pay-nom">${esc(o.nom)}<small>${esc(o.sub)}</small></span>
            ${marcas(o.marcas)}
          </button>
          ${o.id !== sel ? "" : o.tarjeta
            ? `<div class="pay-det pay-tarjeta"><p>${esc(o.det)}</p><div id="mp-tarjeta" aria-live="polite"><p class="hint">${en ? "Loading the card form…" : "Cargando los campos de la tarjeta…"}</p></div></div>`
            : `<p class="pay-det">${esc(o.det)}</p>`}`).join("")}
      </div>
    </section>`;
}

function renderCarrito() {
  const en = UI.lang === "en", cuerpo = $("#cart-body"); if (!cuerpo) return;
  if (!UI.carrito.length) {
    cuerpo.innerHTML = `<div class="cart-vacio">
      <p>${en ? "Nothing here yet." : "Todavía no hay nada."}</p>
      <button class="btn primary" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button></div>`;
    $("#cart-foot").innerHTML = "";
    return;
  }
  const E = CONFIG.envio, envio = envioDe(totalCarrito()), falta = E.gratisDesde - totalCarrito(), desc = descuentoCarrito();
  /* lo que ya escribió la persona sobrevive a que el carrito se vuelva a pintar; la
     primera vez que se pinta, se llena con lo de su última compra (si la hubo) */
  const primera = !$("#pd-nombre"), guardado = recordado.campos();
  const escrito = Object.fromEntries(["pd-nombre", "pd-documento", "pd-tel", "pd-direccion", "pd-detalle",
    "pd-ciudad", "pd-depto", "pd-correo", "pd-bono"].map((k) => [k, $("#" + k)?.value || (primera && guardado[k]) || ""]));
  const val = (k) => (escrito[k] ? ` value="${esc(escrito[k])}"` : "");
  cuerpo.innerHTML = `
    <ul class="cart-items">${UI.carrito.map((i) => {
      const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
      return `<li class="cart-item">
        <div class="cart-art">${CON_FOTO.has(p.id) ? fotoProducto(p, { sizes: "72px", clase: "" }) : ridge(p, { w: 120, h: 90, label: false })}</div>
        <div class="cart-txt"><b>${esc(tx(p.nombre))}</b><small>${gramos(i.g)} · ${esc(tx(saleDe(p, v))).toLowerCase()}${enPreventa(p) ? " · " + esc(rotuloPreventa(en)) : ""}</small>
          <div class="cart-qty">
            <button class="btn sm" data-act="qty" data-p="${i.id}" data-g="${i.g}" data-d="-1" aria-label="${en ? "Remove one" : "Quitar uno"}">−</button>
            <span class="mono">${i.n}</span>
            <button class="btn sm" data-act="qty" data-p="${i.id}" data-g="${i.g}" data-d="1" aria-label="${en ? "Add one" : "Agregar uno"}" ${i.n >= topeDe(p, v) ? "disabled" : ""}>+</button>
            <button class="cart-del" data-act="quitar" data-p="${i.id}" data-g="${i.g}">${en ? "Remove" : "Quitar"}</button>
          </div></div>
        <b class="mono cart-precio">${cop(i.precio * i.n)}</b></li>`;
    }).join("")}</ul>

    <div class="cart-sumas">
      <div><span>Subtotal</span><b class="mono">${cop(totalCarrito())}</b></div>
      ${desc ? `<div class="cart-bono-linea"><span>${en ? "Code" : "Bono"} ${esc(UI.bono.codigo)} · −${UI.bono.pct} %
        <button class="cart-del" data-act="bono-quitar">${en ? "Remove" : "Quitar"}</button></span><b class="mono">−${cop(desc)}</b></div>` : ""}
      <div><span>${en ? "Shipping" : "Envío"}</span><b class="mono">${envio ? cop(envio) : (en ? "Free" : "Gratis")}</b></div>
      <div class="cart-total"><span>${t("total")}</span><b class="mono">${cop(totalCarrito() - desc + envio)}</b></div>
      ${CONFIG.iva ? `<p class="cart-iva">${en ? `Includes ${cop(ivaDe(totalCarrito() - desc))} of VAT (${CONFIG.iva} %)`
        : `Incluye ${cop(ivaDe(totalCarrito() - desc))} de IVA (${CONFIG.iva} %)`}</p>` : ""}
      <p class="hint">${envio
        ? (en ? `Add ${cop(falta)} more and shipping is free. ` : `Te faltan ${cop(falta)} para el envío gratis. `)
        : ""}${UI.carrito.some((i) => enPreventa(prodById(i.id)))
        ? (en ? `Pre-order: the whole order ships together on ${fmtFecha(entregaPreventa())} by ${esc(E.transportadora)}, and arrives ${tx(E.dias)} later.`
              : `Preventa: el pedido completo sale junto el ${fmtFecha(entregaPreventa())} por ${esc(E.transportadora)} y llega ${tx(E.dias)} después.`)
        : `${en ? "Arrives in " : "Llega en "}${tx(E.dias)} ${en ? "with " : "por "}${esc(E.transportadora)}${en ? ", anywhere in Colombia." : ", a cualquier ciudad de Colombia."}`}</p>
    </div>

    <div class="form-grid cart-form">
      ${guardado["pd-nombre"] ? `<p class="hint cart-recordado" style="grid-column:1/-1">${en ? "We used the details from your last order." : "Usamos los datos de tu última compra."}
        <button class="cart-del" data-act="olvidar-datos">${en ? "Forget my details" : "Olvidar mis datos"}</button></p>` : ""}
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="pd-nombre">${en ? "Full name" : "Nombre y apellidos"}</label><input id="pd-nombre" class="input" autocomplete="name" autocapitalize="words" enterkeyhint="next"${val("pd-nombre")}></div>
      <div class="field"><label class="lbl" for="pd-documento">${en ? "ID or tax number" : "Cédula o NIT"}</label><input id="pd-documento" class="input mono" inputmode="numeric" autocomplete="off" enterkeyhint="next"${val("pd-documento")}></div>
      <div class="field"><label class="lbl" for="pd-tel">${en ? "Phone (the courier calls it)" : "Teléfono (al que llama el mensajero)"}</label><input id="pd-tel" class="input" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="next" placeholder="300 000 0000"${val("pd-tel")}></div>
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="pd-direccion">${en ? "Address" : "Dirección"}</label><input id="pd-direccion" class="input" autocomplete="street-address" enterkeyhint="next" placeholder="${en ? "Calle 10 # 5-23" : "Calle 10 # 5-23"}"${val("pd-direccion")}></div>
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="pd-detalle">${en ? "Neighbourhood, apartment or directions (optional)" : "Barrio, apartamento o indicaciones (opcional)"}</label><input id="pd-detalle" class="input" autocomplete="address-line2" enterkeyhint="next"${val("pd-detalle")}></div>
      <div class="field"><label class="lbl" for="pd-ciudad">${en ? "City" : "Ciudad"}</label><input id="pd-ciudad" class="input" list="ciudades-co" autocomplete="address-level2" enterkeyhint="next"${val("pd-ciudad")}>
        <datalist id="ciudades-co">${CIUDADES.filter(([c], i, a) => a.findIndex(([x]) => x === c) === i).map(([c]) => `<option value="${esc(c)}">${esc(deptoDe(c) || (en ? "several departments" : "varios departamentos"))}</option>`).join("")}</datalist></div>
      <div class="field"><label class="lbl" for="pd-depto">${en ? "Department" : "Departamento"}</label>
        <select id="pd-depto" class="input" autocomplete="address-level1">
          <option value="">${en ? "Choose" : "Escoge"}</option>
          ${DEPARTAMENTOS.map((x) => `<option${x === escrito["pd-depto"] ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="pd-correo">${en ? "Email (for the tracking number)" : "Correo (para mandarte la guía)"}</label><input id="pd-correo" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" enterkeyhint="done"${val("pd-correo")}></div>
      ${CONFIG.registro && !UI.bono ? `<div class="field cart-bono" style="grid-column:1/-1"><label class="lbl" for="pd-bono">${en ? "Welcome code" : "Código de bono"}</label>
        <div class="co-fila"><input id="pd-bono" class="input mono" autocapitalize="characters" autocomplete="off" placeholder="GANG-XXXXX"${val("pd-bono")}>
          <button class="btn" data-act="bono-aplicar" ${UI.bonoCargando ? "disabled" : ""}>${UI.bonoCargando ? "…" : en ? "Apply" : "Aplicar"}</button></div></div>` : ""}
    </div>

    ${bloquePago(envio, E)}`;
  const pie = $("#cart-foot"), sel = pagoSel();
  pie.innerHTML = `
    <button class="btn primary" data-act="${{ mp: "pedido-mp", wompi: "pedido-wompi", tarjeta: "pedido-tarjeta" }[sel] || "pedido-wa"}" ${UI.pagando ? "disabled" : ""}>${
      UI.pagando ? (en ? "Opening the payment…" : "Abriendo el pago…")
      : sel === "mp" || sel === "wompi" || sel === "tarjeta" ? `${t("pagar_ahora")} · ${cop(totalCarrito() - desc + envio)}`
      : CONFIG.registro ? (en ? "Place the order" : "Hacer el pedido")
      : en ? `Send order by ${canalContacto()}` : `Enviar pedido por ${canalContacto()}`}</button>
    ${sel === "mp" || sel === "wompi" || sel === "tarjeta" ? "" : `<p class="hint">${en ? `No payment yet: we confirm the order and you pay by ${tx(CONFIG.pagos.manual)}.`
      : `Todavía no pagas: te confirmamos el pedido y pagas por ${tx(CONFIG.pagos.manual)}.`}</p>`}`;
  /* los campos de la tarjeta se montan cada vez que el carrito se repinta: el monto cambió */
  if (sel === "tarjeta") setTimeout(montarTarjeta);
}

/* ---------- la tarjeta dentro de la página (Checkout Bricks de Mercado Pago) ----------
   Los campos los pinta Mercado Pago, cada uno en su propio recuadro seguro, y lo que
   sale de ahí es un token de un solo uso: la tarjeta nunca pasa por nuestros
   servidores. El botón es el mismo «Pagar ahora» del carrito (el del formulario va
   escondido). api/tarjeta.js cobra con el total del servidor, no con el de aquí. */
let sdkMP = null, ladrillo = null;
function cargarSdkMP() {
  if (window.MercadoPago) return Promise.resolve();
  return (sdkMP ||= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = CONFIG.pagos.mp.sdk; s.async = true;
    s.onload = () => (window.MercadoPago ? ok() : mal(new Error("sdk")));
    s.onerror = () => { sdkMP = null; mal(new Error("sdk")); };
    document.head.append(s);
  }));
}
async function montarTarjeta() {
  const en = UI.lang === "en", caja = $("#mp-tarjeta");
  if (!caja || caja.dataset.montado) return;
  caja.dataset.montado = "1";
  try { await cargarSdkMP(); }
  catch { caja.innerHTML = `<p class="hint err">${en ? "The card form did not load. Pay with PSE or Nequi, or try again." : "No cargaron los campos de la tarjeta. Paga con PSE o Nequi, o intenta otra vez."}</p>`; return; }
  /* el carrito pudo repintarse mientras cargaba: esta caja ya no existe */
  if (!document.body.contains(caja)) return;
  try { await ladrillo?.unmount?.(); } catch {}
  caja.innerHTML = "";
  const total = totalCarrito() - descuentoCarrito() + envioDe(totalCarrito());
  try {
    const mp = new window.MercadoPago(CONFIG.pagos.mp.llavePublica, { locale: en ? "en-US" : "es-CO" });
    ladrillo = await mp.bricks().create("cardPayment", "mp-tarjeta", {
      initialization: { amount: total, payer: { email: $("#pd-correo")?.value.trim() || undefined } },
      /* una sola cuota, como en Mercado Pago; el botón propio va escondido */
      customization: { visual: { hidePaymentButton: true, hideFormTitle: true }, paymentMethods: { maxInstallments: 1 } },
      callbacks: { onReady: () => {}, onSubmit: () => Promise.resolve(), onError: (e) => console.warn("tarjeta", e) },
    });
  } catch {
    caja.innerHTML = `<p class="hint err">${en ? "The card form did not load. Pay with PSE or Nequi, or try again." : "No cargaron los campos de la tarjeta. Paga con PSE o Nequi, o intenta otra vez."}</p>`;
  }
}

/* El botón del pie cambia sin repintar el carrito: repintarlo borraría la tarjeta escrita */
function botonPagando(on) {
  const en = UI.lang === "en", b = $("#cart-foot .btn");
  UI.pagando = on;
  if (!b) return;
  b.disabled = on;
  b.textContent = on ? (en ? "Paying…" : "Pagando…") : `${t("pagar_ahora")} · ${cop(totalCarrito() - descuentoCarrito() + envioDe(totalCarrito()))}`;
}

/* Por qué no pasó, en palabras de cliente (status_detail de Mercado Pago) */
function motivoRechazo(det, en) {
  const m = {
    cc_rejected_insufficient_amount: ["The card has no funds for this amount.", "La tarjeta no tiene cupo para este valor."],
    cc_rejected_bad_filled_security_code: ["Check the security code.", "Revisa el código de seguridad."],
    cc_rejected_bad_filled_date: ["Check the expiration date.", "Revisa la fecha de vencimiento."],
    cc_rejected_bad_filled_card_number: ["Check the card number.", "Revisa el número de la tarjeta."],
    cc_rejected_bad_filled_other: ["Check the card details.", "Revisa los datos de la tarjeta."],
    cc_rejected_call_for_authorize: ["Your bank asks you to authorize this payment: call them, or use another card.", "Tu banco pide que autorices este pago: llámalos o usa otra tarjeta."],
    cc_rejected_card_disabled: ["The card is not active yet. Call your bank, or use another card.", "La tarjeta no está activa. Llama a tu banco o usa otra tarjeta."],
    cc_rejected_duplicated_payment: ["You already made a payment for this amount. Check your email before trying again.", "Ya hiciste un pago por este valor. Revisa tu correo antes de intentar otra vez."],
    cc_rejected_max_attempts: ["Too many attempts with this card. Use another card.", "Demasiados intentos con esta tarjeta. Usa otra."],
  }[det];
  return m ? m[en ? 0 : 1] : (en ? "The bank did not approve the payment. Try another card, or PSE." : "El banco no aprobó el pago. Prueba con otra tarjeta o con PSE.");
}

async function pedidoTarjeta() {
  const en = UI.lang === "en";
  if (UI.pagando) return;
  const d = datosPedido({ correoObligatorio: true }); if (!d) return;
  if (!ladrillo?.getFormData) return toast(en ? "The card form is still loading." : "Los campos de la tarjeta todavía están cargando.", { type: "err" });
  let f = null;
  try { f = await ladrillo.getFormData(); } catch {}
  if (!f || !f.token) return toast(en ? "Check the card details." : "Revisa los datos de la tarjeta.", { type: "err" });
  const visto = totalCarrito() - descuentoCarrito() + envioDe(totalCarrito());
  medir("pagar", { ids: UI.carrito.map((i) => i.id), valor: totalCarrito(), n: unidadesCarrito() });
  botonPagando(true);
  let j;
  try {
    const r = await fetch("/api/tarjeta", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: UI.carrito.map((i) => ({ id: i.id, g: i.g, n: i.n })), bono: UI.bono?.codigo || "",
        comprador: d, idioma: UI.lang, reemplaza: reserva.leer(), total: visto,
        tarjeta: { token: f.token, payment_method_id: f.payment_method_id, issuer_id: f.issuer_id,
          identificacion: f.payer?.identification || null } }) });
    j = await r.json();
  } catch { j = { ok: false, error: "red" }; }
  botonPagando(false);
  if (j && j.reference) reserva.poner(j.reference);
  if (j && j.ok && (j.estado === "aprobado" || j.estado === "pendiente")) {
    registrarPedido(d, "mercadopago", j);
    reserva.poner("");
    return pagoMostrar(j.estado === "aprobado", j, d.correo);
  }
  if (j && j.error === "rechazado") {
    return modal(en ? "The payment did not go through" : "El pago no pasó", `
      <p class="hint">${esc(motivoRechazo(j.detalle, en))} ${en ? "Nothing was charged." : "No se cobró nada."}</p>
      <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Close" : "Cerrar"}</button>
        <button class="btn primary" data-act="pago-otra-tarjeta">${en ? "Try another card" : "Intentar con otra tarjeta"}</button></div>`, "narrow");
  }
  if (j && j.error === "total-cambio") {
    /* El servidor no cobró: los precios cambiaron desde que se abrió la página */
    return modal(en ? "The total changed" : "El total cambió", `
      <p class="hint">${en ? `Prices were updated since you opened the page. Your total is now <b>${cop(j.total)}</b>. Nothing was charged.`
        : `Los precios se actualizaron desde que abriste la página. Tu total ahora es <b>${cop(j.total)}</b>. No se cobró nada.`}</p>
      <div class="dlg-actions"><button class="btn primary" data-act="recargar-precios">${en ? "See the new prices" : "Ver los precios nuevos"}</button></div>`, "narrow");
  }
  errorPago(j || {});
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act='pago-otra-tarjeta'],[data-act='recargar-precios']"); if (!el) return;
  closeModal();
  if (el.dataset.act === "recargar-precios") return location.reload();
  /* el token ya se usó: los campos se vuelven a montar en blanco */
  abrirCarrito(); renderCarrito();
});

function cambiarCantidad(pid, g, d) {
  const p = prodById(pid), v = p.variantes.find((x) => x.g === +g), c = enCarrito(pid, +g);
  if (!c) return;
  c.n = Math.max(0, Math.min(topeDe(p, v), c.n + d));
  if (!c.n) UI.carrito = UI.carrito.filter((i) => !(i.id === pid && i.g === +g));
  guardarCarrito(); renderCarrito(); renderNav(); renderTray();
}
function quitarDelCarrito(pid, g) {
  UI.carrito = UI.carrito.filter((i) => !(i.id === pid && i.g === +g));
  guardarCarrito(); renderCarrito(); renderNav(); renderTray();
}

/* Lo que la transportadora necesita para hacer la guía. El teléfono ya no es
   opcional: el mensajero llama antes de entregar. El correo sí, porque la guía
   también se puede mandar por WhatsApp. */
function datosPedido({ correoObligatorio = false } = {}) {
  const en = UI.lang === "en", v = (id) => ($("#" + id)?.value || "").trim();
  const falta = (id, msg) => { toast(msg, { type: "err" }); $("#" + id)?.focus(); return null; };
  const completo = v("pd-nombre").replace(/\s+/g, " "), corte = completo.indexOf(" ");
  const d = { nombre: corte > 0 ? completo.slice(0, corte) : completo, apellidos: corte > 0 ? completo.slice(corte + 1) : "",
    documento: v("pd-documento"), tel: v("pd-tel"),
    direccion: v("pd-direccion"), detalle: v("pd-detalle"), ciudad: v("pd-ciudad"), departamento: v("pd-depto"),
    correo: v("pd-correo").toLowerCase() };
  if (!d.nombre) return falta("pd-nombre", en ? "Write your full name." : "Escribe tu nombre y apellidos.");
  /* la guía va a nombre completo: con una sola palabra el mensajero no encuentra a nadie */
  if (!d.apellidos) return falta("pd-nombre", en ? "Add your last name too." : "Escribe también tus apellidos.");
  if (d.documento.replace(/\D/g, "").length < 5) return falta("pd-documento", en ? "Check the ID or tax number." : "Revisa la cédula o el NIT.");
  if (d.tel.replace(/\D/g, "").length < 7) return falta("pd-tel", en ? "Leave a phone the courier can call." : "Deja un teléfono al que pueda llamar el mensajero.");
  if (!d.direccion) return falta("pd-direccion", en ? "Write the address it goes to." : "Escribe la dirección a la que va.");
  if (!d.ciudad) return falta("pd-ciudad", en ? "Write the city it goes to." : "Escribe la ciudad a la que va.");
  if (!d.departamento) return falta("pd-depto", en ? "Choose the department." : "Escoge el departamento.");
  /* pagando en línea, la constancia del pago llega al correo: ahí sí es obligatorio */
  if (correoObligatorio && !d.correo) return falta("pd-correo", en ? "Leave your email: the payment receipt goes there." : "Deja tu correo: ahí te llega la constancia del pago.");
  if (d.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo)) return falta("pd-correo", en ? "Check the email." : "Revisa el correo.");
  return d;
}

/* número de pedido que no choca entre clientes: fecha + cuatro letras al azar */
const numeroPedido = () => "NDZ-" + isoToday().slice(5).replace("-", "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

/* srv: lo que devolvió api/pago.js. Con pasarela el servidor ya escribió el pedido
   en la hoja con SUS números; aquí solo se lleva la cuenta local con esos mismos. */
function registrarPedido(d, canal, srv) {
  const nombre = [d.nombre, d.apellidos].filter(Boolean).join(" ");
  const cl = upsertCliente(nombre, d.ciudad, d.tel);
  const subtotal = srv ? srv.subtotal : totalCarrito(), envio = srv ? srv.envio : envioDe(subtotal);
  const descuento = srv ? srv.descuento : descuentoCarrito(), total = subtotal - descuento + envio;
  /* El IVA ya está dentro del precio del café; el envío no lo lleva. Se guarda
     aparte porque es lo que pide la factura, no un cobro adicional. */
  const iva = srv ? srv.iva : Math.round(ivaDe(subtotal - descuento));
  const bono = descuento ? (srv ? srv.bono : UI.bono.codigo) : "";
  const items = UI.carrito.map((i) => {
    const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
    /* g y stock son para la hoja: con ellos sabe qué presentación descontar.
       Una reserva aparta del cupo de la preventa (0 = sin tope), no de las bolsas. */
    const pre = enPreventa(p);
    return { id: i.id, g: i.g, nombre: i.nombre, n: i.n, precio: i.precio,
      forma: tx(saleDe(p, v)) + (pre ? " · " + rotuloPreventa() : ""), stock: pre ? CONFIG.preventa.cupo || 0 : v.stock,
      ...(pre ? { preventa: true } : {}) };
  });
  recordado.poner(d);
  const pedido = { id: srv ? srv.reference : numeroPedido(), clienteId: cl.id, canal, nombre, documento: d.documento, direccion: d.direccion,
    detalle: d.detalle, ciudad: d.ciudad, departamento: d.departamento, tel: d.tel, correo: d.correo,
    items, subtotal, descuento, bono, envio, total, iva, fecha: isoToday() };
  S.pedidos.unshift(pedido);
  UI.carrito.forEach((i) => {
    const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
    if (enPreventa(p)) return;
    v.stock = Math.max(0, v.stock - i.n);
    p.stock = principal(p).stock;
  });
  const L = (a) => a.join("\n");
  const texto = L([
    `Hola ${CONFIG.marca}, quiero hacer el pedido ${pedido.id}:`,
    ...items.map((i) => `· ${i.n} × ${i.nombre} (${i.forma.toLowerCase()}) = ${cop(i.precio * i.n)}`),
    `Subtotal: ${cop(subtotal)}`,
    ...(descuento ? [`Bono ${bono} (−${UI.bono.pct} %): −${cop(descuento)}`] : []),
    `Envío: ${envio ? cop(envio) : "gratis"}`,
    `Total: ${cop(total)}`,
    ...(iva ? [`Incluye ${cop(iva)} de IVA (${CONFIG.iva} %)`] : []),
    `${nombre} · CC/NIT ${d.documento}`,
    `${d.direccion}${d.detalle ? " · " + d.detalle : ""}`,
    `${d.ciudad}, ${d.departamento} · tel ${d.tel}${d.correo ? " · " + d.correo : ""}`,
  ]);
  /* el pedido salió: ese carrito ya no está abandonado, y el correo queda para el siguiente */
  recordarCorreo(d.correo);
  UI.carrito = []; guardarCarrito(); bitacoraCarrito(true); if (UI.bono) quitarBono(false); save(); cerrarCarrito(); render();
  const guardado = srv ? Promise.resolve(true) : enviarAviso("pedido", { ...pedido, texto });
  return { pedido, texto, guardado };
}

/* Con la hoja conectada el pedido ya nos llegó: no hay que enviar nada más */
function pedidoRecibido(pedido) {
  const en = UI.lang === "en";
  modal(`${en ? "Order" : "Pedido"} <em>${esc(pedido.id)}</em>`, `
    <ol class="pasos-pedido">
      <li><b>${en ? "We got it." : "Ya nos llegó."}</b>
        <span>${pedido.correo ? (en ? `We sent a copy to ${esc(pedido.correo)}.` : `Te mandamos una copia a ${esc(pedido.correo)}.`)
          : (en ? "Keep the order number." : "Guarda el número del pedido.")}</span></li>
      <li><b>${en ? "We confirm and you pay." : "Te confirmamos y pagas."}</b>
        <span>${en ? `We write to you with the total of ${cop(pedido.total)} and how to pay by ${tx(CONFIG.pagos.manual)}.` : `Te escribimos con el total de ${cop(pedido.total)} y cómo pagar por ${tx(CONFIG.pagos.manual)}.`}</span></li>
      <li><b>${en ? "We ship it." : "Lo despachamos."}</b>
        <span>${en ? `It arrives in ${tx(CONFIG.envio.dias)} with ${CONFIG.envio.transportadora}; the tracking number reaches your email.` : `Llega en ${tx(CONFIG.envio.dias)} por ${CONFIG.envio.transportadora}; la guía te llega al correo.`}</span></li>
    </ol>
    <div class="dlg-actions"><button class="btn primary" data-act="close">${en ? "Done" : "Listo"}</button></div>
    <p class="hint">${en ? `Questions? Write to ${CONFIG.correo} with your order number.` : `¿Dudas? Escribe a ${CONFIG.correo} con tu número de pedido.`}</p>`, "narrow");
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
  const { pedido, texto, guardado } = registrarPedido(d, CONFIG.registro ? "web" : CONFIG.whatsapp ? "whatsapp" : "correo");
  if (CONFIG.registro) {
    /* si la hoja no respondió, el pedido no se pierde: sale por WhatsApp o correo como antes */
    guardado.then((ok) => { if (ok) return pedidoRecibido(pedido); confirmacionPedido(pedido, texto); abrirContacto(texto, `Pedido ${pedido.id}`); });
    return;
  }
  confirmacionPedido(pedido, texto);
  abrirContacto(texto, `Pedido ${pedido.id}`);
}

/* Mercado Pago: link de pago por producto, link general, o /api/checkout (Checkout Pro) */
async function pedidoMP() {
  if (mpLista()) return pedidoMercado();
  const d = datosPedido(); if (!d) return;
  /* Mercado Pago no recibe líneas negativas: el bono baja el precio de cada bolsa */
  const factor = UI.bono ? 1 - UI.bono.pct / 100 : 1;
  const items = UI.carrito.map((i) => ({ id: `${i.id}-${i.g}`, title: i.nombre, quantity: i.n, unit_price: Math.round(i.precio * factor) }));
  const envio = envioDe(totalCarrito());
  if (envio) items.push({ id: "envio", title: UI.lang === "en" ? "Shipping" : "Envío", quantity: 1, unit_price: envio });
  const directo = !UI.bono && UI.carrito.length === 1 && !envio && CONFIG.pagos.porProducto[`${UI.carrito[0].id}-${UI.carrito[0].g}`];
  const { pedido, texto } = registrarPedido(d, "mercadopago");
  if (directo) return void window.open(directo, "_blank", "noopener");
  const url = CONFIG.pagos.mercadoPago;
  if (mpEscribeMonto()) return pagoEnMP(pedido, url);
  window.open(url, "_blank", "noopener");
}

/* El link personal abre la caja en cero: le decimos cuánto escribir y con qué referencia */
function pagoEnMP(pedido, url) {
  const en = UI.lang === "en";
  modal(`${en ? "Order" : "Pedido"} <em>${esc(pedido.id)}</em>`, `
    <ol class="pasos-pedido">
      <li><b>${en ? "Open Mercado Pago." : "Abre Mercado Pago."}</b>
        <span>${en ? "It opens in another tab, in the Nandez Coffee account." : "Se abre en otra pestaña, en la cuenta de Nandez Coffee."}</span></li>
      <li><b>${en ? `Enter ${cop(pedido.total)}.` : `Escribe ${cop(pedido.total)}.`}</b>
        <span>${en ? `That is your total with shipping. Leave ${pedido.id} as the description so we can match it.`
                  : `Ese es tu total con el envío. Deja ${pedido.id} como descripción para poder cruzarlo.`}</span></li>
      <li><b>${en ? "We ship it." : "Lo despachamos."}</b>
        <span>${en ? `It arrives in ${tx(CONFIG.envio.dias)} with ${CONFIG.envio.transportadora}; the tracking number reaches your email.`
                  : `Llega en ${tx(CONFIG.envio.dias)} por ${CONFIG.envio.transportadora}; la guía te llega al correo.`}</span></li>
    </ol>
    <div class="dlg-actions">
      <button class="btn" data-act="copiar" data-texto="${Math.round(pedido.total)}">${en ? "Copy the total" : "Copiar el total"}</button>
      <a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener">${en ? "Open Mercado Pago" : "Abrir Mercado Pago"}</a></div>
    <p class="hint">${en ? `Already paid? Write to ${CONFIG.correo} with your order number.`
                        : `¿Ya pagaste? Escríbenos a ${CONFIG.correo} con tu número de pedido.`}</p>`, "narrow");
}

/* ---------- pago con Mercado Pago (api/checkout.js) ----------
   Igual que con Wompi, el servidor hace la cuenta, aparta las bolsas y crea el cobro.
   La diferencia: Mercado Pago es una página aparte. Antes de irse, se guarda el pedido;
   al volver (?pago=ok) se recoge y se muestra el resultado. Quien marca el pago como
   recibido es el aviso de Mercado Pago a api/webhook.js, no esta vuelta. */
const MP_KEY = "nandez-mp";
async function pedidoMercado() {
  const en = UI.lang === "en";
  if (UI.pagando) return;
  const d = datosPedido({ correoObligatorio: true }); if (!d) return;
  medir("pagar", { ids: UI.carrito.map((i) => i.id), valor: totalCarrito(), n: unidadesCarrito() });
  UI.pagando = true; renderCarrito();
  let j;
  try {
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: UI.carrito.map((i) => ({ id: i.id, g: i.g, n: i.n })), bono: UI.bono?.codigo || "",
        comprador: d, idioma: UI.lang, reemplaza: reserva.leer() }) });
    j = await r.json();
  } catch { j = { ok: false, error: "red" }; }
  UI.pagando = false; renderCarrito();
  if (!j || !j.ok || !j.url) return errorPago(j || {});
  reserva.poner(j.reference);
  const visto = totalCarrito() - descuentoCarrito() + envioDe(totalCarrito());
  if (j.total !== visto) {
    UI.cobro = { j, d, mp: true };
    return modal(en ? "The total changed" : "El total cambió", `
      <p class="hint">${en ? `Prices were updated since you opened the page. Your total is now <b>${cop(j.total)}</b>, not ${cop(visto)}.`
        : `Los precios se actualizaron desde que abriste la página. Tu total ahora es <b>${cop(j.total)}</b>, no ${cop(visto)}.`}</p>
      <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
        <button class="btn primary" data-act="pago-abrir">${t("pagar_ahora")} · ${cop(j.total)}</button></div>`, "narrow");
  }
  irAMercado(j, d);
}
function irAMercado(j, d) {
  try { localStorage.setItem(MP_KEY, JSON.stringify({ j, d })); } catch {}
  window.location.href = j.url;
}
/* Al volver de Mercado Pago: la dirección trae ?pago=ok|pendiente|fallo&pedido=… */
function volverDeMercado() {
  const q = new URLSearchParams(location.search), est = q.get("pago"); if (!est) return;
  history.replaceState(history.state, "", location.pathname + location.hash);
  let g = null; try { g = JSON.parse(localStorage.getItem(MP_KEY)); } catch {}
  const mio = !!(g && g.j && g.j.reference === q.get("pedido"));
  try { localStorage.removeItem(MP_KEY); } catch {}
  if (est === "ok" || est === "pendiente") {
    if (mio) { registrarPedido(g.d, "mercadopago", g.j); reserva.poner(""); }
    return pagoMostrar(est === "ok", mio ? g.j : { reference: q.get("pedido") || "", total: 0 }, mio ? g.d.correo : "");
  }
  const en = UI.lang === "en";
  modal(en ? "The payment did not go through" : "El pago no pasó", `
    <p class="hint">${en ? "Nothing was charged. Your cart is still here: you can try again."
      : "No se cobró nada. Tu carrito sigue aquí: puedes intentar otra vez."}</p>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Close" : "Cerrar"}</button>
      <button class="btn primary" data-act="pago-reintentar">${en ? "Try again" : "Intentar otra vez"}</button></div>`, "narrow");
}
/* Lo que ve la persona cuando el pago quedó aprobado o en proceso (Wompi y Mercado Pago) */
function pagoMostrar(ok, j, correo) {
  const en = UI.lang === "en", pre = preventaAbierta();
  /* la compra se cuenta cuando la pasarela dijo que sí, no al abrir la caja */
  if (ok) medir("compra", { nombre: j.reference || "", valor: j.total || 0 });
  modal(ok ? (en ? "Payment received" : "Pago recibido") : (en ? "Payment in process" : "Pago en proceso"), `
    <ol class="pasos-pedido">
      <li><b>${j.reference ? (en ? `Order ${esc(j.reference)}` : `Pedido ${esc(j.reference)}`) + (j.total ? ` · ${cop(j.total)}` : "") : (en ? "Your order" : "Tu pedido")}</b>
        <span>${ok ? (correo ? (en ? `The receipt reaches ${esc(correo)} in a few minutes.` : `La constancia te llega a ${esc(correo)} en unos minutos.`)
              : (en ? "The receipt reaches your email in a few minutes." : "La constancia te llega al correo en unos minutos."))
          : (en ? "Your bank is confirming it. We email you as soon as it clears." : "Tu banco lo está confirmando. Te escribimos apenas pase.")}</span></li>
      <li><b>${pre ? (en ? "Pre-order: we ship it from launch day." : "Preventa: lo despachamos desde el día del lanzamiento.")
                   : (en ? "We ship it." : "Lo despachamos.")}</b>
        <span>${pre ? (en ? `Dispatch starts ${fmtFecha(entregaPreventa())}. You get the tracking number by email.`
                          : `Los despachos arrancan el ${fmtFecha(entregaPreventa())}. La guía te llega al correo.`)
          : (en ? `It arrives in ${tx(CONFIG.envio.dias)} with ${CONFIG.envio.transportadora}; the tracking number reaches your email.`
            : `Llega en ${tx(CONFIG.envio.dias)} por ${CONFIG.envio.transportadora}; la guía te llega al correo.`)}</span></li>
    </ol>
    <div class="dlg-actions"><button class="btn primary" data-act="close">${en ? "Done" : "Listo"}</button></div>`, "narrow");
}

/* ---------- pago con Wompi, dentro de la página ----------
   api/pago.js rehace la cuenta con los precios del catálogo, aparta las bolsas en
   la hoja y firma el monto. Aquí solo se abre el widget con lo que él devolvió:
   el navegador nunca decide cuánto se cobra. Quien confirma el pago es el aviso
   de Wompi a api/wompi.js, no lo que diga esta página. */
/* La reserva sin pagar sobrevive a recargar la página o cerrar la pestaña: si la
   persona vuelve a intentar, el servidor suelta la anterior en vez de apartar dos
   veces las mismas bolsas. (Lo encontró la compra de prueba en el navegador.) */
/* Los datos de envío de la última compra, guardados SOLO en el navegador de quien
   compró: la segunda vez no se escribe nada. «Olvidar mis datos» los borra. Nada
   de esto sale del navegador ni va a la hoja. */
const COMPRADOR_KEY = "nandez-comprador";
const recordado = {
  leer: () => { try { return JSON.parse(localStorage.getItem(COMPRADOR_KEY)) || null; } catch { return null; } },
  poner: (d) => { try { localStorage.setItem(COMPRADOR_KEY, JSON.stringify({ nombre: d.nombre, apellidos: d.apellidos,
    documento: d.documento, tel: d.tel, direccion: d.direccion, detalle: d.detalle, ciudad: d.ciudad, departamento: d.departamento, correo: d.correo })); } catch {} },
  olvidar: () => { try { localStorage.removeItem(COMPRADOR_KEY); } catch {} },
  campos() {
    const r = this.leer(); if (!r) return {};
    return { "pd-nombre": [r.nombre, r.apellidos].filter(Boolean).join(" "), "pd-documento": r.documento, "pd-tel": r.tel,
      "pd-direccion": r.direccion, "pd-detalle": r.detalle, "pd-ciudad": r.ciudad, "pd-depto": r.departamento, "pd-correo": r.correo };
  },
};
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-act='olvidar-datos']")) return;
  recordado.olvidar();
  ["pd-nombre", "pd-documento", "pd-tel", "pd-direccion", "pd-detalle", "pd-ciudad", "pd-depto", "pd-correo"].forEach((k) => { const el = $("#" + k); if (el) el.value = ""; });
  renderCarrito();
  toast(UI.lang === "en" ? "Your details were removed from this browser." : "Tus datos se borraron de este navegador.");
});
/* Al escribir una ciudad conocida, el departamento se llena solo */
document.addEventListener("input", (e) => {
  if (e.target.id !== "pd-ciudad") return;
  const d = deptoDe(e.target.value), sel = $("#pd-depto");
  if (d && sel && sel.value !== d) sel.value = d;
});
const reserva = {
  leer: () => { try { return localStorage.getItem("nandez-reserva") || ""; } catch { return ""; } },
  poner: (id) => { try { if (id) localStorage.setItem("nandez-reserva", id); else localStorage.removeItem("nandez-reserva"); } catch {} },
};
let widgetWompi = null;
function cargarWidget() {
  if (window.WidgetCheckout) return Promise.resolve();
  return (widgetWompi ||= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = CONFIG.pagos.wompi.widget; s.async = true;
    s.onload = () => (window.WidgetCheckout ? ok() : mal(new Error("widget")));
    s.onerror = () => { widgetWompi = null; mal(new Error("widget")); };
    document.head.append(s);
  }));
}

async function pedidoWompi() {
  const en = UI.lang === "en";
  if (UI.pagando) return;
  const d = datosPedido({ correoObligatorio: true }); if (!d) return;
  medir("pagar", { ids: UI.carrito.map((i) => i.id), valor: totalCarrito(), n: unidadesCarrito() });
  UI.pagando = true; renderCarrito();
  let j;
  try {
    const r = await fetch("/api/pago", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: UI.carrito.map((i) => ({ id: i.id, g: i.g, n: i.n })), bono: UI.bono?.codigo || "",
        comprador: d, idioma: UI.lang, llavePublica: CONFIG.pagos.wompi.llavePublica, reemplaza: reserva.leer() }) });
    j = await r.json();
  } catch { j = { ok: false, error: "red" }; }
  UI.pagando = false; renderCarrito();
  if (!j || !j.ok) return errorPago(j || {});
  /* la reserva queda anotada: si la persona reintenta, el servidor suelta esta primero */
  reserva.poner(j.reference);
  const visto = totalCarrito() - descuentoCarrito() + envioDe(totalCarrito());
  if (j.total !== visto) {
    /* El catálogo cambió desde que se cargó la página: se le muestra el total real
       antes de abrir el pago, nunca un monto distinto en silencio. */
    UI.cobro = { j, d };
    return modal(en ? "The total changed" : "El total cambió", `
      <p class="hint">${en ? `Prices were updated since you opened the page. Your total is now <b>${cop(j.total)}</b>, not ${cop(visto)}.`
        : `Los precios se actualizaron desde que abriste la página. Tu total ahora es <b>${cop(j.total)}</b>, no ${cop(visto)}.`}</p>
      <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
        <button class="btn primary" data-act="pago-abrir">${t("pagar_ahora")} · ${cop(j.total)}</button></div>`, "narrow");
  }
  abrirWompi(j, d);
}

async function abrirWompi(j, d) {
  const en = UI.lang === "en";
  try { await cargarWidget(); }
  catch { return toast(en ? "The payment window did not load. Check your connection and try again." : "No cargó la ventana de pago. Revisa tu conexión e intenta otra vez.", { type: "err" }); }
  const doc = d.documento.replace(/[^\dA-Za-z]/g, ""), tel = d.tel.replace(/\D/g, "").slice(-10);
  const checkout = new window.WidgetCheckout({
    currency: j.currency, amountInCents: j.amountInCents, reference: j.reference,
    publicKey: CONFIG.pagos.wompi.llavePublica, signature: j.signature, expirationTime: j.expirationTime, taxInCents: j.taxInCents,
    /* un NIT se escribe con su dígito de verificación separado por guion */
    customerData: { email: d.correo, fullName: `${d.nombre} ${d.apellidos}`, phoneNumber: tel, phoneNumberPrefix: "+57",
      legalId: doc, legalIdType: /-/.test(d.documento) ? "NIT" : "CC" },
    shippingAddress: { addressLine1: d.direccion, addressLine2: d.detalle || undefined, city: d.ciudad, region: d.departamento,
      phoneNumber: tel, country: "CO" },
  });
  /* El carrito es un diálogo modal: mientras está abierto, todo lo demás de la
     página queda inerte y el widget de Wompi se pintaría debajo, sin poder
     tocarse. Se cierra antes; el carrito no se pierde, y si el pago no pasa se
     vuelve a abrir. (Lo encontró la compra de prueba en el navegador.) */
  cerrarCarrito();
  checkout.open((resultado) => resultadoPago(resultado && resultado.transaction, j, d));
}

/* Lo que ve la persona al cerrar el widget. Es solo para ella: el pedido se marca
   pagado cuando llega el aviso firmado de Wompi a la hoja, no por esto. */
function resultadoPago(tr, j, d) {
  const en = UI.lang === "en", estado = tr && tr.status;
  if (estado === "APPROVED" || estado === "PENDING") {
    registrarPedido(d, "wompi", j);
    reserva.poner("");
    return pagoMostrar(estado === "APPROVED", j, d.correo);
  }
  /* No pasó, o cerró la ventana: el carrito sigue como estaba para reintentar */
  if (!estado) return;
  modal(en ? "The payment did not go through" : "El pago no pasó", `
    <p class="hint">${en ? "Nothing was charged. You can try again with another card or method."
      : "No se cobró nada. Puedes intentar otra vez con otra tarjeta u otro medio."}</p>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Close" : "Cerrar"}</button>
      <button class="btn primary" data-act="pago-reintentar">${en ? "Try again" : "Intentar otra vez"}</button></div>`, "narrow");
}

function errorPago(j) {
  const en = UI.lang === "en", e = j.error;
  const campo = { nombre: "pd-nombre", documento: "pd-documento", tel: "pd-tel", direccion: "pd-direccion", correo: "pd-correo" }[e];
  if (campo) { $("#" + campo)?.focus(); return toast(en ? "Check the highlighted field." : "Revisa el dato marcado.", { type: "err" }); }
  if (e === "agotado") {
    cargarStock();
    return toast(en ? `Sold out meanwhile: ${(j.faltan || []).join(", ")}. We updated your order.`
      : `Se agotó mientras tanto: ${(j.faltan || []).join(", ")}. Ajustamos tu pedido.`, { type: "err" });
  }
  if (e === "bono") {
    quitarBono(false); renderCarrito(); renderTray();
    return toast(en ? "That code no longer works; we removed it." : "Ese bono ya no sirve; lo quitamos.", { type: "err" });
  }
  if (["no-disponible", "producto", "cantidad", "carrito"].includes(e)) {
    cargarStock();
    return toast(en ? "Something in your order changed. Check it and try again." : "Algo de tu pedido cambió. Revísalo e intenta otra vez.", { type: "err" });
  }
  /* la pasarela no respondió: se ofrece la otra forma de pago, sin perder lo escrito */
  UI.pago = "manual"; renderCarrito();
  toast(en ? `Online payment is not available right now. You can still order and pay by ${tx(CONFIG.pagos.manual)}.`
    : `El pago en línea no está disponible ahora. Igual puedes pedir y pagar por ${tx(CONFIG.pagos.manual)}.`, { type: "err" });
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act='pago-abrir'],[data-act='pago-reintentar']"); if (!el) return;
  closeModal();
  if (el.dataset.act === "pago-abrir" && UI.cobro) { const { j, d, mp } = UI.cobro; UI.cobro = null; return mp ? irAMercado(j, d) : abrirWompi(j, d); }
  if (el.dataset.act === "pago-reintentar") { abrirCarrito(); mpLista() ? pedidoMercado() : pedidoWompi(); }
});

function copiar(texto) {
  const ok = () => toast(UI.lang === "en" ? "Copied." : "Copiado.");
  try { navigator.clipboard.writeText(texto).then(ok, () => {}); } catch {}
}

/* Elegir método de pago: cambia el botón del pie sin perder lo que ya escribió */
document.addEventListener("click", (e) => {
  const el = e.target.closest(".pay-op[data-pago]"); if (!el) return;
  if (UI.pago === el.dataset.pago) return;
  UI.pago = el.dataset.pago; renderCarrito();
});

/* El bono en el carrito: el panel general deja pasar lo que no conoce */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act^='bono-']"); if (!el || el.disabled) return;
  if (el.dataset.act === "bono-aplicar") validarBono($("#pd-bono")?.value);
  if (el.dataset.act === "bono-quitar") quitarBono();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "pd-bono") { e.preventDefault(); validarBono(e.target.value); }
});

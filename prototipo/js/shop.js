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

/* ---------- tarjetas ---------- */
/* ---------- la foto de cada café ----------
   Convención: /img/productos/<id del café en minúsculas>.webp y su versión
   @0.5x. Por ahora son pruebas hechas con el empaque en diseño; cuando lleguen
   las fotos reales se reemplazan con el mismo nombre y nada más cambia.
   Si un café todavía no tiene foto, se muestra el dibujo de su montaña. */
const CON_FOTO = new Set(["P-CAS"]);
function fotoProducto(p, { sizes = "(min-width:900px) 360px, 70vw", clase = "prod-foto", prioridad = false } = {}) {
  if (!CON_FOTO.has(p.id)) return ridge(p, { w: 420, h: 200 });
  const base = `/img/productos/${p.id.toLowerCase()}`;
  return `<img class="${clase}" src="${foto(base + ".webp")}" srcset="${foto(base + "@0.5x.webp")} 452w, ${foto(base + ".webp")} 904w"
    sizes="${sizes}" width="904" height="827" alt="${esc(UI.lang === "en" ? `Bag of ${tx(p.nombre)}` : `Bolsa de ${tx(p.nombre)}`)}"
    ${prioridad ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function cafeCard(p, i = 0) {
  const f = fincaDe(p), v = principal(p), en = UI.lang === "en", pronto = !!p.proximamente;
  return `<article class="card-cafe reveal${pronto ? " pronto" : ""}" style="--i:${i};--pc:${p.color || "#2F5A3C"}">
    <div class="cc-art${CON_FOTO.has(p.id) ? " con-foto" : ""}" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
      ${pronto ? `<span class="g-pronto">${t("proximamente")}<i>${esc(tx(p.sub))}</i></span>` : fotoProducto(p)}
      ${pronto ? "" : `<span class="state st-publicado">${v.stock} ${t("disponibles")}</span>
      <div class="cc-score"><b>${esc(p.puntaje)}</b><small style="color:${LV[p.nivel].c}">SCA · ${lvl(p.nivel)}</small></div>`}
    </div>
    <div class="cc-body">
      <p class="kicker">${esc(tr(f.finca || t("por_confirmar")))}<br>${p.altitud ? esc(msnm(p.altitud)) : (en ? "altitude to be confirmed" : "altura por confirmar")}</p>
      <h3>${esc(tx(p.nombre))}</h3>
      <p class="notas-linea">${tx(p.notas).join(" · ")}</p>
      <div class="cc-foot">${pronto
        ? `<b>${t("por_confirmar")}</b><small>${t("en_grano").toLowerCase()}</small><button class="btn sm" data-act="espera" data-id="${p.id}">${t("avisame")}</button>`
        : `<b class="mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${esc(tx(saleDe(p, v))).toLowerCase()}</small>
        <button class="btn primary sm" data-act="cafe" data-id="${p.id}">${t("ver_cafe")}</button>`}</div>
    </div></article>`;
}

/* La tarjeta grande del inicio: la bolsa sobre su propia tinta, el número de la
   serie y el puntaje; abajo la finca, el nombre, las notas y el precio. */
function tarjetaInicio(p, i = 0) {
  const f = fincaDe(p), v = principal(p), en = UI.lang === "en", pronto = !!p.proximamente;
  return `<article class="g-prod g-io${pronto ? " pronto" : ""}" style="--pc:${p.color || "#2F5A3C"};--i:${i}">
    <div class="g-prod-art" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
      ${pronto ? `<span class="g-pronto">${t("proximamente")}<i>${esc(tx(p.sub))}</i></span>` : fotoProducto(p, { clase: "g-prod-foto", sizes: "(min-width:1000px) 400px, 90vw" })}
      ${pronto ? "" : `<p class="g-prod-sca"><b>${esc(p.puntaje)}</b><small>SCA · ${lvl(p.nivel)}</small></p>`}
      <span class="g-prod-n">0${i + 1}</span>
    </div>
    <div class="g-prod-body">
      <p class="g-kicker">${esc(tr(f.finca || t("por_confirmar")))} · ${p.altitud ? esc(msnm(p.altitud)) : (en ? "altitude tbc" : "altura por confirmar")}</p>
      <h3>${esc(tx(p.nombre))}</h3>
      <p class="g-notas">${pronto ? esc(tx(p.sub)) : tx(p.notas).join(" · ")}</p>
      <div class="g-prod-foot">${pronto
        ? `<b>${t("por_confirmar")}</b><small>${t("en_grano").toLowerCase()}</small><button class="btn sm" data-act="espera" data-id="${p.id}">${t("avisame")}</button>`
        : `<b class="mono">${cop(v.precio)}</b><small>${gramos(v.g)} · ${t("en_grano").toLowerCase()}</small>
        <button class="btn primary sm" data-act="add" data-p="${p.id}" data-g="${v.g}" ${v.stock ? "" : "disabled"}>${t("agregar")}</button>`}</div>
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

function fincaCard(f, i = 0) {
  const cafes = S.productos.filter((p) => p.fincaId === f.id), en = UI.lang === "en";
  return `<article class="finca reveal ${f.propia ? "propia" : ""}" style="--i:${i}">
    <div class="finca-art">${ridge(f, { w: 380, h: 120 })}</div>
    <div class="finca-body">
      <p class="kicker">${esc(f.municipio)} · ${msnm(f.altitud)}</p>
      <h3>${esc(tr(f.finca))}</h3>
      ${conocido(f.productor) || f.exclusiva ? `<p class="finca-prod">${conocido(f.productor) ? esc(tr(f.productor)) : ""}${f.exclusiva ? ` <span class="excl">${en ? "exclusive" : "exclusivo"}</span>` : ""}</p>` : ""}
      ${historiaPublica(f) ? `<p class="hint">${esc(historiaPublica(f))}</p>` : ""}
      <div class="finca-foot">
        <span class="var-chip">${esc(tr(f.variedad))}</span>
        ${f.proxima ? `<span class="pronto">${en ? "First harvest" : "Primera cosecha"} ${f.proxima}</span>`
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
        <h2 class="reveal" style="--i:1">${en ? "Everything <em>from the house</em>" : "Todo lo <em>de la casa</em>"}</h2>
        <p class="reveal" style="--i:2">${en ? "Whole bean coffee from neighbouring farms, the gear to brew it and Coffee Gang merch."
          : "Café en grano de fincas vecinas, lo necesario para prepararlo y el merch Coffee Gang."}</p></div>
    </div>
    <div class="g-puertas">
      <a class="g-puerta reveal" style="--pc:${p.color || "#2F5A3C"};--i:3" href="${ruta("cafes")}" data-act="go" data-to="cafes">
        <span class="g-puerta-art">${fotoProducto(p, { clase: "g-prod-foto", sizes: "(min-width:900px) 520px, 90vw" })}</span>
        <span class="g-puerta-txt"><small>01 · ${n} ${en ? "whole bean coffees" : "cafés en grano"}${ya < n ? ` · ${ya} ${en ? "on sale" : "a la venta"}` : ""}</small>
          <b>${t("nav_cafes_esp")}</b><i>${en ? "One farm each, always whole bean." : "Una finca cada uno, siempre en grano."}</i></span></a>
      <a class="g-puerta oscura reveal" style="--i:4" href="${ruta("accesorios")}" data-act="go" data-to="accesorios">
        <span class="g-puerta-art"><span class="g-pronto">Coffee Gang<i>${t("proximamente")}</i></span></span>
        <span class="g-puerta-txt"><small>02 · ${accesoriosVisibles().length} ${en ? "pieces" : "piezas"} · ${t("proximamente").toLowerCase()}</small>
          <b>${t("nav_accesorios")}</b><i>${conPreparar()
            ? (en ? "Dripper, grinder, kettle, and things to wear." : "Gotero, molino, tetera, y algo para ponerse.")
            : (en ? "T-shirt, cap, mug and tote bag from the gang." : "Camiseta, gorra, taza y bolsa de tela del gang.")}</i></span></a>
    </div>`;
}

function accesorioCard(a, i = 0) {
  return `<article class="g-acc reveal" style="--pc:${a.color};--i:${i}">
    <div class="g-acc-art" data-act="espera" data-id="${a.id}" role="button" tabindex="0" aria-label="${esc(tx(a.nombre))}">
      <span class="g-acc-n">${String(i + 1).padStart(2, "0")}</span><b>${esc(tx(a.nombre))}</b></div>
    <div class="g-acc-body">
      <p>${esc(tx(a.desc))}</p>
      <div class="g-prod-foot">${a.proximamente
        ? `<b>${t("proximamente")}</b><button class="btn sm" data-act="espera" data-id="${a.id}">${t("avisame")}</button>`
        : `<b class="mono">${cop(a.precio)}</b>`}</div>
    </div></article>`;
}

function viewAccesorios() {
  const en = UI.lang === "en", prep = conPreparar();
  const grupos = [["preparar", en ? "To brew at home" : "Para preparar en casa"], ["merch", "Merch " + esc(CONFIG.gang)]]
    .filter(([g]) => CONFIG.accesoriosVisibles.includes(g));
  return `${subnavTienda("accesorios")}
    <div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_tienda")} · ${t("nav_accesorios")}</p>
        <h2 class="reveal" style="--i:1">${prep ? (en ? "To brew it, <em>and to wear it</em>" : "Para prepararlo, <em>y para ponértelo</em>")
                                              : (en ? "Wear the <em>gang</em>" : "Ponte el <em>gang</em>")}</h2>
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
        <h2 class="reveal" style="--i:1">${en ? "Three coffees, <em>whole bean</em>" : "Tres cafés, <em>en grano</em>"}</h2>
        <p class="reveal" style="--i:2">${en
          ? "Three whole bean coffees, each from a single farm in Norte de Santander. Choose by flavour, by altitude or by farm."
          : "Tres cafés en grano, cada uno de una sola finca de Norte de Santander. Escoge por sabor, por altura o por finca."}</p></div>
    </div>
    <div class="dos">${S.productos.map((p, i) => cafeCard(p, i)).join("")}${visible("subasta") ? subastaCard(S.productos.length) : ""}</div>
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
  const pronto = !!p.proximamente;
  const compra = pronto ? `
      <div class="pronto-aviso">
        <b>${t("proximamente")}</b>
        <p>${en ? "Farm, data sheet and price are still to be confirmed. Leave your email and we tell you the day it is out."
                : "La finca, la ficha y el precio están por confirmar. Deja tu correo y te avisamos el día que salga."}</p>
        <button class="btn primary" data-act="espera" data-id="${p.id}">${t("avisame")}</button>
      </div>
      <p class="sale"><span class="sale-tag">${esc(tx(saleDe(p, v)))}</span> <span>${esc(tx(saleNotaDe(p, v)))}</span></p>` : `
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
        : `sale de Cúcuta y llega en ${tx(E.dias)} · envío ${cop(E.costo)}, gratis desde ${cop(E.gratisDesde)}`}</p>`;
  return `<article class="prod" style="--pc:${p.color || "#2F5A3C"}">
    <div class="prod-top">
    <div class="prod-buy reveal">
      <p class="eyebrow">${esc([conocido(f.productor) && tr(f.productor), conocido(f.finca) && tr(f.finca), f.municipio && !String(f.finca || "").includes(f.municipio) && f.municipio].filter(Boolean).join(" · ") || t("nav_cafes_esp"))}</p>
      <h1>${esc(tx(p.nombre))}</h1>
      <p class="lede">${esc(historiaPublica(f) || (f.municipio
        ? (en ? `Whole bean coffee from ${f.municipio}, Norte de Santander${p.altitud ? `, grown at ${msnm(p.altitud)}` : ""}.`
              : `Café en grano de ${f.municipio}, Norte de Santander${p.altitud ? `, cultivado a ${msnm(p.altitud)}` : ""}.`)
        : (en ? "Whole bean coffee from Norte de Santander." : "Café en grano de Norte de Santander.")))}</p>
      ${compra}
    </div>

    <div class="prod-art reveal" style="--i:1">
      <div class="prod-escena">
        ${pronto ? `<span class="g-pronto">${t("proximamente")}<i>${esc(tx(p.sub))}</i></span>` : fotoProducto(p, { sizes: "(min-width:900px) 560px, 90vw", prioridad: true })}
        ${pronto ? "" : `<p class="prod-sello"><b>${esc(p.puntaje)}</b><small>SCA</small></p>`}
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
  const E = CONFIG.envio, envio = envioDe(totalCarrito()), falta = E.gratisDesde - totalCarrito(), desc = descuentoCarrito();
  /* lo que ya escribió la persona sobrevive a que el carrito se vuelva a pintar */
  const escrito = Object.fromEntries(["pd-nombre", "pd-ciudad", "pd-correo", "pd-tel", "pd-bono"].map((k) => [k, $("#" + k)?.value || ""]));
  const val = (k) => (escrito[k] ? ` value="${esc(escrito[k])}"` : "");
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
      ${desc ? `<div class="cart-bono-linea"><span>${en ? "Code" : "Bono"} ${esc(UI.bono.codigo)} · −${UI.bono.pct} %
        <button class="cart-del" data-act="bono-quitar">${en ? "Remove" : "Quitar"}</button></span><b class="mono">−${cop(desc)}</b></div>` : ""}
      <div><span>${en ? "Shipping" : "Envío"}</span><b class="mono">${envio ? cop(envio) : (en ? "Free" : "Gratis")}</b></div>
      <div class="cart-total"><span>${t("total")}</span><b class="mono">${cop(totalCarrito() - desc + envio)}</b></div>
      <p class="hint">${envio
        ? (en ? `Add ${cop(falta)} more and shipping is free. ` : `Te faltan ${cop(falta)} para el envío gratis. `)
        : ""}${en ? "Arrives in " : "Llega en "}${tx(E.dias)} ${en ? "with " : "por "}${esc(E.transportadora)}${en ? ", anywhere in Colombia." : ", a cualquier ciudad de Colombia."}</p>
    </div>

    <div class="form-grid cart-form">
      <div class="field"><label class="lbl" for="pd-nombre">${en ? "Name" : "Nombre o negocio"}</label><input id="pd-nombre" class="input" autocomplete="name" enterkeyhint="next"${val("pd-nombre")}></div>
      <div class="field"><label class="lbl" for="pd-ciudad">${en ? "City" : "Ciudad"}</label><input id="pd-ciudad" class="input" autocomplete="address-level2" enterkeyhint="next"${val("pd-ciudad")}></div>
      <div class="field"><label class="lbl" for="pd-correo">${en ? "Email (for the tracking number)" : "Correo (para mandarte la guía)"}</label><input id="pd-correo" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" enterkeyhint="next"${val("pd-correo")}></div>
      <div class="field"><label class="lbl" for="pd-tel">${en ? "WhatsApp (to confirm your order)" : "WhatsApp (para confirmarte el pedido)"}</label><input id="pd-tel" class="input" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="done" placeholder="300 000 0000"${val("pd-tel")}></div>
      ${CONFIG.registro && !UI.bono ? `<div class="field cart-bono" style="grid-column:1/-1"><label class="lbl" for="pd-bono">${en ? "Welcome code" : "Código de bono"}</label>
        <div class="co-fila"><input id="pd-bono" class="input mono" autocapitalize="characters" autocomplete="off" placeholder="GANG-XXXXX"${val("pd-bono")}>
          <button class="btn" data-act="bono-aplicar" ${UI.bonoCargando ? "disabled" : ""}>${UI.bonoCargando ? "…" : en ? "Apply" : "Aplicar"}</button></div></div>` : ""}
    </div>`;
  const pie = $("#cart-foot"), mp = !!CONFIG.pagos.mercadoPago;
  pie.innerHTML = `
    ${mp ? `<button class="btn primary" data-act="pedido-mp">${t("pagar_mp")}</button>` : ""}
    <button class="btn ${mp ? "" : "primary"}" data-act="pedido-wa">${CONFIG.registro ? (en ? "Place the order" : "Hacer el pedido")
      : en ? `Send order by ${canalContacto()}` : `Enviar pedido por ${canalContacto()}`}</button>
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
  const correo = ($("#pd-correo")?.value || "").trim().toLowerCase(), tel = $("#pd-tel").value.trim();
  if (correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { toast(en ? "Check the email." : "Revisa el correo.", { type: "err" }); $("#pd-correo").focus(); return null; }
  /* sin WhatsApp ni correo no hay cómo confirmarle el pago */
  if (CONFIG.registro && !correo && !tel) { toast(en ? "Leave your email or WhatsApp so we can confirm it." : "Déjanos tu correo o tu WhatsApp para confirmarte el pedido.", { type: "err" }); $("#pd-correo").focus(); return null; }
  return { nombre, ciudad, tel, correo };
}

/* número de pedido que no choca entre clientes: fecha + cuatro letras al azar */
const numeroPedido = () => "NDZ-" + isoToday().slice(5).replace("-", "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

function registrarPedido(d, canal) {
  const cl = upsertCliente(d.nombre, d.ciudad, d.tel);
  const subtotal = totalCarrito(), envio = envioDe(subtotal), descuento = descuentoCarrito(), total = subtotal - descuento + envio;
  const bono = descuento ? UI.bono.codigo : "";
  const items = UI.carrito.map((i) => {
    const p = prodById(i.id), v = p.variantes.find((x) => x.g === i.g);
    return { id: i.id, nombre: i.nombre, n: i.n, precio: i.precio, forma: tx(saleDe(p, v)) };
  });
  const pedido = { id: numeroPedido(), clienteId: cl.id, canal, nombre: d.nombre, ciudad: d.ciudad, tel: d.tel, correo: d.correo,
    items, subtotal, descuento, bono, envio, total, fecha: isoToday() };
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
    ...(descuento ? [`Bono ${bono} (−${UI.bono.pct} %): −${cop(descuento)}`] : []),
    `Envío: ${envio ? cop(envio) : "gratis"}`,
    `Total: ${cop(total)}`,
    `${d.nombre} · ${d.ciudad}${d.tel ? " · WhatsApp " + d.tel : ""}${d.correo ? " · " + d.correo : ""}`,
  ]);
  UI.carrito = []; guardarCarrito(); if (bono) quitarBono(false); save(); cerrarCarrito(); render();
  const guardado = enviarAviso("pedido", { ...pedido, texto });
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

/* El bono en el carrito: el panel general deja pasar lo que no conoce */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act^='bono-']"); if (!el || el.disabled) return;
  if (el.dataset.act === "bono-aplicar") validarBono($("#pd-bono")?.value);
  if (el.dataset.act === "bono-quitar") quitarBono();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "pd-bono") { e.preventDefault(); validarBono(e.target.value); }
});

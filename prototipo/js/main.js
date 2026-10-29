/* ============================================================
   INICIO, navegación, idioma y eventos de la página pública
   ============================================================ */
/* Cada palabra del titular entra por su cuenta. El espacio queda fuera del
   span: para un buscador o un lector de pantalla sigue siendo una frase. */
const pal = (txt, desde = 0) => txt.split(" ").map((p, i) => `<span class="pal" style="--w:${desde + i}">${p}</span>`).join(" ");

function viewInicio() {
  const en = UI.lang === "en";
  const principios = en
    ? [["You know where it comes from.", "Every bag names its farm. The blend names its two: Castillo from Ragonvalia and El Paraíso from Chinácota, nothing else."],
       ["Data with a signature.", "Altitude, variety, process and score say who checked them and when. What we have not verified yet, we do not make up."],
       ["Three coffees, not thirty.", "A lot goes on the shelf only if we cup it and it convinces us. We would rather sell out than fill the shelf."],
       ["Whole bean or ground.", "Two coffees go whole bean, so you grind them right before brewing. The blend goes medium ground, ready for the cone or the drip machine. All three, medium roast."]]
    : [["Sabes de dónde viene.", "Cada bolsa dice de qué finca sale. El blend dice de cuáles dos: Castillo de Ragonvalia y El Paraíso de Chinácota, nada más."],
       ["Datos con firma.", "La altura, la variedad, el proceso y el puntaje dicen quién los comprobó y cuándo. Lo que todavía no hemos verificado, no lo inventamos."],
       ["Tres cafés, no treinta.", "Un lote entra a la tienda solo si lo catamos y nos convence. Preferimos que se agote a llenar la estantería."],
       ["En grano o molido.", "Dos cafés van en grano, para que los muelas justo antes de prepararlos. El blend va en molienda media, listo para el gotero o la cafetera de goteo. Los tres, con tostión media."]];
  const cabeza = (num, kicker, titulo, texto, link) => `<div class="g-head g-io">
      <span class="g-num">${num}</span><p class="g-kicker">${kicker}</p>
      <h2>${titulo}</h2>${texto ? `<p>${texto}</p>` : ""}${link || ""}</div>`;
  const a = UI.au, top = topBid(a);
  return `
  ${portada(en)}
  ${cinta(en)}

  <section class="g-sec" id="cafes" aria-labelledby="g-cafes">
    ${cabeza("01", en ? "This harvest" : "Esta cosecha",
      `<span id="g-cafes">${en ? "Three coffees. <em>Two farms and a blend.</em>" : "Tres cafés. <em>Dos fincas y un blend.</em>"}</span>`,
      en ? "Two whole bean, one ground, all medium roast. Each bag says which farm it comes from and who checked every number."
         : "Dos en grano y uno molido, todos con tostión media. Cada bolsa dice de qué finca viene y quién comprobó cada dato.",
      `<a class="g-link" href="${ruta("tienda")}" data-act="go" data-to="tienda">${en ? "Go to the shop" : "Ir a la tienda"}</a>`)}
    <div class="g-prods">${S.productos.map((p, i) => tarjetaInicio(p, i)).join("")}</div>
    ${visible("subasta") ? `<div class="g-subasta g-io">
      <p><span class="live-dot ${a.ended ? "off" : ""}"></span><b>${t("nav_subasta")}</b>${en
        ? `${esc(tr(AU_LOTE.variedad))} from ${esc(AU_LOTE.productor)}, ${AU_LOTE.puntaje} SCA · <span class="mono" data-live-price>${usd(top ? top.p : a.start)}</span> per kg green`
        : `${esc(tr(AU_LOTE.variedad))} de ${esc(AU_LOTE.productor)}, ${AU_LOTE.puntaje} SCA · <span class="mono" data-live-price>${usd(top ? top.p : a.start)}</span> el kilo verde`}</p>
      <button class="btn sm" data-act="go" data-to="subasta">${a.ended ? t("ver_cafe") : (en ? "See the auction" : "Ver la subasta")}</button>
    </div>` : ""}
  </section>

  <section class="g-manifiesto" aria-labelledby="g-gang">
    <div class="g-manifiesto-in">
      <p class="g-kicker g-io"><span class="g-num">02</span> &nbsp; ${en ? "How we work" : "Cómo trabajamos"}</p>
      <h2 id="g-gang" class="g-io">${en ? "Not “Colombian coffee”. <em>Somebody's coffee.</em>" : "No es “café colombiano”. <em>Es el café de alguien.</em>"}</h2>
      <ol class="g-principios g-io" style="--i:1">${principios.map(([tt, d]) => `<li><b>${tt}</b><span>${d}</span></li>`).join("")}</ol>
    </div>
  </section>

  <section class="g-sub g-io" aria-labelledby="g-sus">
    <div>
      <p class="g-kicker"><span class="g-num">03</span> &nbsp; ${t("nav_suscripcion")}</p>
      <h2 id="g-sus">${en ? "If you like it, <em>we bring it every month.</em>" : "Si te gusta, <em>te lo llevamos cada mes.</em>"}</h2>
      <p>${en ? "Coffee from the harvest, filters and a new recipe every month. The first box brings the kit to brew it, and the Nandez route teaches you a method a month."
              : "Café de la cosecha, filtros y una receta nueva cada mes. La primera caja trae el kit para prepararlo, y la Ruta Nandez te enseña un método al mes."}</p>
      <button class="btn claro lg" data-act="go" data-to="suscripcion">${en ? "See the plans" : "Ver los planes"}${icono("flecha", "ico")}</button>
    </div>
    <ul class="g-planes">${PLANES.map((p) => `<li class="${p.destacado ? "hot" : ""}"><b>${esc(tx(p.nombre))}</b><span>${esc(tx(p.para))}</span><strong>${cop(p.mes)}<small>/${en ? "month" : "mes"}</small></strong></li>`).join("")}</ul>
  </section>

  ${musica(en)}

  ${visible("diario") ? `<section class="g-sec" aria-labelledby="g-diario">
    ${cabeza("05", t("nav_diario"),
      `<span id="g-diario">${en ? "What we learn <em>buying coffee.</em>" : "Lo que aprendemos <em>comprando café.</em>"}</span>`, "",
      `<a class="g-link" href="${ruta("diario")}" data-act="go" data-to="diario">${en ? "All the entries" : "Todas las entradas"}</a>`)}
    <div class="g-diario">${S.entradas.slice(0, 3).map((e, i) => `<article class="g-io" style="--i:${i}">
      <div class="ent-meta"><span class="tag">${esc(tx(e.tag))}</span><time>${fmtFecha(e.fecha)}</time></div>
      <h3>${esc(tx(e.titulo))}</h3>
      <p>${esc(String(tx(e.resumen)).replace(/^PEND\w+[:.]\s*/i, ""))}</p>
      <a class="g-link" href="${ruta("entrada", e.id)}" data-act="entrada" data-id="${e.id}">${t("leer")}</a>
    </article>`).join("")}</div>
  </section>` : ""}`;
}

/* La lista para tomar café: el reproductor de Spotify y un botón para compartirla.
   En el archivo suelto (sin conexión) el reproductor no carga, pero el enlace sí. */
function musica(en) {
  const L = CONFIG.spotify;
  if (!L || !L.playlist) return "";
  const url = `https://open.spotify.com/playlist/${L.playlist}`;
  return `<section class="g-sec g-musica" aria-labelledby="g-musica">
    <div class="g-musica-txt g-io">
      <p class="g-kicker"><span class="g-num">04</span> &nbsp; ${en ? "To go with it" : "Para acompañar"}</p>
      <h2 id="g-musica">${en ? "Music to <em>drink coffee to.</em>" : "Música para <em>tomar café.</em>"}</h2>
      <p>${en ? "A list for grinding, brewing and staying a while. Put it on, share it, and tell us what it is missing."
              : "Una lista para moler, colar y quedarse un rato. Ponla, compártela y dinos qué le falta."}</p>
      <div class="g-musica-cta">
        <button class="btn primary" data-act="compartir-lista">${en ? "Share the list" : "Compartir la lista"}</button>
        <a class="g-link" href="${url}" target="_blank" rel="noopener">${en ? "Open in Spotify" : "Abrir en Spotify"}</a>
      </div>
    </div>
    <figure class="g-musica-player g-io" style="--i:1">
      <figcaption><span class="g-eq" aria-hidden="true"><i></i><i></i><i></i></span>${en ? "Playing at Nandez" : "Sonando en Nandez"} · ${esc(L.nombre)}</figcaption>
      <iframe title="${esc(L.nombre)} · Spotify" src="https://open.spotify.com/embed/playlist/${L.playlist}?utm_source=generator&amp;theme=0"
        width="100%" height="352" frameborder="0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
    </figure>
  </section>`;
}
function compartirLista() {
  const L = CONFIG.spotify, en = UI.lang === "en", url = `https://open.spotify.com/playlist/${L.playlist}`;
  const titulo = en ? `Music to drink coffee to · ${CONFIG.marca}` : `Música para tomar café · ${CONFIG.marca}`;
  if (navigator.share) { navigator.share({ title: titulo, url }).catch(() => {}); return; }
  copiar(url);
}

/* Apunta un correo a la comunidad y le pide a la hoja la bienvenida con el bono.
   La usan el formulario del pie y el pop-up del bono: un solo camino, para que
   el código lo cree siempre la hoja (BONO en tools/correos/Codigo.gs) y nadie
   reparta descuentos por su cuenta. */
function apuntarComunidad(correo, listo) {
  enviarAviso("comunidad", { correo, consentimiento: true }).then((ok) => {
    /* solo se guarda si la hoja lo recibió: si no, no quedó apuntada en
       ninguna parte y hay que poder intentarlo otra vez */
    if (ok) { S.espera.push({ id: nextId("CM"), producto: "comunidad", correo, fecha: isoToday(), consentimiento: true }); save(); popPausa(POP_MIEMBRO); }
    listo(ok);
  });
}

/* La comunidad: un correo y listo. Se guarda como las listas de espera. */
function unirseComunidad() {
  const en = UI.lang === "en", el = $("#com-mail"), correo = (el?.value || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { toast(en ? "Check the email." : "Revisa el correo.", { type: "err" }); el?.focus(); return; }
  /* La Ley 1581 pide autorización previa y expresa para enviar publicidad: sin la casilla, no se registra */
  const ok = $("#com-ok");
  if (ok && !ok.checked) { toast(en ? "Tick the box to receive our emails." : "Marca la casilla para recibir nuestros correos.", { type: "err" }); ok.focus(); return; }
  /* Con la hoja conectada, queda registrado ahí mismo y el script le manda la bienvenida con el bono.
     Nunca se abre el correo: si falla, se puede intentar otra vez. */
  if (CONFIG.registro) {
    const btn = $('[data-form="comunidad"] button[type="submit"]'); if (btn) btn.disabled = true;
    apuntarComunidad(correo, (listo) => {
      if (btn) btn.disabled = false;
      if (!listo) return toast(en ? "It did not save. Try again in a moment." : "No se pudo guardar. Intenta otra vez en un momento.", { type: "err" });
      el.value = ""; if (ok) ok.checked = false;
      popCerrar(false);
      toast(en ? `You are in. Check your inbox: your ${BONO_PCT} % welcome code is there.` : `Ya eres parte. Revisa tu correo: ahí está tu bono del ${BONO_PCT} %.`);
    });
    return;
  }
  S.espera.push({ id: nextId("CM"), producto: "comunidad", correo, fecha: isoToday(), consentimiento: true }); save();
  el.value = ""; if (ok) ok.checked = false;
  registrar("comunidad", { correo, consentimiento: true },
    en ? `Hi, I want to join the ${CONFIG.comunidad} community and I agree to receive news and offers by email. My email: ${correo}`
       : `Hola, quiero unirme a la comunidad ${CONFIG.comunidad} y acepto recibir noticias y ofertas por correo. Mi correo: ${correo}`,
    en ? `Community: ${correo}` : `Comunidad: ${correo}`);
}

/* ---------- el pop-up: el bono para quien llega, la novedad para quien ya es miembro ----------
   Lo más importante es recoger el correo, así que sale pronto (a los POP_ESPERA
   de la primera visita) y en el centro de la pantalla, con un velo detrás:
   en una esquina se pasaba por alto. Nunca va encima del carrito.
   - Quien no se ha registrado ve el bono. Lo crea la hoja y llega por correo:
     aquí no se inventa un descuento ni se reparte ningún código.
     Si lo cierra sin registrarse, vuelve en POP_CERRADO días.
   - Quien ya es miembro lo vuelve a ver cada POP_MIEMBRO días, con lo nuevo:
     el próximo drop si ya tiene fecha, o el próximo café, con un "Avísame"
     de un toque con el correo que ya dejó. Si no hay nada nuevo, no sale.
   No va en el HTML armado: lo pinta el navegador, así que los buscadores no lo ven. */
const POP_KEY = "nandez-bono-pop";
const POP_ESPERA = 3000;    /* a los 3 s: con la carga, nunca pasa de 5 */
const POP_CERRADO = 7;      /* lo cerró sin registrarse: vuelve en una semana */
const POP_MIEMBRO = 30;     /* ya es miembro: una novedad al mes */

const popPausa = (dias) => { try { localStorage.setItem(POP_KEY, JSON.stringify({ hasta: Date.now() + dias * 864e5 })); } catch {} };
const popPausado = () => { try { const v = JSON.parse(localStorage.getItem(POP_KEY)); return !!(v && Date.now() < v.hasta); } catch { return false; } };
/* el correo con que se registró en este navegador, si ya es miembro */
const popMiembro = () => S.espera.find((e) => (e.producto === "comunidad" || e.producto === "gang") && e.consentimiento)?.correo || "";

/* Lo nuevo para un miembro: el drop con fecha por venir, o el primer café
   "próximamente" que todavía no pidió que le avisaran */
function popNovedad() {
  const f = dropFecha();
  if (visible("drop") && f && f > new Date() && !dropAgotado()) return { tipo: "drop" };
  const p = S.productos.find((x) => x.proximamente && !S.espera.some((e) => e.producto === x.id));
  return p ? { tipo: "cafe", p } : null;
}

/* Hay dos clases de "no": las de aquí no cambian durante la visita, así que
   cuando una se cumple se deja de vigilar. */
function popSobra() {
  /* Sin la hoja conectada no hay dónde guardar el correo ni bono que prometer */
  if (!CONFIG.registro || popPausado()) return true;
  if (popMiembro()) return !popNovedad();
  return !!UI.bono;                                              /* ya tiene uno puesto en el carrito */
}
/* Las de aquí son del momento: se espera y se vuelve a mirar. */
const popEstorba = () => UI.view === "gang"                      /* esa página ES este registro */
  || !!document.querySelector("dialog[open]");                   /* el carrito o un modal manda */

function popVigilar() {
  if (popSobra() || $("#g-pop")) return;
  const intentar = () => {
    if ($("#g-pop") || popSobra()) return;
    if (popEstorba()) return void setTimeout(intentar, 2000);
    if (popMiembro()) popAbrirNovedad(popNovedad()); else popAbrir();
  };
  setTimeout(intentar, POP_ESPERA);
}

/* Va en el centro, con un velo detrás: en una esquina pasaba de largo.
   Tocar el velo lo cierra, igual que la ✕ y Escape. */
function popMontar(el) {
  const velo = document.createElement("div");
  velo.className = "g-pop-velo"; velo.id = "g-pop-velo"; velo.dataset.act = "pop-no";
  document.body.append(velo, el);
  requestAnimationFrame(() => velo.classList.add("in"));
  popPiso();
  /* el foco no se roba: la visita estaba leyendo. Entra solo al tabular */
  requestAnimationFrame(() => el.classList.add("in"));
}

function popAbrir() {
  const en = UI.lang === "en";
  const el = document.createElement("aside");
  el.className = "g-pop"; el.id = "g-pop";
  el.setAttribute("aria-label", en ? `${BONO_PCT} % off your first order` : `${BONO_PCT} % en tu primer pedido`);
  el.innerHTML = `<button class="g-pop-x" data-act="pop-no" aria-label="${en ? "Close" : "Cerrar"}">✕</button>
    <p class="g-pop-pct"><b>${BONO_PCT} %</b><span>${en ? "off your <br>first order" : "en tu <br>primer pedido"}</span></p>
    <div class="g-pop-dice">
      <h2>${en ? `Join <em>${esc(CONFIG.comunidad)}</em>` : `Entra a <em>${esc(CONFIG.comunidad)}</em>`}</h2>
      <p>${en ? "Your code lands in your inbox, and you hear about every drop, new coffee and event before anyone else."
              : "Tu bono te llega al correo, y te enteras de cada drop, café nuevo y evento antes que nadie."}</p>
      <form data-form="pop" novalidate>
        <label class="lbl" for="pop-mail">${en ? "Email" : "Correo electrónico"}</label>
        <div class="g-pop-fila">
          <input id="pop-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="${en ? "you@email.com" : "tu@correo.com"}">
          <button class="btn primary" type="submit">${en ? "Get my code" : "Quiero mi bono"}</button>
        </div>
        <label class="g-pop-ok"><input type="checkbox" id="pop-ok"> <span>${en ? `I agree to receive news and offers from ${esc(CONFIG.marca)} by email.` : `Acepto recibir noticias y ofertas de ${esc(CONFIG.marca)} por correo.`}</span></label>
        <small>${en ? "One use, 30 days." : "Un solo uso, 30 días."} <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">${en ? "Privacy policy" : "Política de privacidad"}</a></small>
      </form>
    </div>`;
  popMontar(el);
}

/* Para quien ya es miembro: lo nuevo, una vez al mes. El mes se cuenta desde que
   sale, no desde que lo cierra, para que no aparezca en cada visita. */
function popAbrirNovedad(n) {
  if (!n) return;
  const en = UI.lang === "en", correo = popMiembro();
  popPausa(POP_MIEMBRO);
  const el = document.createElement("aside");
  el.className = "g-pop g-pop-nuevo"; el.id = "g-pop";
  let dice;
  if (n.tipo === "drop") {
    const f = dropFechaGang() || dropFecha();
    el.setAttribute("aria-label", `Drop ${D().n}`);
    dice = `<h2>Drop ${esc(D().n)} ${en ? "is coming" : "ya viene"}</h2>
      <p>${en ? `It opens for ${esc(CONFIG.comunidad)} on ${fmtFecha(f.toISOString())} at ${horaDe(f)}, before everyone else.`
              : `Abre para ${esc(CONFIG.comunidad)} el ${fmtFecha(f.toISOString())} a las ${horaDe(f)}, antes que para todos.`}</p>
      <a class="btn primary" href="${ruta("drop")}" data-act="go" data-to="drop">${en ? "See the drop" : "Ver el drop"}</a>`;
  } else {
    const p = n.p;
    el.setAttribute("aria-label", tx(p.nombre));
    dice = `<h2>${en ? `New from <em>${esc(CONFIG.marca)}</em>` : `Lo nuevo de <em>${esc(CONFIG.marca)}</em>`}</h2>
      <p>${en ? `<b>${esc(tx(p.nombre))}</b> is on its way. We will let you know at ${esc(correo)} the day it comes out, before anyone else.`
              : `<b>${esc(tx(p.nombre))}</b> ya viene en camino. Te avisamos a ${esc(correo)} el día que salga, antes que a nadie.`}</p>
      <div class="g-pop-fila"><button class="btn primary" data-act="pop-avisame" data-id="${p.id}">${t("avisame")}</button>
        <a class="btn" href="${ruta("cafe", p.id)}" data-act="cafe" data-id="${p.id}">${en ? "See the coffee" : "Ver el café"}</a></div>`;
  }
  el.innerHTML = `<button class="g-pop-x" data-act="pop-no" aria-label="${en ? "Close" : "Cerrar"}">✕</button>
    <p class="g-pop-pct"><b>${en ? "New" : "Nuevo"}</b><span>${esc(CONFIG.comunidad)}</span></p>
    <div class="g-pop-dice">${dice}</div>`;
  popMontar(el);
}
/* "Avísame" de un toque: el correo ya lo dejó al registrarse */
function popAvisame(id) {
  const p = prodById(id), correo = popMiembro(), en = UI.lang === "en", btn = $('[data-act="pop-avisame"]');
  if (!p || !correo) return;
  if (btn) btn.disabled = true;
  enviarAviso("espera", { producto: tx(p.nombre), correo }).then((ok) => {
    if (!ok) { if (btn) btn.disabled = false; return toast(en ? "It did not save. Try again in a moment." : "No se pudo guardar. Intenta otra vez en un momento.", { type: "err" }); }
    S.espera.push({ id: nextId("LE"), producto: p.id, correo, fecha: isoToday() }); save();
    const caja = $("#g-pop .g-pop-dice");
    if (caja) caja.innerHTML = `<h2>${en ? "Done" : "Listo"}</h2><p>${en ? `You will be among the first to know when ${esc(tx(p.nombre))} is out.` : `Vas a ser de los primeros en saber cuándo sale ${esc(tx(p.nombre))}.`}</p>`;
    setTimeout(() => popCerrar(false), 4000);
  });
}
/* La bandeja del carrito también vive abajo y crece cuando el texto se parte
   en dos líneas: el pop-up se acomoda encima midiéndola, no a una altura fija
   que un día deja de alcanzar. La llama renderTray() cada vez que cambia. */
function popPiso() {
  const el = $("#g-pop"), tr = $("#tray");
  if (!el) return;
  const alto = tr && !tr.hidden ? tr.getBoundingClientRect().height : 0;
  el.style.setProperty("--g-pop-piso", (alto ? alto + 12 : 0) + "px");
}

/* Si cierra el del bono sin registrarse, vuelve en POP_CERRADO días. El de la
   novedad ya contó su mes al salir, así que cerrarlo no cambia nada. */
function popCerrar(recordar = true) {
  const el = $("#g-pop"); if (!el) return;
  if (recordar && !el.classList.contains("g-pop-nuevo")) popPausa(POP_CERRADO);
  const velo = $("#g-pop-velo");
  el.classList.remove("in"); velo?.classList.remove("in");
  setTimeout(() => { el.remove(); velo?.remove(); }, 320);
}

function popApuntar() {
  const en = UI.lang === "en", el = $("#pop-mail"), correo = (el?.value || "").trim(), ok = $("#pop-ok");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { toast(en ? "Check the email." : "Revisa el correo.", { type: "err" }); el?.focus(); return; }
  /* La Ley 1581 pide la casilla antes de escribirle a nadie */
  if (ok && !ok.checked) { toast(en ? "Tick the box to receive our emails." : "Marca la casilla para recibir nuestros correos.", { type: "err" }); ok.focus(); return; }
  const btn = $('[data-form="pop"] button[type="submit"]'); if (btn) btn.disabled = true;
  apuntarComunidad(correo, (listo) => {
    if (!listo) { if (btn) btn.disabled = false; return toast(en ? "It did not save. Try again in a moment." : "No se pudo guardar. Intenta otra vez en un momento.", { type: "err" }); }
    const caja = $("#g-pop .g-pop-dice");
    if (caja) caja.innerHTML = `<h2>${en ? "You are in" : "Ya eres parte"}</h2>
      <p>${en ? `Check your inbox: your ${BONO_PCT} % code is there, ready for your first order.`
              : `Revisa tu correo: ahí está tu bono del ${BONO_PCT} %, listo para tu primer pedido.`}</p>`;
    setTimeout(() => popCerrar(false), 5000);
  });
}

/* Íconos de las redes. Si la dirección no está, el ícono se ve pero no lleva a ningún lado. */
const REDES = {
  instagram: ["Instagram", '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/>'],
  facebook: ["Facebook", '<path d="M14 21v-7.5h2.6l.4-3H14V8.6c0-.9.3-1.5 1.6-1.5H17V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8.3v3H11V21"/>'],
  youtube: ["YouTube", '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.2 5 2.8-5 2.8Z" fill="currentColor"/>'],
};
const redesHTML = () => `<div class="g-redes-fila"><ul class="g-redes">${Object.entries(REDES).map(([k, [nombre, svg]]) => {
  const url = CONFIG.redes[k], ic = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>`;
  return `<li>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${nombre}">${ic}</a>`
                    : `<span aria-label="${nombre} (${t("por_confirmar").toLowerCase()})" title="${nombre} · ${t("por_confirmar")}">${ic}</span>`}</li>`;
}).join("")}</ul>${Object.values(CONFIG.redes).some(Boolean) ? "" : `<small>${UI.lang === "en" ? "Socials coming soon" : "Muy pronto en redes"}</small>`}</div>`;

const FOOT = () => {
  const en = UI.lang === "en";
  const politicas = [["privacidad", en ? "Privacy policy" : "Política de privacidad"], ["envios", en ? "Refund policy" : "Política de reembolso"],
    ["contacto", en ? "Contact information" : "Información de contacto"], ["terminos", en ? "Terms of service" : "Términos del servicio"]];
  const tienda = [["tienda", t("nav_tienda")], ["cafes", t("nav_cafes_esp")], ["accesorios", t("nav_accesorios")], ["suscripcion", t("nav_suscripcion")]]
    .concat(visible("drops") ? [["drops", t("nav_drops")], ["gang", t("nav_gang")]] : []);
  const lista = (items) => items.map(([v, txt]) => `<a href="${ruta(v)}" data-act="go" data-to="${v}">${txt}</a>`).join("");
  /* En la página de la gang el registro ya está arriba: dos formularios de correo
     en la misma página se pelean entre ellos, así que el del pie no se repite. */
  const comunidad = UI.view === "gang" ? "" : `<section class="g-comunidad" aria-labelledby="g-comunidad">
    <div>
      <h2 id="g-comunidad">${en ? `Join the <em>${esc(CONFIG.comunidad)}</em> community` : `Únete a la comunidad <em>${esc(CONFIG.comunidad)}</em>`}</h2>
      <p>${CONFIG.registro
        ? (en ? `Get the latest news, members-only offers and ${BONO_PCT} % off your first order.` : `Recibe las últimas noticias, ofertas solo para miembros y ${BONO_PCT} % menos en tu primer pedido.`)
        : (en ? "Get the latest news and members-only offers." : "Recibe las últimas noticias y ofertas solo para miembros.")}</p>
    </div>
    <form class="g-comunidad-form" data-form="comunidad" novalidate>
      <label class="lbl" for="com-mail">${en ? "Email" : "Correo electrónico"}</label>
      <div><input id="com-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="${en ? "you@email.com" : "tu@correo.com"}">
        <button class="btn primary" type="submit">${en ? "Join" : "Unirme"}${icono("flecha", "ico")}</button></div>
      <label class="g-consiente"><input type="checkbox" id="com-ok"> <span>${en ? `I agree to receive news and offers from ${esc(CONFIG.marca)} by email.` : `Acepto recibir noticias y ofertas de ${esc(CONFIG.marca)} por correo.`}</span></label>
      <small>${en ? "No spam. Unsubscribe whenever you like." : "Sin spam. Te sales cuando quieras."} <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">${en ? "Privacy policy" : "Política de privacidad"}</a></small>
    </form>
  </section>`;
  return `${comunidad}
  <footer class="foot">
  <div class="foot-marca"><b>${esc(CONFIG.marca)}</b><span>Chinácota · ${esc(tx(CONFIG.lugar))}</span>
    <a href="mailto:${CONFIG.correo}">${esc(CONFIG.correo)}</a>${CONFIG.whatsapp ? `<a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">WhatsApp +${CONFIG.whatsapp}</a>` : ""}
    ${redesHTML()}</div>
  <nav class="foot-links" aria-labelledby="pie-tienda"><p class="foot-tit" id="pie-tienda">${en ? "Catalogue" : "Catálogo"}</p>${lista(tienda)}</nav>
  <nav class="foot-links" aria-labelledby="pie-ayuda"><p class="foot-tit" id="pie-ayuda">${en ? "Help" : "Ayuda"}</p>${lista(politicas)}</nav>
  <div class="foot-fin">
    <p class="g-wordmark" aria-hidden="true"><b>Nandez</b><small>${esc(CONFIG.gang)}</small></p>
    <small class="foot-nota">© ${new Date().getFullYear()} ${esc(CONFIG.marca)} · Chinácota · ${esc(tx(CONFIG.lugar))}</small>
    ${demo() ? `<button class="btn sm" data-act="reset-demo">${en ? "Reset demo data" : "Reiniciar datos de la demo"}</button>` : ""}
  </div></footer>`;
};

const VIEWS = { inicio: viewInicio, tienda: viewTienda, accesorios: viewAccesorios, cafes: viewCafes, cafe: viewCafe, subasta: viewSubasta, suscripcion: viewSuscripcion, diario: viewDiario, entrada: viewEntrada,
  drops: viewDrops, drop: viewDrop, gang: viewGang,
  contacto: viewContacto, envios: viewEnvios, terminos: viewTerminos, privacidad: viewPrivacidad, noencontrada: viewNoEncontrada };

function actualizarMeta() {
  const id = UI.view === "cafe" ? UI.cafe : UI.view === "entrada" ? UI.entrada : null;
  const M = meta(UI.view, id), url = CONFIG.sitio + ruta(UI.view, id);
  document.title = M.t;
  const set = (sel, attr, val) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, val); };
  set('meta[name="description"]', "content", M.d);
  set('link[rel="canonical"]', "href", url);
  set('meta[property="og:title"]', "content", M.t);
  set('meta[property="og:description"]', "content", M.d);
  set('meta[property="og:url"]', "content", url);
  set('meta[property="og:locale"]', "content", UI.lang === "en" ? "en_US" : "es_CO");
  set('link[rel="alternate"][hreflang="es"]', "href", CONFIG.sitio + ruta(UI.view, id, "es"));
  set('link[rel="alternate"][hreflang="en"]', "href", CONFIG.sitio + ruta(UI.view, id, "en"));
  const ld = document.getElementById("ld-json");
  if (ld) ld.textContent = JSON.stringify(datosEstructurados(UI.view, id));
}

/* Datos estructurados: lo que leen Google y los asistentes de IA */
function datosEstructurados(view, id) {
  const org = {
    "@type": "Organization", "@id": CONFIG.sitio + "/#organizacion", name: CONFIG.marca, url: CONFIG.sitio,
    logo: CONFIG.sitio + "/img/marca/icono-512.png", image: CONFIG.sitio + "/img/marca/compartir.jpg",
    sameAs: Object.values(CONFIG.redes).filter(Boolean),
    email: CONFIG.correo, address: { "@type": "PostalAddress", addressRegion: "Norte de Santander", addressCountry: "CO" },
    description: meta("inicio").d,
  };
  const grafo = [org, { "@type": "WebSite", "@id": CONFIG.sitio + "/#sitio", url: CONFIG.sitio, name: CONFIG.marca, publisher: { "@id": org["@id"] }, inLanguage: UI.lang }];
  if (view === "inicio" && false) grafo.push({ "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: tx(f.q), acceptedAnswer: { "@type": "Answer", text: tx(f.a) } })) });
  if (view === "cafe" || view === "cafes") {
    (view === "cafe" ? [prodById(id) || S.productos[0]] : S.productos).forEach((p) => {
      const f = fincaDe(p);
      grafo.push({
        "@type": "Product", name: tx(p.nombre), description: meta("cafe", p.id).d,
        brand: { "@id": org["@id"] }, category: UI.lang === "en" ? "Specialty coffee" : "Café de especialidad",
        additionalProperty: [
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Variety" : "Variedad", value: p.variedad },
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Process" : "Proceso", value: p.proceso },
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Altitude" : "Altitud", value: (p.altitud || "—") + " msnm" },
          { "@type": "PropertyValue", name: "SCA", value: String(p.puntaje || "—") },
          { "@type": "PropertyValue", name: UI.lang === "en" ? "Farm" : "Finca", value: (f.finca || "") + ", " + (f.municipio || "") },
        ],
        offers: p.variantes.filter((v) => v.precio > 0).map((v) => ({ "@type": "Offer", name: gramos(v.g), price: v.precio, priceCurrency: "COP",
          availability: v.stock ? "https://schema.org/InStock" : "https://schema.org/PreOrder", url: CONFIG.sitio + ruta("cafe", p.id) })),
      });
    });
  }
  if (view === "entrada") {
    const e = S.entradas.find((x) => x.id === id) || S.entradas[0];
    grafo.push({ "@type": "Article", headline: tx(e.titulo), description: tx(e.resumen), datePublished: e.fecha,
      dateModified: e.fecha, author: { "@id": org["@id"] }, publisher: { "@id": org["@id"] }, inLanguage: UI.lang });
  }
  /* Las preguntas de drops, drop y gang salen en la página, visibles y abribles,
     así que se declaran. Nunca se marca una pregunta que no esté en el HTML. */
  const faqsDe = { drops: faqsDrops, drop: faqsDrop, gang: faqsGang }[view];
  if (faqsDe) grafo.push({ "@type": "FAQPage", inLanguage: UI.lang,
    mainEntity: faqsDe(UI.lang === "en").map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  /* El drop como evento de venta, solo si ya tiene fecha y precio reales:
     un Event con fecha inventada es peor que no tener ninguno. */
  if (view === "drop" && CONFIG.drop.fecha && CONFIG.drop.precio) {
    const d = CONFIG.drop, en = UI.lang === "en";
    grafo.push({ "@type": "SaleEvent", name: `Drop ${d.n} · ${CONFIG.comunidad}`,
      startDate: dropFechaGang().toISOString(), endDate: new Date(d.fecha).toISOString(),
      description: meta("drop").d, eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: dropAgotado() ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
      location: { "@type": "VirtualLocation", url: CONFIG.sitio + ruta("drop") }, organizer: { "@id": org["@id"] },
      offers: { "@type": "Offer", price: d.precio, priceCurrency: "COP",
        availability: dropAgotado() ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        url: CONFIG.sitio + ruta("drop"),
        description: en ? `${d.gramos ? gramos(d.gramos) : ""} whole bean, numbered bag`.trim() : `${d.gramos ? gramos(d.gramos) : ""} en grano, bolsa numerada`.trim() } });
  }
  if (view === "subasta") grafo.push({ "@type": "Event", name: (UI.lang === "en" ? "Geisha coffee auction · " : "Subasta de café Geisha · ") + AU_LOTE.productor, startDate: new Date(UI.au.endsAt - 7 * 24 * 3600 * 1000).toISOString(), endDate: new Date(UI.au.endsAt).toISOString(),
    offers: { "@type": "Offer", price: UI.au.start, priceCurrency: "USD", description: UI.lang === "en" ? "Starting price per kg of green coffee" : "Precio de salida por kg de café verde" },
    description: meta("subasta").d, eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: CONFIG.sitio + ruta("subasta") }, organizer: { "@id": org["@id"] } });
  return { "@context": "https://schema.org", "@graph": grafo };
}

function render(arranque) {
  const ae = document.activeElement, fid = ae && ae.id && !ae.closest("dialog") ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  document.body.dataset.view = UI.view;
  document.documentElement.lang = UI.lang;
  renderNav();
  actualizarMeta();
  const v = $("#view");
  /* La portada ya viene escrita en el HTML. Al arrancar no se reescribe:
     así la entrada se ve una sola vez y no parpadea al cargar el JavaScript. */
  const yaEscrita = arranque === true && UI.view === "inicio" && !v.classList.contains("calm") && v.querySelector(".hero");
  if (!yaEscrita) {
    v.classList.toggle("calm", !UI.animate);
    v.innerHTML = VIEWS[UI.view]() + FOOT();
  }
  if (UI.view === "subasta") updateAuction();
  renderTray(); liveBits();
  try { montarCereza(); } catch {}   // si falla la profundidad, la secuencia sigue viéndose
  try { montarReveal(); } catch {}   // si falla el observador, todo queda visible
  UI.animate = false;
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus({ preventScroll: true }); if (sel) try { n.setSelectionRange(...sel); } catch {} } }
}
/* Las piezas del inicio entran cuando llegan a la vista. Sin JavaScript o con
   "menos movimiento" están visibles desde el principio (ver html.js en gang.css). */
function montarReveal() {
  const els = document.querySelectorAll(".g-io:not(.in)");
  if (!els.length) return;
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }),
    { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
  els.forEach((e) => io.observe(e));
}
function softRefresh() { if (UI.view === "subasta") return renderNav(); render(); }
function go(view, id) {
  if (!visible(view)) view = "inicio";
  UI.view = view;
  if (view === "cafe" && id) UI.cafe = id;
  if (view === "entrada" && id) UI.entrada = id;
  UI.animate = true; closeModal(); menu(false); mas(false);
  const url = ruta(view, id || (view === "cafe" ? UI.cafe : view === "entrada" ? UI.entrada : null));
  try { if (location.pathname !== url) history.pushState({ view }, "", url); } catch {}
  render();
  try { window.scrollTo({ top: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); }
}
function menu(abrir) {
  const b = $("#menu-btn"); document.body.classList.toggle("menu-abierto", !!abrir);
  if (b) b.setAttribute("aria-expanded", String(!!abrir));
}
/* "Más", en la barra del celular: lo que no cabe en los cinco accesos */
function mas(abrir) {
  const h = $("#dock-hoja"), b = $("#dock-mas");
  if (!h) return;
  h.hidden = !abrir;
  document.body.classList.toggle("mas-abierto", !!abrir);
  if (b) b.setAttribute("aria-expanded", String(!!abrir));
}

/* La luz de la sección activa: una sola píldora que se desliza de una a otra.
   La primera vez se pone en su sitio sin animarse, para que no entre volando. */
function moverLuz() {
  const tabs = $(".tabs"), luz = tabs && tabs.querySelector(".tab-luz");
  if (!luz) return;
  const act = tabs.querySelector('.tab[aria-current="page"]');
  if (!act || !act.offsetWidth) { luz.style.opacity = "0"; return; }
  const primera = !tabs.classList.contains("con-luz");
  if (primera) luz.classList.add("quieta");
  luz.style.setProperty("--x", act.offsetLeft + "px");
  luz.style.setProperty("--w", act.offsetWidth + "px");
  luz.style.opacity = "1";
  tabs.classList.add("con-luz");
  if (primera) requestAnimationFrame(() => requestAnimationFrame(() => luz.classList.remove("quieta")));
}

/* Al bajar, la barra se aparta; al subir, vuelve. Hace falta moverse 40 px en
   la misma dirección para que cambie: un temblor del dedo no la esconde. */
function montarNav() {
  const top = $(".top"), cuerpo = document.body;
  if (!top || top.dataset.montada) return;
  top.dataset.montada = "1";
  let ultimo = Math.max(0, scrollY), acum = 0, pedido = null;
  function mirar() {
    pedido = null;
    const y = Math.max(0, scrollY), d = y - ultimo;
    ultimo = y;
    cuerpo.classList.toggle("nav-compacta", y > 24);
    const quieta = y < 140 || cuerpo.classList.contains("menu-abierto") || top.contains(document.activeElement);
    if (quieta) { acum = 0; cuerpo.classList.remove("nav-oculta"); return; }
    acum = Math.sign(d) === Math.sign(acum) ? acum + d : d;
    if (acum > 40) cuerpo.classList.add("nav-oculta");
    else if (acum < -10) cuerpo.classList.remove("nav-oculta");
  }
  addEventListener("scroll", () => { if (!pedido) pedido = requestAnimationFrame(mirar); }, { passive: true });
  top.addEventListener("focusin", () => cuerpo.classList.remove("nav-oculta"));
  /* respaldo para teclado: si Tab deja el foco en el menú, el menú se muestra */
  addEventListener("keyup", (e) => { if (e.key === "Tab" && top.contains(document.activeElement)) cuerpo.classList.remove("nav-oculta"); });
  /* con mouse, acercarse al borde de arriba la trae de vuelta */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches)
    addEventListener("mousemove", (e) => { if (e.clientY < 70) cuerpo.classList.remove("nav-oculta"); }, { passive: true });
  addEventListener("resize", moverLuz);
  document.fonts?.ready.then(moverLuz);
  /* tocar fuera de "Más" lo cierra */
  document.addEventListener("click", (e) => {
    if (cuerpo.classList.contains("mas-abierto") && !e.target.closest("#dock-hoja, #dock-mas")) mas(false);
  });
  mirar();
}

function renderNav() {
  const activa = seccionNav(UI.view);
  document.querySelectorAll(".tab-sub a[data-i18n]").forEach((x) => { x.textContent = t(x.dataset.i18n); x.setAttribute("href", ruta(x.dataset.to)); });
  document.querySelectorAll(".tab").forEach((x) => {
    x.setAttribute("aria-current", x.dataset.to === activa ? "page" : "false");
    x.setAttribute("href", ruta(x.dataset.to));
    const k = x.dataset.i18n; if (k) x.childNodes[0].nodeValue = t(k) + " ";
  });
  const n = unidadesCarrito(), b = $("#b-cart");
  if (b) { b.hidden = !n; b.textContent = n; }
  const bc = $("#cart-btn"), bn = $("#cart-n");
  if (bc) { bc.setAttribute("aria-label", (UI.lang === "en" ? "Order" : "Pedido") + (n ? ` (${n})` : "")); bc.classList.toggle("lleno", !!n); }
  if (bn) { bn.hidden = !n; bn.textContent = n; }
  $("#nav-live")?.classList.toggle("off", UI.au.ended);
  document.querySelectorAll(".dock-it[data-to]").forEach((x) => {
    x.setAttribute("aria-current", x.dataset.to === activa ? "page" : "false");
    x.setAttribute("href", ruta(x.dataset.to));
  });
  document.querySelectorAll(".dock [data-i18n]").forEach((x) => { x.textContent = t(x.dataset.i18n); });
  const dn = $("#dock-n"), dp = $("#dock-pedido");
  if (dn) { dn.hidden = !n; dn.textContent = n; }
  if (dp) dp.setAttribute("aria-label", (UI.lang === "en" ? "Order" : "Pedido") + (n ? ` (${n})` : ""));
  $("#dock-live")?.classList.toggle("off", UI.au.ended);
  moverLuz();
  document.querySelectorAll("[data-lang]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.lang === UI.lang));
}
function cambiarIdioma(l) {
  const v = $("#view"); v.classList.add("swap"); setTimeout(() => v.classList.remove("swap"), 140);
  UI.lang = l; try { localStorage.setItem("nandez-lang", l); } catch {}
  const id = UI.view === "cafe" ? UI.cafe : UI.view === "entrada" ? UI.entrada : null;
  try { history.replaceState({}, "", ruta(UI.view, id)); } catch {}
  UI.animate = true; render();
}
function liveBits() {
  const a = UI.au, top = topBid(a);
  document.querySelectorAll("[data-live-time]").forEach((el) => (el.textContent = a.ended ? t("cerrada") : restante(Math.max(0, a.endsAt - Date.now()))));
  document.querySelectorAll("[data-live-price]").forEach((el) => (el.textContent = usd(top ? top.p : a.start)));
}

/* ---------- eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
  if (el.tagName === "A") e.preventDefault();
  const { act, id } = el.dataset;
  switch (act) {
    case "go": return go(el.dataset.to);
    case "lang": return cambiarIdioma(el.dataset.lang);
    case "close": return closeModal();
    case "cafe": return go("cafe", id);
    case "entrada": return go("entrada", id);
    case "var": (UI.variante ||= {})[el.dataset.p] = +el.dataset.g; UI.animate = false; return render();
    case "add": return addCarrito(el.dataset.p, el.dataset.g);
    case "qty": return cambiarCantidad(el.dataset.p, el.dataset.g, +el.dataset.d);
    case "carrito-clear": UI.carrito = []; guardarCarrito(); renderCarrito(); return render();
    case "carrito": return abrirCarrito();
    case "quitar": return quitarDelCarrito(el.dataset.p, el.dataset.g);
    case "cart-close": return cerrarCarrito();
    case "pop-no": return popCerrar();
    case "pop-avisame": return popAvisame(el.dataset.id);
    case "pedido-wa": return pedidoWA();
    case "pedido-mp": return pedidoMP();
    case "copiar": return copiar(el.dataset.texto);
    case "cotizar": return cotizar(id);
    case "cotizar-ok": return cotizarOk();
    case "menu": return menu(!document.body.classList.contains("menu-abierto"));
    case "mas": return mas(!document.body.classList.contains("mas-abierto"));
    case "sub": return suscribir(id);
    case "sub-op": return subOpcion(el.dataset.k, el.dataset.v);
    case "sub-ok": return suscribirOk(id);
    case "bid": return myBid(+el.dataset.steps);
    case "bid-custom": return myBid(0);
    case "inscribir-ok": return inscribirOk(el.dataset.steps);
    case "au-reset": return resetAuction();
    case "remind": return avisarme(id);
    case "espera": return listaEspera(id);
    case "compartir-lista": return compartirLista();
    case "espera-ok": return listaEsperaOk(id);
    case "avisarme-ok": return avisarmeOk(id);
    case "reset-demo":
      try { localStorage.removeItem(CONFIG.storageKey); } catch {}
      S = seed(); UI.au = newAuction(); UI.carrito = []; UI.variante = null;
      return go("inicio");
  }
});
document.addEventListener("keydown", (e) => {
  const x = e.target;
  if ((e.key === "Enter" || e.key === " ") && x.getAttribute?.("role") === "button" && x.dataset.act) { e.preventDefault(); x.click(); }
  if (e.key === "Enter" && x.id === "au-custom") myBid(0);
  if (e.key === "Escape" && document.body.classList.contains("menu-abierto")) menu(false);
  if (e.key === "Escape" && document.body.classList.contains("mas-abierto")) { mas(false); $("#dock-mas")?.focus(); }
  /* Escape cierra el pop-up, como la ✕ y el velo */
  if (e.key === "Escape" && $("#g-pop")) popCerrar();
});
document.addEventListener("submit", (e) => {
  if (e.target.matches?.('[data-form="comunidad"]')) { e.preventDefault(); unirseComunidad(); }
  if (e.target.matches?.('[data-form="gang"]')) { e.preventDefault(); entrarGang(); }
  if (e.target.matches?.('[data-form="pop"]')) { e.preventDefault(); popApuntar(); }
});
$("#dlg").addEventListener("click", (e) => { if (e.target === $("#dlg")) closeModal(); });
$("#cart")?.addEventListener("click", (e) => { if (e.target === $("#cart")) cerrarCarrito(); });
$("#cart")?.addEventListener("close", () => renderTray());
window.addEventListener("popstate", () => { const r = vistaDeRuta(location.pathname); UI.view = VIEWS[r.view] ? r.view : "inicio"; if (r.id) { UI.cafe = r.id; UI.entrada = r.id; } UI.animate = true; render(); });

/* ---------- arranque ---------- */
document.documentElement.classList.add("js");
aplicarCfgGuardada();
cargarCarrito();
cargarBono();
popVigilar();
UI.au = newAuction();
UI.lang = esIngles(location.pathname) ? "en" : "es";   // manda la URL, no lo guardado
const r0 = vistaDeRuta(location.pathname);
UI.view = VIEWS[r0.view] ? r0.view : "inicio";
if (r0.id) { UI.cafe = r0.id; UI.entrada = r0.id; }
render(true);
montarNav();
cargarStock();   /* la hoja manda sobre lo que queda; si no hay hoja, no pasa nada */
setInterval(() => {
  const a = UI.au, now = Date.now();
  if (!a.ended) { botTick(a, now); if (now >= a.endsAt) { endAuction(a); renderNav(); } }
  liveBits();
  if (UI.view === "subasta") updateAuction();
}, 250);

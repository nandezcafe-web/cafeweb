/* ============================================================
   SUSCRIPCIÓN, DIARIO (blog) y páginas de confianza:
   contacto, envíos y devoluciones, términos y datos personales.
   ============================================================ */
function viewSuscripcion() {
  const en = UI.lang === "en", abierta = Object.keys(CONFIG.pagos.suscripcion).length > 0;
  const suelta = principal(S.productos[0]).precio + CONFIG.envio.costo;
  const razones = en
    ? [["Coffee has a season", "We buy each harvest once. A subscription is how we know how much to buy before the farm sells it elsewhere."],
       ["It costs you less than buying loose", `A loose bag plus shipping comes to ${cop(suelta)}. In the subscription, shipping is included.`],
       ["The farm can plan too", "Knowing how much we ship every month lets us commit volumes to the farm in advance."]]
    : [["El café tiene temporada", "Cada cosecha se compra una vez. La suscripción es como sabemos cuánto comprar antes de que la finca venda su café a otro."],
       ["Te sale mejor que suelto", `Una bolsa suelta con envío te sale en ${cop(suelta)}. En la suscripción el envío va incluido.`],
       ["La finca también puede planear", "Saber cuánto despachamos cada mes nos deja comprometerle volumen a la finca por anticipado."]];
  const como = en
    ? [["When it arrives", `We roast and ship in ${tx(CONFIG.suscripcion.despacho)}; it reaches you ${tx(CONFIG.envio.dias)} later.`],
       ["How you pay", "Each month, automatically through Mercado Pago, once the subscription opens."],
       ["How you cancel", `Write to ${CONFIG.correo} before the 25th and next month is not charged. No minimum term.`]]
    : [["Cuándo llega", `Tostamos y despachamos en ${tx(CONFIG.suscripcion.despacho)}; te llega ${tx(CONFIG.envio.dias)} después.`],
       ["Cómo pagas", "Cada mes, automático con Mercado Pago, cuando abramos la suscripción."],
       ["Cómo cancelas", `Escribes a ${CONFIG.correo} antes del día 25 y el mes siguiente ya no se cobra. Sin permanencia.`]];
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${en ? "Subscription" : "Suscripción"}${abierta ? "" : (en ? " · opening soon" : " · abrimos pronto")}</p>
        <h2 class="reveal" style="--i:1">${en ? "Coffee at your door <em>every month</em>" : "Café en tu casa <em>cada mes</em>"}</h2>
        <p class="reveal" style="--i:2">${abierta
          ? (en ? "Every month we ship the freshest lot, with its data sheet." : "Cada mes despachamos el lote más fresco, con su ficha.")
          : (en ? "We are not charging yet. Leave your email on the plan you want and we will send you the payment link the day it opens."
                : "Todavía no cobramos. Deja tu correo en el plan que quieres y te mandamos el link de pago el día que abramos.")}</p></div>
    </div>
    <div class="planes">${S.planes.map((p, i) => {
      const link = CONFIG.pagos.suscripcion[p.id];
      return `<article class="plan ${p.destacado ? "hot" : ""} reveal" style="--i:${i}">
        ${p.destacado ? `<span class="plan-tag">${en ? "Our favourite" : "El que más nos gusta"}</span>` : ""}
        <h3>${esc(tx(p.nombre))}</h3>
        <p class="plan-precio"><b class="mono">${cop(p.precio)}</b><small>${t("mes")}</small></p>
        <p class="hint">${esc(tx(p.desc))}</p>
        <ul class="plan-lista">${tx(p.incluye).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="btn ${p.destacado ? "primary" : ""}" data-act="sub" data-id="${p.id}">${link ? t("suscribirme") : (en ? "Notify me when it opens" : "Avísame cuando abra")}</button>
      </article>`;
    }).join("")}</div>
    <section class="section">
      <div class="section-head"><p class="eyebrow">${en ? "How it works" : "Cómo funciona"}</p>
        <h2>${en ? "What you get, <em>when and how to stop</em>" : "Qué recibes, <em>cuándo y cómo paras</em>"}</h2></div>
      <div class="valor">${como.map(([a, b], i) => `<div class="val" style="--i:${i}"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>
    </section>
    <section class="section">
      <div class="section-head"><p class="eyebrow">${en ? "Why we made it" : "Por qué la hicimos"}</p>
        <h2>${en ? "So you never <em>run out of coffee</em>" : "Para que no te quedes <em>sin café</em>"}</h2></div>
      <div class="valor">${razones.map(([a, b], i) => `<div class="val" style="--i:${i}"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>
    </section>`;
}

function suscribir(id) {
  const p = S.planes.find((x) => x.id === id), link = CONFIG.pagos.suscripcion[id], en = UI.lang === "en";
  if (link) return void window.open(link, "_blank", "noopener");
  modal(`${en ? "Subscription" : "Suscripción"} · <em>${esc(tx(p.nombre))}</em>`, `
    <p class="hint">${en ? "Leave your email and we will send you the payment link as soon as the subscription goes live. Nothing is charged today."
      : "Déjanos tu correo y te enviamos el link de pago apenas abramos la suscripción. Hoy no se cobra nada."}</p>
    <div class="form-grid">
      <div class="field"><label class="lbl" for="sub-mail">${en ? "Email" : "Correo"}</label><input id="sub-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" autocorrect="off" enterkeyhint="send"></div>
      <div class="field"><label class="lbl" for="sub-ciudad">${en ? "City" : "Ciudad"}</label><input id="sub-ciudad" class="input" autocomplete="address-level2"></div>
      <div class="field" style="grid-column:1/-1"><label class="lbl" for="sub-molienda">${en ? "How do you want it ground?" : "¿Cómo quieres la molienda?"}</label>
        <select id="sub-molienda" class="input">${MOLIENDAS.map((o) => `<option value="${o.id}" ${o.id === "grano" ? "selected" : ""}>${tx(o)}</option>`).join("")}</select>
        <small class="hint" style="margin:0">${en ? "Only subscribers choose the grind: each shipment is ground to order." : "Solo en la suscripción eliges la molienda: cada envío se muele a tu gusto."}</small></div>
    </div>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
      <button class="btn primary" data-act="sub-ok" data-id="${id}">${en ? "Notify me" : "Avisarme"}</button></div>`, "narrow");
}
function suscribirOk(id) {
  const mail = $("#sub-mail").value.trim(), en = UI.lang === "en";
  if (!/^\S+@\S+\.\S+$/.test(mail)) return toast(en ? "Write a valid email." : "Escribe un correo válido.", { type: "err" });
  const p = S.planes.find((x) => x.id === id), mol = MOLIENDAS.find((o) => o.id === $("#sub-molienda")?.value) || MOLIENDAS[0];
  const d = { mail, plan: id, ciudad: $("#sub-ciudad").value.trim(), molienda: mol.id, fecha: isoToday() };
  S.suscriptores.unshift(d); save(); closeModal(); render();
  registrar("suscripcion", d,
    `Hola ${CONFIG.marca}, avísenme cuando abra la suscripción.\nPlan: ${tx(p.nombre)} (${cop(p.precio)} al mes)\nMolienda: ${mol.es}\nCorreo: ${mail}${d.ciudad ? "\nCiudad: " + d.ciudad : ""}`,
    `Suscripción · ${tx(p.nombre)}`);
}

/* ---------- diario ---------- */
function viewDiario() {
  const en = UI.lang === "en";
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_diario")}</p>
        <h2 class="reveal" style="--i:1">${en ? "What we learn <em>buying coffee</em>" : "Lo que aprendemos <em>comprando café</em>"}</h2>
        <p class="reveal" style="--i:2">${en ? "Farm visits, prices, processing and how to brew what we sell."
          : "Visitas a fincas, precios, beneficio y cómo preparar lo que vendemos."}</p></div>
    </div>
    <div class="entradas">${S.entradas.map((e, i) => `<article class="entrada reveal" style="--i:${i}">
      <div class="ent-meta"><span class="tag">${esc(tx(e.tag))}</span><time>${fmtFecha(e.fecha)}</time></div>
      <h3>${esc(tx(e.titulo))}</h3>
      <p>${esc(tx(e.resumen))}</p>
      <button class="btn sm" data-act="entrada" data-id="${e.id}">${t("leer")} →</button>
    </article>`).join("")}</div>`;
}

function viewEntrada() {
  const e = S.entradas.find((x) => x.id === UI.entrada) || S.entradas[0];
  return `<article class="post">
    <button class="btn sm" data-act="go" data-to="diario">← ${t("volver")}</button>
    <div class="ent-meta"><span class="tag">${esc(tx(e.tag))}</span><time>${fmtFecha(e.fecha)}</time></div>
    <h1>${esc(tx(e.titulo))}</h1>
    <p class="lede">${esc(tx(e.resumen))}</p>
    <div class="post-body"><p>${esc(tx(e.cuerpo))}</p></div>
    <div class="espera">
      <div><h3>${UI.lang === "en" ? "Curious to taste it?" : "¿Te dio curiosidad?"}</h3>
        <p>${UI.lang === "en" ? "The coffee in this story is at home while it lasts." : "El café de esta historia está en casa mientras dure."}</p></div>
      <button class="btn primary" data-act="go" data-to="cafes">${t("nav_cafes")}</button>
    </div>
  </article>`;
}

/* ---------- contacto, envíos, términos y datos ---------- */
function paginaTexto(eyebrow, titulo, intro, bloques) {
  return `<article class="legal">
    <div class="view-head"><div><p class="eyebrow reveal">${eyebrow}</p><h2 class="reveal" style="--i:1">${titulo}</h2>
      ${intro ? `<p class="reveal" style="--i:2">${intro}</p>` : ""}</div></div>
    ${bloques.map(([h, cuerpo]) => `<section class="legal-b"><h3>${h}</h3>${cuerpo}</section>`).join("")}
  </article>`;
}
const enlace = (view, txt) => `<a href="${ruta(view)}" data-act="go" data-to="${view}">${txt}</a>`;

function viewContacto() {
  const en = UI.lang === "en", E = CONFIG.envio;
  const wa = CONFIG.whatsapp ? `<a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">+${CONFIG.whatsapp}</a>` : "";
  const mail = `<a href="mailto:${CONFIG.correo}">${CONFIG.correo}</a>`;
  return paginaTexto(en ? "Contact" : "Contacto", en ? "Write to <em>the family</em>" : "Escríbele <em>a la familia</em>",
    en ? "We are the Nandez family, coffee growers from Chinácota, Norte de Santander. We answer ourselves."
       : "Somos la familia Nandez, cafeteros de Chinácota, Norte de Santander. Contestamos nosotros mismos.",
    [[en ? "Where to find us" : "Dónde encontrarnos",
      `<p>${en ? "Email" : "Correo"}: ${mail}${wa ? `<br>WhatsApp: ${wa}` : ""}<br>${en ? "We ship from Cúcuta to all of Colombia." : "Despachamos desde Cúcuta a toda Colombia."}</p>
       <p class="hint">${en ? "PENDING: phone, address and tax ID (NIT)." : "PENDIENTE: teléfono, dirección y NIT."}</p>`],
     [en ? "Who we are" : "Quiénes somos",
      `<p>${en ? "We grow coffee in Chinácota: 5,000 Geisha plants whose first harvest comes in 2027. Meanwhile we buy the best lots from neighbouring farms in Chinácota, Toledo and Arboledas and roast them under our name."
        : "Sembramos café en Chinácota: 5.000 plantas de Geisha que dan su primera cosecha en 2027. Mientras tanto le compramos los mejores lotes a fincas vecinas de Chinácota, Toledo y Arboledas y los tostamos con nuestra marca."}</p>`],
     [en ? "Cafés and roasters" : "Cafeterías y tostadores",
      `<p>${en ? "Coffee by the kilo, volume prices and roasting to your profile." : "Café por kilos, precio por volumen y tueste a tu perfil."} ${enlace("cafes", en ? "See prices by the kilo" : "Ver precios por kilo")}.</p>`],
     [en ? "Your order" : "Tu pedido",
      `<p>${en ? `Write with your order number (it starts with NDZ). Orders arrive in ${tx(E.dias)}.` : `Escríbenos con tu número de pedido (empieza por NDZ). Los pedidos llegan en ${tx(E.dias)}.`} ${enlace("envios", en ? "Shipping and returns" : "Envíos y devoluciones")}.</p>`]]);
}

function viewEnvios() {
  const en = UI.lang === "en", E = CONFIG.envio;
  return paginaTexto(en ? "Shipping and returns" : "Envíos y devoluciones", en ? "What it costs and <em>when it arrives</em>" : "Cuánto cuesta y <em>cuándo llega</em>", "",
    [[en ? "Cost" : "Costo",
      `<p>${en ? `Shipping costs ${cop(E.costo)} anywhere in Colombia and is free on orders from ${cop(E.gratisDesde)}. You see it in the cart before giving us any data.`
        : `El envío cuesta ${cop(E.costo)} a cualquier ciudad de Colombia y es gratis en pedidos desde ${cop(E.gratisDesde)}. Lo ves en el carrito antes de darnos ningún dato.`}</p>`],
     [en ? "Time" : "Tiempo",
      `<p>${en ? `We roast in the week of your order and ship from Cúcuta with ${E.transportadora}. It arrives in ${tx(E.dias)}; rural areas can take a few days more. We send you the tracking number.`
        : `Tostamos la semana de tu pedido y despachamos desde Cúcuta por ${E.transportadora}. Llega en ${tx(E.dias)}; a zonas rurales puede tardar unos días más. Te mandamos la guía para que lo sigas.`}</p>`],
     [en ? "If something goes wrong" : "Si algo sale mal",
      `<p>${en ? `If the bag arrives broken, wet or is not what you ordered, write to ${CONFIG.correo} within 5 days of receiving it, with a photo and your order number. We send it again or refund you, at our cost.`
        : `Si la bolsa llega rota, mojada o no es lo que pediste, escríbenos a ${CONFIG.correo} dentro de los 5 días siguientes a recibirla, con una foto y tu número de pedido. Te la volvemos a enviar o te devolvemos el dinero, por nuestra cuenta.`}</p>`],
     [en ? "Returns" : "Devoluciones",
      `<p>${en ? "Coffee is food: once opened we cannot take it back. If you change your mind before we ship, we cancel the order and refund you in full."
        : "El café es un alimento: una vez abierto no lo podemos recibir de vuelta. Si te arrepientes antes de que lo despachemos, cancelamos el pedido y te devolvemos todo."}</p>`]]);
}

function viewTerminos() {
  const en = UI.lang === "en";
  return paginaTexto(en ? "Terms" : "Términos", en ? "Terms of <em>sale</em>" : "Términos y <em>condiciones</em>",
    en ? "PENDING legal review. A plain summary of how buying from us works." : "PENDIENTE de revisión legal. Resumen claro de cómo funciona comprarnos.",
    [[en ? "Who sells" : "Quién vende", `<p>${esc(CONFIG.marca)} · Chinácota, Norte de Santander, Colombia · ${CONFIG.correo}. ${en ? "PENDING: tax ID (NIT) and INVIMA sanitary registration." : "PENDIENTE: NIT y registro sanitario del INVIMA."}</p>`],
     [en ? "Prices" : "Precios", `<p>${en ? "Prices are in Colombian pesos (COP) and include VAT when it applies. Shipping is shown separately in the cart." : "Los precios están en pesos colombianos e incluyen IVA cuando aplica. El envío se muestra aparte en el carrito."}</p>`],
     [en ? "Orders and payment" : "Pedidos y pago", `<p>${en ? `An order is confirmed when we reply and you pay by ${tx(CONFIG.pagos.manual)}. If a coffee sells out before that, we tell you and do not charge you.`
        : `Un pedido queda confirmado cuando te respondemos y pagas por ${tx(CONFIG.pagos.manual)}. Si un café se agota antes, te avisamos y no te cobramos.`}</p>`],
     [en ? "Shipping and returns" : "Envíos y devoluciones", `<p>${enlace("envios", en ? "See the shipping and returns page" : "Mira la página de envíos y devoluciones")}.</p>`],
     [en ? "Subscription" : "Suscripción", `<p>${en ? `No minimum term. Write to ${CONFIG.correo} before the 25th and the next month is not charged.` : `Sin permanencia. Escribes a ${CONFIG.correo} antes del día 25 y el mes siguiente no se cobra.`}</p>`],
     [en ? "Auction" : "Subasta", `<p>${en ? "Only registered bidders may bid. A bid is a commitment to buy; the winner has 48 hours to pay, after which the lot goes to the runner-up. The lot is awarded only if it reaches the reserve price with at least 3 bidders."
        : "Solo pujan postores inscritos. Pujar es un compromiso de compra; el ganador tiene 48 horas para pagar y si no, el lote pasa al segundo postor. El lote se adjudica solo si alcanza el precio de reserva con al menos 3 postores."}</p>`]]);
}

function viewPrivacidad() {
  const en = UI.lang === "en";
  return paginaTexto(en ? "Privacy" : "Datos personales", en ? "Your data, <em>only for your order</em>" : "Tus datos, <em>solo para tu pedido</em>",
    en ? "Policy under Colombian Law 1581 of 2012. PENDING legal review." : "Política según la Ley 1581 de 2012. PENDIENTE de revisión legal.",
    [[en ? "What we ask for" : "Qué pedimos", `<p>${en ? "Name, city, WhatsApp and email: only what we need to deliver your order, answer you or let you know about the subscription and auctions."
        : "Nombre, ciudad, WhatsApp y correo: solo lo necesario para entregarte el pedido, responderte o avisarte de la suscripción y las subastas."}</p>`],
     [en ? "What we use it for" : "Para qué lo usamos", `<p>${en ? "To confirm and ship orders, register auction bidders and send the notices you asked for. We do not sell or share your data, except with the carrier that delivers your order."
        : "Para confirmar y despachar pedidos, inscribir postores en la subasta y enviarte los avisos que pediste. No vendemos ni compartimos tus datos, salvo con la transportadora que entrega tu pedido."}</p>`],
     [en ? "Your rights" : "Tus derechos", `<p>${en ? `You can ask us to see, correct or delete your data at any time by writing to ${CONFIG.correo}. We answer within 15 business days.`
        : `Puedes pedirnos conocer, corregir o borrar tus datos cuando quieras, escribiendo a ${CONFIG.correo}. Respondemos en máximo 15 días hábiles.`}</p>`],
     [en ? "Who is responsible" : "Responsable", `<p>${esc(CONFIG.marca)} · Chinácota, Norte de Santander · ${CONFIG.correo}. ${en ? "PENDING: tax ID (NIT) and address." : "PENDIENTE: NIT y dirección."}</p>`]]);
}

/* ---------- página no encontrada (404.html) ---------- */
function viewNoEncontrada() {
  const en = UI.lang === "en";
  return `<article class="legal no-encontrada">
    <div class="view-head"><div><p class="eyebrow reveal">404</p>
      <h2 class="reveal" style="--i:1">${en ? "This page <em>is not here</em>" : "Esta página <em>no está</em>"}</h2>
      <p class="reveal" style="--i:2">${en ? "Maybe the link is old or a letter is missing. The coffee is still where it was."
        : "Puede que el enlace sea viejo o le falte una letra. El café sigue donde estaba."}</p></div></div>
    <div class="cta"><button class="btn primary" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button>
      <button class="btn" data-act="go" data-to="inicio">${en ? "Home" : "Inicio"}</button>
      <button class="btn" data-act="go" data-to="contacto">${en ? "Write to us" : "Escríbenos"}</button></div>
  </article>`;
}

/* ============================================================
   SUSCRIPCIÓN, DIARIO (blog) y páginas de confianza:
   contacto, envíos y devoluciones, términos y datos personales.
   ============================================================ */
/* Las dos preguntas que cambian el precio: ¿con kit? ¿mes a mes o 6 envíos?
   Arranca en "con kit, mes a mes", que es lo que más deja por cliente; el
   pago por adelantado se ofrece al lado con su ahorro en pesos. */
const subKit = () => UI.subKit !== false;
const subSeis = () => UI.subSeis === true;
/* El link de Mercado Pago de cada combinación, cuando exista:
   CONFIG.pagos.suscripcion["semilla-kit"], ["semilla-kit-6"], ["semilla"], ["semilla-6"]… */
const claveSub = (id, kit, seis) => `${id}${kit ? "-kit" : ""}${seis ? "-6" : ""}`;

function bloquePrecio(p, en) {
  const x = precioPlan(p, subKit(), subSeis());
  if (x.hoy) return `<p class="plan-precio"><b class="mono">${cop(x.hoy)}</b><small>${en ? "sign-up: the kit and your first box" : "inscripción: el kit y tu primer envío"}</small></p>
    <p class="plan-luego">${en ? "Then" : "Luego"} <b class="mono">${cop(x.luego)}</b> ${t("mes")}</p>`;
  if (x.total) return `<p class="plan-precio"><b class="mono">${cop(x.total)}</b><small>${subKit() ? (en ? "6 boxes and the kit" : "6 envíos y el kit") : (en ? "6 boxes" : "6 envíos")}</small></p>
    <p class="plan-ahorro">${en ? "You save" : "Ahorras"} <b class="mono">${cop(x.ahorro)}</b> ${en ? "against paying monthly" : "frente a mes a mes"}</p>`;
  return `<p class="plan-precio"><b class="mono">${cop(x.luego)}</b><small>${t("mes")}</small></p>`;
}

function viewSuscripcion() {
  const en = UI.lang === "en", abierta = Object.keys(CONFIG.pagos.suscripcion).length > 0;
  const kit = subKit(), seis = subSeis();
  const op = (k, v, activo, txt) => `<button type="button" data-act="sub-op" data-k="${k}" data-v="${v}" aria-pressed="${activo}">${txt}</button>`;
  const como = en
    ? [["montana", "Every month or every two", "Choose how often it arrives, and change it whenever you like. Each box costs the same."],
       ["hoja", "Two ways to pay", "Monthly, with a one-time sign-up that brings the kit. Or six boxes paid in advance, which costs less."],
       ["ficha", "No minimum term", `Paying monthly, write to us before the 25th and next month is not charged. Six boxes paid in advance cover the six.`]]
    : [["montana", "Cada mes o cada dos", "Escoges cada cuánto te llega y lo cambias cuando quieras. Cada envío cuesta lo mismo."],
       ["hoja", "Dos formas de pagar", "Mes a mes, con una inscripción única que trae el kit. O seis envíos por adelantado, que sale más barato."],
       ["ficha", "Sin permanencia", "Mes a mes, nos escribes antes del día 25 y el mes siguiente ya no se cobra. Los seis envíos por adelantado cubren los seis."]];
  const ruta = en
    ? [["Cone dripper, the basics", "15 g, 250 ml, 93 °C, three minutes."],
       ["Grind changes the cup", "The same coffee at two grind sizes, side by side."],
       ["The greca, done right", "The Colombian home method, without bitterness."],
       ["Cold brew at home", "Just a jar and a night in the fridge."],
       ["French press", "Body and oils, the other way to taste a farm."],
       ["Cupping two farms", "Both coffees side by side, with a flavour wheel."]]
    : [["Gotero, lo básico", "15 g, 250 ml, 93 °C, tres minutos."],
       ["La molienda cambia la taza", "El mismo café con dos moliendas, lado a lado."],
       ["La greca, bien hecha", "El método de la casa colombiana, sin amargor."],
       ["Cold brew en casa", "Solo un frasco y una noche en la nevera."],
       ["Prensa francesa", "Cuerpo y aceites: otra forma de probar una finca."],
       ["Cata de dos fincas", "Los dos cafés lado a lado, con rueda de sabores."]];
  const comunidad = en
    ? ["A WhatsApp community for subscribers", "A live class every month, brewing the coffee in the box", "A passport of methods, stamped as you learn each one"]
    : ["Una comunidad de WhatsApp para suscriptores", "Una clase en vivo cada mes, preparando el café de la caja", "Un pasaporte de métodos que se sella con cada uno que aprendes"];

  return `<div class="view-head">
      <div><p class="eyebrow reveal">${en ? "Subscription" : "Suscripción"}${abierta ? "" : (en ? " · opening soon" : " · abrimos pronto")}</p>
        <h2 class="reveal" style="--i:1">${en ? "Coffee at home, <em>and how to brew it</em>" : "Café en tu casa, <em>y cómo prepararlo</em>"}</h2>
        <p class="reveal" style="--i:2">${en
          ? "The first box brings the kit to brew at home. Every month after that, coffee from our farms, its filters and a new recipe."
          : "La primera caja trae el kit para preparar en casa. Cada mes después, café de nuestras fincas, sus filtros y una receta nueva."}
          ${abierta ? "" : (en ? " We are not charging yet: leave your email and we will send you the payment link the day it opens."
                               : " Todavía no cobramos: deja tu correo y te mandamos el link de pago el día que abramos.")}</p></div>
    </div>

    <div class="sub-opciones reveal" style="--i:3">
      <div class="seg" role="group" aria-label="${en ? "Kit" : "Kit"}">
        ${op("kit", "si", kit, en ? "With the welcome kit" : "Con kit de bienvenida")}${op("kit", "no", !kit, en ? "I already have my gear" : "Ya tengo mi equipo")}
      </div>
      <div class="seg" role="group" aria-label="${en ? "How to pay" : "Cómo pagar"}">
        ${op("seis", "no", !seis, en ? "Monthly" : "Mes a mes")}${op("seis", "si", seis, en ? "6 boxes in advance" : "6 envíos por adelantado")}
      </div>
    </div>

    <div class="planes">${PLANES.map((p, i) => {
      const k = KITS[p.kit], link = CONFIG.pagos.suscripcion[claveSub(p.id, kit, seis)];
      return `<article class="plan ${p.destacado ? "hot" : ""} reveal" style="--i:${i + 4}">
        ${p.destacado ? `<span class="plan-tag">${en ? "The one we recommend" : "El que recomendamos"}</span>` : ""}
        <h3>${esc(tx(p.nombre))}</h3>
        <p class="plan-para">${esc(tx(p.para))}</p>
        ${bloquePrecio(p, en)}
        ${kit ? `<div class="plan-kit"><b>${esc(tx(k.nombre))}</b><ul>${tx(k.trae).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        <p class="plan-cada">${en ? "In every box" : "En cada envío"}</p>
        <ul class="plan-lista">${tx(p.cada).map((x) => `<li>${esc(x)}</li>`).join("")}<li>${en ? "Shipping included" : "Envío incluido"}</li></ul>
        <button class="btn ${p.destacado ? "primary" : ""}" data-act="sub" data-id="${p.id}">${link ? t("suscribirme") : (en ? "Notify me when it opens" : "Avísame cuando abra")}</button>
      </article>`;
    }).join("")}</div>

    <section class="section">
      <div class="section-head"><p class="eyebrow">${en ? "How it works" : "Cómo funciona"}</p>
        <h2>${en ? "You decide how often, <em>and how to pay</em>" : "Tú decides cada cuánto <em>y cómo pagas</em>"}</h2></div>
      <div class="principios">${como.map(([ic, a, b]) => `<div class="principio">${icono(ic)}<b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>
    </section>

    <section class="section">
      <div class="section-head"><p class="eyebrow">${en ? "The Nandez route" : "La Ruta Nandez"}</p>
        <h2>${en ? "Six months, <em>six ways to brew</em>" : "Seis meses, <em>seis formas de preparar</em>"}</h2>
        <p>${en ? "Every box brings a card with the month's recipe and a QR code to a short video. After the sixth, the route goes on with new lots and other methods."
                : "Cada caja trae una tarjeta con la receta del mes y un código QR a un video corto. Después del sexto, la ruta sigue con lotes nuevos y otros métodos."}</p></div>
      <ol class="ruta">${ruta.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ol>
      <ul class="ruta-comunidad">${comunidad.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </section>

    <section class="section">
      <div class="section-head"><p class="eyebrow">${en ? "For cafés" : "Para cafeterías"}</p>
        <h2>${en ? "Your house coffee, <em>every month</em>" : "El café de tu barra, <em>cada mes</em>"}</h2></div>
      <article class="plan plan-cafeteria">
        <h3>${esc(tx(CAFETERIA.nombre))}</h3>
        <p class="plan-precio"><b class="mono">${cop(CAFETERIA.mes)}</b><small>${t("mes")}</small></p>
        <p class="hint">${esc(tx(CAFETERIA.desc))}</p>
        <ul class="plan-lista">${tx(CAFETERIA.incluye).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="btn" data-act="sub" data-id="${CAFETERIA.id}">${CONFIG.pagos.suscripcion[CAFETERIA.id] ? t("suscribirme") : (en ? "Notify me when it opens" : "Avísame cuando abra")}</button>
      </article>
    </section>`;
}

function subOpcion(k, v) {
  if (k === "kit") UI.subKit = v === "si";
  if (k === "seis") UI.subSeis = v === "si";
  UI.animate = false;
  render();
}

function suscribir(id) {
  const en = UI.lang === "en", casa = PLANES.find((x) => x.id === id), p = casa || CAFETERIA;
  const kit = casa ? subKit() : false, seis = casa ? subSeis() : false;
  const link = CONFIG.pagos.suscripcion[casa ? claveSub(id, kit, seis) : id];
  if (link) return void window.open(link, "_blank", "noopener");
  const x = casa ? precioPlan(p, kit, seis) : { luego: p.mes };
  const resumen = casa
    ? `${esc(tx(p.nombre))} · ${kit ? esc(tx(KITS[p.kit].nombre)) : (en ? "no kit" : "sin kit")} · ${seis ? (en ? "6 boxes in advance" : "6 envíos por adelantado") : (en ? "monthly" : "mes a mes")}<br>
       <b class="mono">${x.hoy ? `${cop(x.hoy)} ${en ? "today, then" : "hoy, luego"} ${cop(x.luego)} ${t("mes")}` : x.total ? `${cop(x.total)} ${en ? "in one payment" : "en un solo pago"}` : `${cop(x.luego)} ${t("mes")}`}</b>`
    : `${esc(tx(p.nombre))} · <b class="mono">${cop(p.mes)} ${t("mes")}</b>`;
  const mol = casa ? p.molienda : "grano";
  modal(`${en ? "Subscription" : "Suscripción"} · <em>${esc(tx(p.nombre))}</em>`, `
    <p class="sub-resumen">${resumen}</p>
    <p class="hint">${en ? "Leave your email and we will send you the payment link as soon as the subscription goes live. Nothing is charged today."
      : "Déjanos tu correo y te enviamos el link de pago apenas abramos la suscripción. Hoy no se cobra nada."}</p>
    <div class="form-grid">
      <div class="field"><label class="lbl" for="sub-mail">${en ? "Email" : "Correo"}</label><input id="sub-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" autocorrect="off" enterkeyhint="send"></div>
      <div class="field"><label class="lbl" for="sub-ciudad">${en ? "City" : "Ciudad"}</label><input id="sub-ciudad" class="input" autocomplete="address-level2"></div>
      ${casa ? `<div class="field"><label class="lbl" for="sub-cada">${en ? "How often?" : "¿Cada cuánto?"}</label>
        <select id="sub-cada" class="input"><option value="1">${en ? "Every month" : "Cada mes"}</option><option value="2">${en ? "Every two months" : "Cada dos meses"}</option></select></div>` : ""}
      <div class="field"><label class="lbl" for="sub-molienda">${en ? "How do you want it ground?" : "¿Cómo quieres la molienda?"}</label>
        <select id="sub-molienda" class="input">${MOLIENDAS.map((o) => `<option value="${o.id}" ${o.id === mol ? "selected" : ""}>${tx(o)}</option>`).join("")}</select></div>
      <small class="hint" style="grid-column:1/-1;margin:0">${en ? "Only subscribers choose the grind: each box is ground to order." : "Solo en la suscripción eliges la molienda: cada envío se muele a tu gusto."}</small>
    </div>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
      <button class="btn primary" data-act="sub-ok" data-id="${id}">${en ? "Notify me" : "Avisarme"}</button></div>`, "narrow");
}

function suscribirOk(id) {
  const mail = $("#sub-mail").value.trim(), en = UI.lang === "en";
  if (!/^\S+@\S+\.\S+$/.test(mail)) return toast(en ? "Write a valid email." : "Escribe un correo válido.", { type: "err" });
  const casa = PLANES.find((x) => x.id === id), p = casa || CAFETERIA;
  const kit = casa ? subKit() : false, seis = casa ? subSeis() : false;
  const mol = MOLIENDAS.find((o) => o.id === $("#sub-molienda")?.value) || MOLIENDAS[0];
  const cada = $("#sub-cada")?.value === "2" ? 2 : 1;
  const x = casa ? precioPlan(p, kit, seis) : { luego: p.mes };
  const d = { mail, plan: id, kit, seis, cada, ciudad: $("#sub-ciudad").value.trim(), molienda: mol.id, fecha: isoToday() };
  S.suscriptores.unshift(d); save(); closeModal(); render();
  const pago = x.hoy ? `${cop(x.hoy)} de inscripción y luego ${cop(x.luego)} al mes`
    : x.total ? `${cop(x.total)} por 6 envíos` : `${cop(x.luego)} al mes`;
  registrar("suscripcion", d,
    `Hola ${CONFIG.marca}, avísenme cuando abra la suscripción.\nPlan: ${tx(p.nombre)}` +
    (casa ? `\nKit: ${kit ? tx(KITS[p.kit].nombre) : "ya tengo mi equipo"}\nForma de pago: ${seis ? "6 envíos por adelantado" : "mes a mes"}\nFrecuencia: ${cada === 2 ? "cada dos meses" : "cada mes"}` : "") +
    `\nValor: ${pago}\nMolienda: ${mol.es}\nCorreo: ${mail}${d.ciudad ? "\nCiudad: " + d.ciudad : ""}`,
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

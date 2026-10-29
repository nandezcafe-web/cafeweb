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
  const op = (k, v, activo, txt) => `<button type="button" id="sub-${k}-${v}" data-act="sub-op" data-k="${k}" data-v="${v}" aria-pressed="${activo}">${txt}</button>`;
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
        <h1 class="reveal" style="--i:1">${en ? "For your bar, <em>and for your house</em>" : "Para tu barra, <em>y para tu casa</em>"}</h1>
        <p class="reveal" style="--i:2">${en
          ? "Kilos for cafés, roasted to your profile, with shipping included. And boxes for home, with the filters and a new recipe every month."
          : "Kilos para cafeterías, con la tostión a tu perfil y el envío incluido. Y cajas para la casa, con los filtros y una receta nueva cada mes."}
          ${abierta ? "" : (en ? " We are not charging yet: leave your email and we will send you the payment link the day it opens."
                               : " Todavía no cobramos: deja tu correo y te mandamos el link de pago el día que abramos.")}</p></div>
    </div>

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
    </section>

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
`;
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
/* ============================================================
   DROPS Y LA GANG
   Un drop es un lote pequeño que sale un día, a una hora, y se acaba.
   Las dos páginas son el destino del "link en la bio": acá llega la gente
   de Instagram y de TikTok. Por eso cada una empieza diciendo en texto
   plano qué vendemos —"café de especialidad en grano de fincas de Norte
   de Santander, en lotes numerados"—: así un asistente que resuma la
   página cita eso, y no deduce de la jerga.
   Ningún dato del drop se escribe a mano acá: todo sale de CONFIG.drop,
   y lo que falte se muestra como "por confirmar".
   ============================================================ */

/* El estado del drop en una palabra, para la cejilla y el aviso */
function dropEstado(en) {
  if (dropAgotado()) return en ? "sold out" : "agotado";
  if (dropAbierto()) return en ? "open now" : "abierto";
  const f = dropFecha();
  return f ? (en ? "out " : "sale el ") + fmtFecha(CONFIG.drop.fecha) : (en ? "date to be confirmed" : "fecha por confirmar");
}

/* Cuántas bolsas y a cuánto. Sin los datos, lo dice. */
function dropCifras(en) {
  const d = CONFIG.drop;
  return [
    [en ? "Bags in the lot" : "Bolsas del lote", d.bolsas ? fmtNum(d.bolsas) : t("por_confirmar")],
    [en ? "Size" : "Presentación", d.gramos ? gramos(d.gramos) + " · " + t("en_grano").toLowerCase() : t("en_grano")],
    [en ? "Price" : "Precio", d.precio ? cop(d.precio) : t("por_confirmar")],
    [en ? "Opens for the gang" : "Abre para la gang", dropFechaGang() ? fmtFecha(dropFechaGang().toISOString()) + " · " + horaDe(dropFechaGang()) : t("por_confirmar")],
    [en ? "Opens for everyone" : "Abre para todos", dropFecha() ? fmtFecha(d.fecha) + " · " + horaDe(dropFecha()) : t("por_confirmar")],
  ];
}
const horaDe = (f) => f.toLocaleTimeString(UI.lang === "en" ? "en-US" : "es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });

/* Qué trae cada bolsa: el reporte del plug. Si el café del lote ya está
   confirmado, los datos salen de su ficha; si no, cada fila dice que falta. */
function reporteDelPlug(en) {
  const p = dropCafe(), f = p ? fincaDe(p) : null, d = CONFIG.drop;
  const dato = (v) => (conocido(v) && v ? esc(String(v)) : `<i class="pend">${t("por_confirmar")}</i>`);
  const filas = [
    [en ? "Farm" : "Finca", f && tr(f.finca)],
    [en ? "Grown by" : "Lo cultivó", f && tr(f.productor)],
    [en ? "Town" : "Municipio", f && f.municipio && f.municipio + ", Norte de Santander"],
    [en ? "Altitude" : "Altura", p && p.altitud && msnm(p.altitud)],
    [en ? "Variety" : "Variedad", p && p.variedad],
    [en ? "Process" : "Proceso", p && p.proceso],
    [en ? "Notes" : "Notas", p && tx(p.notas).join(", ")],
    [en ? "SCA score" : "Puntaje SCA", p && p.puntaje],
    [en ? "Roasted on" : "Tostado el", d.tostion && fmtFecha(d.tostion)],
  ];
  return `<table class="ficha-tabla">
    <tbody>${filas.map(([k, v]) => `<tr><th scope="row">${k}</th><td class="fv">${dato(v)}</td></tr>`).join("")}</tbody></table>`;
}

/* Las preguntas de los drops. Son las que la gente escribe en el buscador
   y las que un asistente responde citando la página. */
function faqsHTML(items, en) {
  return `<section class="section faqs g-sec">
    <div class="section-head"><p class="eyebrow">${en ? "Questions" : "Preguntas"}</p>
      <h2>${en ? "What people <em>ask us</em>" : "Lo que <em>nos preguntan</em>"}</h2>
      <p class="faq-ayuda">${en ? "Is your question not here?" : "¿No está tu pregunta?"}
        <a href="${ruta("contacto")}" data-act="go" data-to="contacto">${en ? "Write to us" : "Escríbenos"}</a></p></div>
    <div class="faq-lista">${items.map(([q, a], i) => `<details class="faq"${i === 0 ? " open" : ""}><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join("")}</div>
  </section>`;
}

/* Las preguntas de cada página, aparte: la vista las pinta y datosEstructurados()
   las declara como FAQPage desde la misma lista. Nunca se marca una pregunta que
   no esté visible en la página. */
function faqsDrops(en) {
  const d = CONFIG.drop;
  return en
    ? [["What is a coffee drop?", "A drop is a small lot of coffee from a single farm that goes on sale on one day, at one hour, in a fixed number of numbered bags. When those bags run out, that lot is not roasted again. It works like a sneaker release: the date and the quantity are announced beforehand and nothing is restocked."],
       ["Why do you sell in drops instead of having coffee all year?", "Because we buy one lot at a time from a farm we visit, and a lot is finite: a farm in Norte de Santander does not produce the same coffee every month. Selling the lot as a drop lets us tell you exactly which harvest you are drinking instead of mixing lots to keep a shelf full."],
       ["How do I know when the next drop is?", `We announce it on Instagram and we tell the gang first. People in the gang get the link ${d.ventaja} hours before it opens to everyone.`],
       ["Can I buy a coffee from a past drop?", "No. Each lot is roasted once and sold once. Coffees that stay available all the time are in the shop; drops are not restocked."]]
    : [["¿Qué es un drop de café?", "Un drop es un lote pequeño de café de una sola finca que sale a la venta un día, a una hora, en una cantidad fija de bolsas numeradas. Cuando esas bolsas se acaban, ese lote no se vuelve a tostar. Funciona como un lanzamiento de sneakers: la fecha y la cantidad se anuncian antes y no hay reposición."],
       ["¿Por qué venden en drops y no tienen café todo el año?", "Porque compramos lote por lote a fincas que visitamos, y un lote se acaba: una finca de Norte de Santander no produce el mismo café todos los meses. Vender el lote como drop nos deja decirte exactamente qué cosecha te estás tomando, en vez de mezclar lotes para tener el estante lleno."],
       ["¿Cómo me entero del próximo drop?", `Lo anunciamos en Instagram y lo avisamos primero en la gang. Quien está en la gang recibe el link ${d.ventaja} horas antes de que abra para todo el mundo.`],
       ["¿Puedo comprar un café de un drop pasado?", "No. Cada lote se tuesta una vez y se vende una vez. Los cafés que están disponibles todo el tiempo están en la tienda; los drops no se reponen."]];
}

function viewDrops() {
  const en = UI.lang === "en", d = CONFIG.drop;
  const pasos = en
    ? [["We announce the lot", "One farm, one variety, with its data sheet and how many bags came out of it."],
       ["It goes out on one day, at one hour", "The gang gets the link " + d.ventaja + " hours earlier. Then it opens for everyone."],
       ["Every bag is numbered", `Bag 027 of ${d.bolsas ? fmtNum(d.bolsas) : "the lot"}, written by hand, with the plug's report on the back.`],
       ["When it is gone, it is gone", "We do not roast that lot again. The next drop comes from another farm."]]
    : [["Anunciamos el lote", "Una finca, una variedad, con su ficha y cuántas bolsas salieron."],
       ["Sale un día y a una hora", `La gang recibe el link ${d.ventaja} horas antes. Después abre para todos.`],
       ["Cada bolsa va numerada", `Bolsa 027 de ${d.bolsas ? fmtNum(d.bolsas) : "las del lote"}, escrita a mano, con el reporte del plug al reverso.`],
       ["Cuando se acaba, se acaba", "Ese lote no se vuelve a tostar. El próximo drop viene de otra finca."]];
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_drops")} · ${dropEstado(en)}</p>
        <h1 class="reveal" style="--i:1">${en ? "We do not have coffee all year. <em>We have drops.</em>" : "No tenemos café todo el año. <em>Tenemos drops.</em>"}</h1>
        <p class="reveal" style="--i:2">${en
          ? `${esc(CONFIG.comunidad)} sells specialty whole bean coffee from farms in Norte de Santander, Colombia, in small numbered lots. Each lot goes out on one day, at one hour, and runs out.`
          : `${esc(CONFIG.comunidad)} vende café de especialidad en grano de fincas de Norte de Santander, Colombia, en lotes pequeños y numerados. Cada lote sale un día, a una hora, y se acaba.`}</p></div>
    </div>

    <section class="g-sec" aria-labelledby="dr-como">
      <div class="g-head g-io"><span class="g-num">01</span><p class="g-kicker">${en ? "Four things, always the same" : "Cuatro cosas, siempre iguales"}</p>
        <h2 id="dr-como">${en ? "How a <em>coffee drop</em> works" : "Cómo funciona <em>un drop de café</em>"}</h2></div>
      <ol class="g-principios g-io" style="--i:1">${pasos.map(([tt, x]) => `<li><b>${esc(tt)}</b><span>${esc(x)}</span></li>`).join("")}</ol>
    </section>

    <section class="g-sec" aria-labelledby="dr-ahora">
      <div class="g-head g-io"><span class="g-num">02</span><p class="g-kicker">${en ? "Right now" : "Ahora mismo"}</p>
        <h2 id="dr-ahora">${en ? `Drop ${d.n}` : `Drop ${d.n}`}</h2>
        <p>${en ? "The first lot of the gang." : "El primer lote de la gang."} ${dropAgotado()
          ? (en ? "Sold out." : "Agotado.")
          : dropAbierto() ? (en ? "Open now." : "Abierto ahora.")
          : (d.fecha ? (en ? "Out " : "Sale el ") + fmtFecha(d.fecha) + "." : (en ? "Date and price to be confirmed." : "Fecha y precio por confirmar."))}</p>
        <a class="g-link" href="${ruta("drop")}" data-act="go" data-to="drop">${en ? `See Drop ${d.n}` : `Ver el Drop ${d.n}`}</a></div>
    </section>

    ${faqsHTML(faqsDrops(en), en)}`;
}

function faqsDrop(en) {
  const d = CONFIG.drop, E = CONFIG.envio;
  return en
    ? [["Is it whole bean or ground?", "Whole bean, always. Coffee ground in advance loses its aroma in days, and we would rather you ground it when you brew it. If you have no grinder, write to us before you order and we work it out."],
       ["Do you ship to my city?", `We ship across Colombia from Cúcuta with ${E.transportadora}. It costs ${cop(E.costo)} and takes ${tx(E.dias)}; from ${cop(E.gratisDesde)} shipping is free.`],
       ["How long does a bag last?", `A 250 g bag makes between 14 and 16 cups at 15 to 18 g per cup. Drink it within a month of the roast date, which is printed on the back of every bag.`],
       [`Why only ${d.bolsas ? fmtNum(d.bolsas) + " bags" : "this many bags"}?`, "Because that is what the lot gave. We buy one lot from one farm, and we do not mix in coffee from somewhere else to make it last longer."]]
    : [["¿Viene en grano o molido?", "En grano, siempre. El café molido con antelación pierde el aroma en días, y preferimos que lo muelas al momento. Si no tienes molino, escríbenos antes de pedir y lo resolvemos."],
       ["¿Hacen envíos a mi ciudad?", `Enviamos a todo el país desde Cúcuta con ${E.transportadora}. Cuesta ${cop(E.costo)} y llega en ${tx(E.dias)}; desde ${cop(E.gratisDesde)} el envío va gratis.`],
       ["¿Cuánto me dura la bolsa?", `Una bolsa de 250 g da entre 14 y 16 tazas, con 15 a 18 g por taza. Tómatelo antes de un mes desde la fecha de tostión, que va impresa al reverso de cada bolsa.`],
       [`¿Por qué solo ${d.bolsas ? fmtNum(d.bolsas) + " bolsas" : "salen tan pocas"}?`, "Porque es lo que dio el lote. Le compramos un lote a una finca y no le mezclamos café de otra parte para que rinda más."]];
}

function viewDrop() {
  const en = UI.lang === "en", d = CONFIG.drop, p = dropCafe(), E = CONFIG.envio;
  const agotado = dropAgotado(), abierto = dropAbierto();
  const comprar = agotado
    ? `<div class="pronto-aviso">
        <b>${t("agotado")}</b>
        <p>${en ? `Drop ${d.n} is gone and we are not roasting more of that lot. The next drop comes from another farm, and the gang hears it first.`
                : `El Drop ${d.n} se acabó y no vamos a tostar más de ese lote. El próximo drop viene de otra finca, y la gang se entera primero.`}</p>
        <button class="btn primary" data-act="go" data-to="gang">${t("drop_entrar")}</button></div>`
    : abierto && p
      ? `<div class="buy-row">
          <div><b class="precio-grande mono">${cop(d.precio || p.variantes[0].precio)}</b><small>${d.gramos ? gramos(d.gramos) : gramos(p.variantes[0].g)}${d.bolsas ? ` · ${fmtNum(dropRestantes())} ${en ? "left" : "quedan"}` : ""}</small></div>
          <button class="btn primary lg" data-act="add" data-p="${p.id}" data-g="${d.gramos || p.variantes[0].g}">${t("drop_asegurar")}</button>
        </div>
        <p class="hint">${en ? `Ships from Cúcuta within Colombia in ${tx(E.dias)} · ${cop(E.costo)}, free from ${cop(E.gratisDesde)}`
                             : `Sale de Cúcuta y llega en ${tx(E.dias)} · envío ${cop(E.costo)}, gratis desde ${cop(E.gratisDesde)}`}</p>`
      : `<div class="pronto-aviso">
          <b>${d.fecha ? (en ? "Out " : "Sale el ") + fmtFecha(d.fecha) : t("por_confirmar")}</b>
          <p>${en ? `The gang gets the link ${d.ventaja} hours before it opens to everyone. Joining is free.`
                  : `La gang recibe el link ${d.ventaja} horas antes de que abra para todos. Entrar es gratis.`}</p>
          <button class="btn primary" data-act="go" data-to="gang">${t("drop_entrar")}</button></div>`;
  const preguntas = faqsDrop(en);
  return `<article class="prod">
    <div class="prod-top">
    <div class="prod-buy reveal">
      <p class="eyebrow">Drop ${d.n} · ${dropEstado(en)}</p>
      <h1>${agotado ? (en ? "Gone. <em>Thanks, gang.</em>" : "Se acabó. <em>Gracias, gang.</em>")
                     : (en ? `Drop ${d.n}. <em>One farm, counted bags.</em>` : `Drop ${d.n}. <em>Una finca, bolsas contadas.</em>`)}</h1>
      <p class="lede">${en
        ? `Whole bean specialty coffee from one farm in Norte de Santander, Colombia, in numbered bags. Every bag says which farm it came from, how high it grew and when it was roasted.`
        : `Café de especialidad en grano de una sola finca de Norte de Santander, Colombia, en bolsas numeradas. Cada bolsa dice de qué finca vino, a qué altura creció y cuándo se tostó.`}</p>
      ${comprar}
    </div>
    <div class="prod-art reveal" style="--i:1">
      <div class="prod-escena"><span class="g-pronto">Drop ${d.n}<i>${en ? "numbered bags" : "bolsas numeradas"}</i></span></div>
      <div class="foto-pend">${en ? "Photo of the bag and the farm" : "Foto de la bolsa y de la finca"}</div>
    </div>
    </div>

    <section class="prod-ficha reveal" style="--i:2" aria-labelledby="dp-reporte">
      <div class="section-head"><p class="eyebrow">${en ? "The plug's report" : "El reporte del plug"}</p>
        <h2 id="dp-reporte">${en ? "Where this one <em>comes from</em>" : "De dónde <em>sale este</em>"}</h2>
        <p>${en ? "The same report that goes on the back of the bag. A row with nothing in it is a number we have not checked yet; we do not fill it in by guessing."
                : "El mismo reporte que va al reverso de la bolsa. Una fila vacía es un dato que todavía no comprobamos, y no lo llenamos a la adivina."}</p></div>
      ${reporteDelPlug(en)}
    </section>

    <section class="prod-ficha reveal" style="--i:3" aria-labelledby="dp-cifras">
      <div class="section-head"><p class="eyebrow">${en ? "Quantity and price" : "Cantidad y precio"}</p>
        <h2 id="dp-cifras">${en ? "How many, <em>and at what price</em>" : "Cuántas, <em>y a cuánto</em>"}</h2></div>
      <table class="ficha-tabla"><tbody>${dropCifras(en).map(([k, v]) => `<tr><th scope="row">${k}</th><td class="fv">${esc(v)}</td></tr>`).join("")}</tbody></table>
      <p class="hint"><a href="${ruta("drops")}" data-act="go" data-to="drops">${en ? "How a drop works" : "Cómo funciona un drop"}</a> · <a href="${ruta("gang")}" data-act="go" data-to="gang">${en ? "Join the gang" : "Entrar a la gang"}</a></p>
    </section>

    ${faqsHTML(preguntas, en)}</article>`;
}

function faqsGang(en) {
  return en
    ? [["How much does it cost to join the gang?", "Nothing. You leave your email, we tell you about each drop and you buy before everyone else. There is no fee and no minimum purchase."],
       ["What will you send me?", `Drops, restocks and gang things. Nothing else: no daily emails and no offers from anybody else. ${CONFIG.comunidad} is the only one who writes to you.`],
       ["How do I leave?", "Every email has an unsubscribe link, and you can also write to us and we take you off the list the same day."],
       ["Do I have to buy to stay in?", "No. You can be in the gang for years without buying. The early access is there whenever you want to use it."]]
    : [["¿Cuánto cuesta entrar a la gang?", "Nada. Dejas tu correo, te avisamos de cada drop y compras antes que todos. No hay cuota ni compra mínima."],
       ["¿Qué me van a mandar?", `Drops, restocks y cosas de la gang. Nada más: ni correos todos los días ni ofertas de terceros. Solo te escribe ${CONFIG.comunidad}.`],
       ["¿Cómo me salgo?", "Cada correo trae el enlace para darte de baja, y también puedes escribirnos y te sacamos de la lista el mismo día."],
       ["¿Tengo que comprar para seguir adentro?", "No. Puedes estar en la gang años sin comprar. El acceso anticipado está ahí el día que lo quieras usar."]];
}

function viewGang() {
  const en = UI.lang === "en", d = CONFIG.drop;
  const ventajas = en
    ? [["You hear it first", "The date and the hour of each drop reach you before they are public."],
       [`You buy ${d.ventaja} hours earlier`, "The buying link opens for the gang first. Then it opens for everyone else."],
       ["You get a member number", "It comes in the card inside your first bag, and it does not change."]]
    : [["Te enteras primero", "La fecha y la hora de cada drop te llegan antes de que sean públicas."],
       [`Compras ${d.ventaja} horas antes`, "El link de compra abre primero para la gang. Después abre para todo el mundo."],
       ["Tienes número de miembro", "Te llega en la tarjeta que va dentro de tu primera bolsa, y no cambia."]];
  const preguntas = faqsGang(en);
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_gang")}</p>
        <h1 class="reveal" style="--i:1">${en ? "The gang <em>hears it first.</em>" : "La gang <em>se entera primero.</em>"}</h1>
        <p class="reveal" style="--i:2">${en
          ? `The gang is the mailing list of ${esc(CONFIG.comunidad)}, the coffee brand from Norte de Santander, Colombia, that sells in numbered drops. Joining is free: you get each drop before it is public and you buy ${d.ventaja} hours earlier.`
          : `La gang es la lista de correo de ${esc(CONFIG.comunidad)}, la marca de café de Norte de Santander, Colombia, que vende en drops numerados. Entrar es gratis: te llega cada drop antes de que sea público y compras ${d.ventaja} horas antes.`}</p></div>
    </div>

    <section class="g-sec" aria-labelledby="gg-que">
      <div class="g-head g-io"><span class="g-num">01</span><p class="g-kicker">${en ? "What you get" : "Qué te da"}</p>
        <h2 id="gg-que">${en ? "Three things, <em>and no fee.</em>" : "Tres cosas, <em>y ninguna cuota.</em>"}</h2></div>
      <ol class="g-principios g-io" style="--i:1">${ventajas.map(([tt, x]) => `<li><b>${esc(tt)}</b><span>${esc(x)}</span></li>`).join("")}</ol>
    </section>

    <section class="g-comunidad" aria-labelledby="gg-entrar">
      <div>
        <h2 id="gg-entrar">${en ? "Join <em>the gang</em>" : "Entra a <em>la gang</em>"}</h2>
        <p>${en ? `One email and you are in. ${d.fecha ? `Drop ${d.n} goes out ${fmtFecha(d.fecha)}.` : `Drop ${d.n} has no date yet: you will be the first to know.`}`
                : `Un correo y ya estás. ${d.fecha ? `El Drop ${d.n} sale el ${fmtFecha(d.fecha)}.` : `El Drop ${d.n} todavía no tiene fecha: vas a ser de los primeros en saberlo.`}`}</p>
      </div>
      <form class="g-comunidad-form" data-form="gang" novalidate>
        <label class="lbl" for="gang-mail">${en ? "Email" : "Correo electrónico"}</label>
        <div><input id="gang-mail" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="${en ? "you@email.com" : "tu@correo.com"}">
          <button class="btn primary" type="submit">${t("drop_entrar")}${icono("flecha", "ico")}</button></div>
        <label class="g-consiente"><input type="checkbox" id="gang-ok"> <span>${en ? `I agree to receive drops and news from ${esc(CONFIG.marca)} by email.` : `Acepto recibir los drops y noticias de ${esc(CONFIG.marca)} por correo.`}</span></label>
        <small>${en ? "No spam: just drops and restocks. Leave whenever you like." : "Sin spam: solo drops y restocks. Te sales cuando quieras."}
          <a href="${ruta("privacidad")}" data-act="go" data-to="privacidad">${en ? "Privacy policy" : "Política de privacidad"}</a></small>
      </form>
    </section>

    ${faqsHTML(preguntas, en)}`;
}

/* Entrar a la gang: el correo se guarda igual que las listas de espera, con su
   propia etiqueta, para que en el panel se vea quién es de la gang. */
function entrarGang() {
  const en = UI.lang === "en";
  const correo = ($("#gang-mail")?.value || "").trim(), ok = $("#gang-ok")?.checked;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return toast(en ? "Check your email address." : "Revisa tu correo.", { type: "err" });
  if (!ok) return toast(en ? "Tick the box to join." : "Marca la casilla para entrar.", { type: "err" });
  S.espera.push({ id: nextId("GA"), producto: "gang", correo, fecha: isoToday(), consentimiento: true }); save();
  popPausa(POP_MIEMBRO);   /* ya es miembro: el pop-up vuelve en un mes, con algo nuevo */
  registrar("gang", { correo, consentimiento: true },
    en ? `Hi, I want to join the gang of ${CONFIG.comunidad} and I agree to receive the drops by email. My email: ${correo}`
       : `Hola, quiero entrar a la gang de ${CONFIG.comunidad} y acepto recibir los drops por correo. Mi correo: ${correo}`,
    `${CONFIG.comunidad} · ${en ? "the gang" : "la gang"}`);
  const btn = $('[data-form="gang"] button[type="submit"]'); if (btn) btn.disabled = true;
}

function viewDiario() {
  const en = UI.lang === "en";
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${t("nav_diario")}</p>
        <h1 class="reveal" style="--i:1">${en ? "What we learn <em>buying coffee</em>" : "Lo que aprendemos <em>comprando café</em>"}</h1>
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
    <div class="view-head"><div><p class="eyebrow reveal">${eyebrow}</p><h1 class="reveal" style="--i:1">${titulo}</h1>
      ${intro ? `<p class="reveal" style="--i:2">${intro}</p>` : ""}</div></div>
    ${bloques.map(([h, cuerpo]) => `<section class="legal-b"><h3>${h}</h3>${cuerpo}</section>`).join("")}
  </article>`;
}
const enlace = (view, txt) => `<a href="${ruta(view)}" data-act="go" data-to="${view}">${txt}</a>`;

function viewContacto() {
  const en = UI.lang === "en", E = CONFIG.envio;
  const wa = CONFIG.whatsapp ? `<a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">+${CONFIG.whatsapp}</a>` : "";
  const mail = `<a href="mailto:${CONFIG.correo}">${CONFIG.correo}</a>`;
  return paginaTexto(en ? "Contact information" : "Información de contacto", en ? "Write to <em>the family</em>" : "Escríbele <em>a la familia</em>",
    en ? "We are the Nandez family, coffee growers from Chinácota, Norte de Santander. We answer ourselves."
       : "Somos la familia Nandez, cafeteros de Chinácota, Norte de Santander. Contestamos nosotros mismos.",
    [[en ? "Where to find us" : "Dónde encontrarnos",
      `<p>${en ? "Email" : "Correo"}: ${mail}${wa ? `<br>WhatsApp: ${wa}` : ""}<br>${en ? "We ship from Cúcuta to all of Colombia." : "Despachamos desde Cúcuta a toda Colombia."}</p>`],
     [en ? "Who we are" : "Quiénes somos",
      `<p>${en ? "We grow coffee in Chinácota: 5,000 Geisha plants whose first harvest comes in 2027. Meanwhile we buy small lots from neighbouring farms in Norte de Santander and roast them under our own name."
        : "Sembramos café en Chinácota: 5.000 plantas de Geisha que dan su primera cosecha en 2027. Mientras tanto le compramos lotes pequeños a fincas vecinas de Norte de Santander y los tostamos con nuestro nombre."}</p>`],
     [en ? "Cafés and roasters" : "Cafeterías y tostadores",
      `<p>${en ? "Coffee by the kilo, volume prices and roasting to your profile." : "Café por kilos, precio por volumen y tueste a tu perfil."} ${enlace("cafes", en ? "See prices by the kilo" : "Ver precios por kilo")}.</p>`],
     [en ? "Your order" : "Tu pedido",
      `<p>${en ? `Write with your order number (it starts with NDZ). Orders arrive in ${tx(E.dias)}.` : `Escríbenos con tu número de pedido (empieza por NDZ). Los pedidos llegan en ${tx(E.dias)}.`} ${enlace("envios", en ? "Shipping and refund policy" : "Política de envíos y reembolso")}.</p>`]]);
}

function viewEnvios() {
  const en = UI.lang === "en", E = CONFIG.envio;
  return paginaTexto(en ? "Shipping and refund policy" : "Política de envíos y reembolso", en ? "What it costs, <em>when it arrives</em>" : "Cuánto cuesta, <em>cuándo llega</em>",
    en ? "And what we do if something goes wrong." : "Y qué hacemos si algo sale mal.",
    [[en ? "Cost" : "Costo",
      `<p>${en ? `Shipping costs ${cop(E.costo)} anywhere in Colombia and is free on orders from ${cop(E.gratisDesde)}. You see it in the cart before giving us any data.`
        : `El envío cuesta ${cop(E.costo)} a cualquier ciudad de Colombia y es gratis en pedidos desde ${cop(E.gratisDesde)}. Lo ves en el carrito antes de darnos ningún dato.`}</p>`],
     [en ? "Time" : "Tiempo",
      `<p>${en ? `We ship from Cúcuta with ${E.transportadora}. It arrives in ${tx(E.dias)}; rural areas can take a few days more. We send you the tracking number.`
        : `Despachamos desde Cúcuta por ${E.transportadora}. Llega en ${tx(E.dias)}; a zonas rurales puede tardar unos días más. Te mandamos la guía para que lo sigas.`}</p>`],
     [en ? "If something goes wrong" : "Si algo sale mal",
      `<p>${en ? `If the bag arrives broken, wet or is not what you ordered, write to ${CONFIG.correo} within 5 days of receiving it, with a photo and your order number. We send it again or refund you, at our cost.`
        : `Si la bolsa llega rota, mojada o no es lo que pediste, escríbenos a ${CONFIG.correo} dentro de los 5 días siguientes a recibirla, con una foto y tu número de pedido. Te la volvemos a enviar o te devolvemos el dinero, por nuestra cuenta.`}</p>`],
     [en ? "Returns" : "Devoluciones",
      `<p>${en ? "Coffee is food: once opened we cannot take it back. If you change your mind before we ship, we cancel the order and refund you in full."
        : "El café es un alimento: una vez abierto no lo podemos recibir de vuelta. Si te arrepientes antes de que lo despachemos, cancelamos el pedido y te devolvemos todo."}</p>`]]);
}

function viewTerminos() {
  const en = UI.lang === "en";
  return paginaTexto(en ? "Terms of service" : "Términos del servicio", en ? "Terms of <em>sale</em>" : "Términos y <em>condiciones</em>",
    en ? "A plain summary of how buying from us works." : "Resumen claro de cómo funciona comprarnos.",
    [[en ? "Who sells" : "Quién vende", `<p>${esc(CONFIG.marca)} · Chinácota, Norte de Santander, Colombia · ${CONFIG.correo}.</p>`],
     [en ? "Prices" : "Precios", `<p>${en ? "Prices are in Colombian pesos (COP) and include VAT when it applies. Shipping is shown separately in the cart." : "Los precios están en pesos colombianos e incluyen IVA cuando aplica. El envío se muestra aparte en el carrito."}</p>`],
     [en ? "Orders and payment" : "Pedidos y pago", `<p>${en ? `An order is confirmed when we reply and you pay by ${tx(CONFIG.pagos.manual)}. If a coffee sells out before that, we tell you and do not charge you.`
        : `Un pedido queda confirmado cuando te respondemos y pagas por ${tx(CONFIG.pagos.manual)}. Si un café se agota antes, te avisamos y no te cobramos.`}</p>`],
     [en ? "Shipping and returns" : "Envíos y devoluciones", `<p>${enlace("envios", en ? "See the shipping and refund policy" : "Mira la política de envíos y reembolso")}.</p>`],
     [en ? "Subscription" : "Suscripción", `<p>${en ? `No minimum term. Write to ${CONFIG.correo} before the 25th and the next month is not charged.` : `Sin permanencia. Escribes a ${CONFIG.correo} antes del día 25 y el mes siguiente no se cobra.`}</p>`],
     ...(!visible("subasta") ? [] : [[en ? "Auction" : "Subasta", `<p>${en ? "Only registered bidders may bid. A bid is a commitment to buy; the winner has 48 hours to pay, after which the lot goes to the runner-up. The lot is awarded only if it reaches the reserve price with at least 3 bidders."
        : "Solo pujan postores inscritos. Pujar es un compromiso de compra; el ganador tiene 48 horas para pagar y si no, el lote pasa al segundo postor. El lote se adjudica solo si alcanza el precio de reserva con al menos 3 postores."}</p>`]])]);
}

function viewPrivacidad() {
  const en = UI.lang === "en";
  return paginaTexto(en ? "Privacy policy" : "Política de privacidad", en ? "Your data, <em>only for your order</em>" : "Tus datos, <em>solo para tu pedido</em>",
    en ? "Policy under Colombian Law 1581 of 2012 on personal data." : "Política según la Ley 1581 de 2012 de protección de datos personales.",
    [[en ? "What we ask for" : "Qué pedimos", `<p>${en ? "To ship an order: name, ID or tax number, address, city, department, phone and email. The ID number is what the courier asks for to issue the waybill and what the invoice needs. Nothing else."
        : "Para despacharte un pedido: nombre, cédula o NIT, dirección, ciudad, departamento, teléfono y correo. La cédula es lo que pide la transportadora para hacer la guía y lo que lleva la factura. Nada más."}</p>`],
     [en ? "The community" : "La comunidad", `<p>${en ? `If you join the ${CONFIG.comunidad} community and tick the box, we use your email to send you news and members-only offers. You can leave with the link at the end of every email or by writing to ${CONFIG.correo}.`
        : `Si te unes a la comunidad ${CONFIG.comunidad} y marcas la casilla, usamos tu correo para enviarte noticias y ofertas solo para miembros. Te sales con el enlace al final de cada correo o escribiéndonos a ${CONFIG.correo}.`}</p>`],
     [en ? "What we use it for" : "Para qué lo usamos", `<p>${en ? "To confirm and ship orders and send the notices and news you asked for. We do not sell or share your data, except with the carrier that delivers your order."
        : "Para confirmar y despachar pedidos y enviarte los avisos y noticias que pediste. No vendemos ni compartimos tus datos, salvo con la transportadora que entrega tu pedido."}</p>`],
     [en ? "Your rights" : "Tus derechos", `<p>${en ? `You can ask us to see, correct or delete your data at any time by writing to ${CONFIG.correo}. We answer within 15 business days.`
        : `Puedes pedirnos conocer, corregir o borrar tus datos cuando quieras, escribiendo a ${CONFIG.correo}. Respondemos en máximo 15 días hábiles.`}</p>`],
     [en ? "Who is responsible" : "Responsable", `<p>${esc(CONFIG.marca)} · Chinácota, Norte de Santander · ${CONFIG.correo}.</p>`]]);
}

/* ---------- página no encontrada (404.html) ---------- */
function viewNoEncontrada() {
  const en = UI.lang === "en";
  return `<article class="legal no-encontrada">
    <div class="view-head"><div><p class="eyebrow reveal">404</p>
      <h1 class="reveal" style="--i:1">${en ? "This page <em>is not here</em>" : "Esta página <em>no está</em>"}</h1>
      <p class="reveal" style="--i:2">${en ? "Maybe the link is old or a letter is missing. The coffee is still where it was."
        : "Puede que el enlace sea viejo o le falte una letra. El café sigue donde estaba."}</p></div></div>
    <div class="cta"><button class="btn primary" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}</button>
      <button class="btn" data-act="go" data-to="inicio">${en ? "Home" : "Inicio"}</button>
      <button class="btn" data-act="go" data-to="contacto">${en ? "Write to us" : "Escríbenos"}</button></div>
  </article>`;
}

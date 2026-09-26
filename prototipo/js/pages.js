/* ============================================================
   SUSCRIPCIÓN y DIARIO (blog). Contenido pendiente del cliente.
   ============================================================ */
function viewSuscripcion() {
  const en = UI.lang === "en";
  const razones = en
    ? [["Coffee has a season", "We buy each harvest once. A subscription is how we know how much to buy before the farm sells it elsewhere."],
       ["You pay less than buying loose", "Same coffee, lower price per bag, and shipping included from the second bag."],
       ["The producer plans", "Knowing how much we ship every month lets us commit volumes to the farm in advance."]]
    : [["El café tiene temporada", "Cada cosecha se compra una vez. La suscripción es como sabemos cuánto comprar antes de que la finca venda su café a otro."],
       ["Pagas menos que suelto", "El mismo café, a menor precio por bolsa, y con envío incluido desde la segunda bolsa."],
       ["El productor puede planear", "Saber cuánto despachamos cada mes nos deja comprometerle volumen a la finca por anticipado."]];
  return `<div class="view-head">
      <div><p class="eyebrow reveal">${en ? "Subscription" : "Suscripción"}</p>
        <h2 class="reveal" style="--i:1">${en ? "Coffee that <em>arrives on its own</em>" : "Café que <em>llega solo</em>"}</h2>
        <p class="reveal" style="--i:2">${en
          ? "Every month we ship the freshest lot, with its data sheet. Cancel whenever you want."
          : "Cada mes despachamos el lote más fresco, con su ficha. Cancelas cuando quieras."}</p></div>
    </div>
    <div class="planes">${S.planes.map((p, i) => {
      const link = CONFIG.pagos.suscripcion[p.id];
      return `<article class="plan ${p.destacado ? "hot" : ""} reveal" style="--i:${i}">
        ${p.destacado ? `<span class="plan-tag">${en ? "Most chosen" : "El más pedido"}</span>` : ""}
        <h3>${esc(tx(p.nombre))}</h3>
        <p class="plan-precio"><b class="mono">${cop(p.precio)}</b><small>${t("mes")}</small></p>
        <p class="hint">${esc(tx(p.desc))}</p>
        <ul class="plan-lista">${tx(p.incluye).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="btn ${p.destacado ? "primary" : ""}" data-act="sub" data-id="${p.id}">${link ? t("suscribirme") : (en ? "I want it" : "Me interesa")}</button>
      </article>`;
    }).join("")}</div>
    <section class="section">
      <div class="section-head"><p class="eyebrow">${en ? "Why subscribe" : "Por qué suscribirse"}</p>
        <h2>${en ? "It is not a discount, <em>it is a plan</em>" : "No es un descuento, <em>es un plan</em>"}</h2></div>
      <div class="valor">${razones.map(([a, b], i) => `<div class="val" style="--i:${i}"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>
      <p class="hint">${en ? "Payments are handled by Mercado Pago. You can pause or cancel from the email we send you."
        : "Los cobros los maneja Mercado Pago. Puedes pausar o cancelar desde el correo que te enviamos."}</p>
    </section>`;
}

function suscribir(id) {
  const p = S.planes.find((x) => x.id === id), link = CONFIG.pagos.suscripcion[id], en = UI.lang === "en";
  if (link) return void window.open(link, "_blank", "noopener");
  modal(`${en ? "Subscription" : "Suscripción"} · <em>${esc(tx(p.nombre))}</em>`, `
    <p class="hint">${en ? "Leave your email and we will send you the payment link as soon as the subscription goes live."
      : "Déjanos tu correo y te enviamos el link de pago apenas abramos la suscripción."}</p>
    <div class="form-grid">
      <div class="field"><label class="lbl" for="sub-mail">${en ? "Email" : "Correo"}</label><input id="sub-mail" class="input" type="email"></div>
      <div class="field"><label class="lbl" for="sub-ciudad">${en ? "City" : "Ciudad"}</label><input id="sub-ciudad" class="input" value="Cúcuta"></div>
    </div>
    <div class="dlg-actions"><button class="btn" data-act="close">${en ? "Cancel" : "Cancelar"}</button>
      <button class="btn primary" data-act="sub-ok" data-id="${id}">${en ? "Notify me" : "Avisarme"}</button></div>`, "narrow");
}
function suscribirOk(id) {
  const mail = $("#sub-mail").value.trim(), en = UI.lang === "en";
  if (!/^\S+@\S+\.\S+$/.test(mail)) return toast(en ? "Write a valid email." : "Escribe un correo válido.", { type: "err" });
  S.suscriptores.unshift({ mail, plan: id, ciudad: $("#sub-ciudad").value.trim(), fecha: isoToday() });
  save(); closeModal(); render();
  toast(en ? "Saved. We will write to you." : "Listo, te escribimos.");
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
    </article>`).join("")}</div>
    <p class="hint">${en ? "PENDING: real posts. This section is ready for the texts." : "PENDIENTE: las entradas reales. La sección ya está lista para los textos."}</p>`;
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
      <div><h3>${UI.lang === "en" ? "Want the coffee we write about?" : "¿Quieres el café del que escribimos?"}</h3>
        <p>${UI.lang === "en" ? "Every lot we publish is on sale while it lasts." : "Cada lote del que hablamos está a la venta mientras dure."}</p></div>
      <button class="btn primary" data-act="go" data-to="cafes">${t("nav_cafes")}</button>
    </div>
  </article>`;
}

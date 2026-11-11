/* ============================================================
   PANEL · ACTIVIDAD
   Qué hace la gente en la página y a quién vale la pena recordarle.
   - El embudo: de quienes entraron, cuántos vieron un café, cuántos
     lo echaron al carrito, cuántos fueron a pagar y cuántos compraron.
   - Los carritos abandonados de quien ya dejó su correo, con el
     botón que le manda el recordatorio (una vez, y solo si aceptó
     recibir correos).
   - Los que llegaron a la pasarela y no pagaron, con WhatsApp.
   - Quién se registró y qué es lo más visto.
   Todo sale de la bitácora propia (prototipo/js/medir.js) que guarda
   la Hoja de Google: solo anota a quien aceptó las cookies, así que
   son cifras de esas personas, no de todas las visitas.
   El píxel de Meta es otra cosa: sus datos se quedan en Meta y sirven
   para los anuncios; aquí solo se dice si está puesto.
   ============================================================ */
const AC = { datos: null, cargando: false, error: null, dias: 30 };
const AC_EVENTOS = { visita: "Entró a la página", ver: "Vio", agregar: "Agregó al carrito", pagar: "Fue a pagar", compra: "Compró", registro: "Se registró" };
const AC_PASOS = [["visita", "Entraron"], ["ver", "Vieron un café"], ["agregar", "Agregaron al carrito"], ["pagar", "Fueron a pagar"], ["compra", "Compraron"]];
const AC_ERRORES = { "no-acepta": "Esa persona no aceptó recibir correos.", "sin-correo": "No dejó correo.", ya: "Ya se le había recordado.",
  cuota: "Gmail no tiene cupo hoy: inténtalo mañana.", no: "Ese carrito ya no está abandonado.", "no-es-reserva": "Ese pedido ya no es una reserva sin pagar." };

function acCargar() {
  if (!CONFIG.registro || !coClave()) return;
  AC.cargando = true; AC.error = null; render();
  fetch(CONFIG.registro + "?accion=actividad&dias=" + AC.dias + "&clave=" + encodeURIComponent(coClave()))
    .then((r) => r.json())
    .then((j) => {
      AC.cargando = false;
      if (!j.ok) AC.error = j.error === "clave" ? "La clave no coincide. Cámbiala en la pestaña Correos." : "El script respondió con un error.";
      /* el script de antes responde ok sin saber qué es "actividad" */
      else if (!j.actividad) AC.error = "viejo";
      else AC.datos = j;
      render();
    })
    .catch(() => { AC.cargando = false; AC.error = "No se pudo conectar con la hoja. Si el script se actualizó, publica una versión nueva de la implementación."; render(); });
}
function acRecordar(cuerpo, quien) {
  closeModal();
  fetch(CONFIG.registro, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ accion: "recordar", clave: coClave(), ...cuerpo }) })
    .then((r) => r.json())
    .then((j) => {
      if (!j.ok) return toast(AC_ERRORES[j.error] || "No se envió. Vuelve a intentar.", { type: "err" });
      toast(`Recordatorio enviado a ${quien}.`); acCargar();
    })
    .catch(() => toast("No se envió. Revisa la conexión y vuelve a intentar.", { type: "err" }));
}

/* "hace 3 h", "hace 2 días": lo que importa de un carrito es cuánto lleva quieto */
function acHace(v) {
  const min = Math.max(0, Math.round((Date.now() - new Date(v).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  if (min < 48 * 60) return `hace ${Math.round(min / 60)} h`;
  return `hace ${Math.round(min / 1440)} días`;
}
const acWa = (tel) => "https://wa.me/57" + String(tel).replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "");
const acPct = (n, de) => (de ? fmtNum((n / de) * 100) + " %" : "—");

/* El embudo: una barra por paso, todas del mismo color porque es una sola
   medida (personas). El número va escrito al lado, no hay que adivinarlo. */
function acEmbudo(e) {
  const tope = Math.max(1, ...AC_PASOS.map(([k]) => e[k] || 0));
  return `<div class="ac-embudo" role="table" aria-label="Embudo de la tienda">
    ${AC_PASOS.map(([k, txt], i) => {
      const n = e[k] || 0, antes = i ? e[AC_PASOS[i - 1][0]] || 0 : 0;
      return `<div class="ac-paso" role="row" title="${txt}: ${fmtNum(n)} personas${i ? ` · ${acPct(n, antes)} del paso anterior` : ""}">
        <span class="ac-paso-t" role="cell">${txt}</span>
        <span class="ac-barra" role="presentation"><i style="width:${n ? Math.max(1.5, (n / tope) * 100) : 0}%"></i></span>
        <b class="mono" role="cell">${fmtNum(n)}</b>
        <small role="cell">${i ? acPct(n, antes) + " del paso anterior" : "personas distintas"}</small></div>`;
    }).join("")}</div>`;
}
/* Las visitas de los últimos 14 días, una columna por día */
function acDias(serie) {
  const tope = Math.max(1, ...serie.map((d) => d.visita));
  return `<div class="ac-dias" role="img" aria-label="Personas que entraron cada día, últimos ${serie.length} días">
    ${serie.map((d) => `<span class="ac-dia" title="${fmtFecha(d.dia)}: ${fmtNum(d.visita)} entraron · ${fmtNum(d.agregar)} agregaron al carrito · ${fmtNum(d.compra)} compraron">
      <i style="height:${d.visita ? Math.max(4, (d.visita / tope) * 100) : 0}%"></i><small>${d.dia.slice(8)}</small></span>`).join("")}</div>`;
}

function viewActividad() {
  if (!CONFIG.registro || !coClave()) return `<section class="co-vacio">
      <p class="eyebrow">Actividad</p><h2>Primero, conecta la hoja</h2>
      <p class="hint">La actividad de la página se guarda en la misma Hoja de Google que los correos. Conéctala en la pestaña <b>Correos</b> y vuelve aquí.</p>
      <div class="co-fila"><button class="btn primary" data-act="atab" data-tab="correos">Ir a Correos</button></div></section>`;
  if (!AC.datos && !AC.cargando && !AC.error) setTimeout(acCargar, 0);
  if (AC.error === "viejo") return `<section class="co-vacio"><p class="eyebrow">Actividad</p>
      <h2>Falta actualizar el script de la hoja</h2>
      <p class="hint">La hoja todavía corre la versión anterior, que no sabe guardar la actividad. Es una sola vez:</p>
      <ol class="co-pasos">
        <li>Abre el proyecto <b>Nandez · correos</b> en <a href="https://script.google.com" target="_blank" rel="noopener">script.google.com</a>.</li>
        <li>Reemplaza todo el código por el de <code>tools/correos/Codigo.gs</code> y guarda.</li>
        <li>Ejecuta la función <b>configurar</b>: crea las hojas <b>Actividad</b> y <b>Carritos</b> sin tocar lo que hay.</li>
        <li><b>Implementar → Administrar implementaciones → editar → Nueva versión.</b> La dirección no cambia.</li>
      </ol>
      <p class="hint">Mientras tanto la página no anota nada ni muestra el aviso de cookies.</p>
      <div class="co-fila"><button class="btn primary" data-act="ac-cargar">Ya lo actualicé</button></div></section>`;
  if (!AC.datos) return `<section class="co-vacio"><p class="eyebrow">Actividad</p>
      <h2>${AC.error ? "No se pudo cargar" : "Cargando la actividad…"}</h2>
      ${AC.error ? `<p class="err">${esc(AC.error)}</p><div class="co-fila"><button class="btn" data-act="ac-cargar">Intentar otra vez</button></div>` : ""}</section>`;

  const d = AC.datos, e = d.embudo, porRecordar = d.carritos.filter((c) => c.acepta && !c.recordado);
  const plataQuieta = d.carritos.reduce((s, c) => s + c.total, 0) + d.anonimos.total;
  const kpi = (n, txt, alerta, esPlata) => `<div class="mkt${alerta && n ? " op-alerta" : ""}"><small>${txt}</small><b class="mono co-n">${esPlata ? cop(n) : fmtNum(n)}</b></div>`;
  const pixel = CONFIG.medicion && CONFIG.medicion.metaPixel;

  return `<section class="co op ac">
    <div class="section-head co-head"><p class="eyebrow">Actividad de la página</p>
      <h2>Quién entró, quién <em>se quedó en el carrito</em></h2>
      <p class="hint">Son las personas que aceptaron las cookies en la página: sin ese permiso no se anota nada, así que el total real de visitas es mayor. Las ventas de verdad están en la pestaña <b>Pedidos</b>.</p>
      <div class="co-fila"><button class="btn sm" data-act="ac-cargar">${AC.cargando ? "Actualizando…" : "Actualizar"}</button>
        <span class="co-etiquetas" role="group" aria-label="Periodo">${[7, 30, 90].map((n) =>
          `<button class="chip" aria-pressed="${AC.dias === n}" data-act="ac-dias" data-id="${n}">${n} días</button>`).join("")}</span>
        <a class="btn sm" href="${esc(d.hoja)}" target="_blank" rel="noopener">Abrir la hoja</a></div></div>

    <div class="mkt-grid">${kpi(porRecordar.length, "Carritos por recordar", true)}${kpi(d.sinPagar.filter((p) => !p.recordado).length, "Llegaron a pagar y no pagaron", true)}
      ${kpi(plataQuieta, "En carritos sin cerrar", false, true)}${kpi(d.nuevos.d7, `Registros en 7 días · ${fmtNum(d.nuevos.total)} en total`)}</div>

    <div class="ac-dos">
      <section class="wpanel ac-caja">
        <h3>El embudo · últimos ${d.dias} días</h3>
        ${e.visita ? acEmbudo(e) : `<p class="hint">Todavía no hay actividad anotada en este periodo. Empieza a llegar cuando alguien acepta las cookies en la página.</p>`}
      </section>
      <section class="wpanel ac-caja">
        <h3>Entraron cada día</h3>
        ${acDias(d.porDia)}
        <h3 class="ac-sub">Lo más visto</h3>
        ${d.productos.length ? `<table class="b2b-tabla ac-mini"><thead><tr><th>Café</th><th>Lo vieron</th><th>Al carrito</th></tr></thead><tbody>
          ${d.productos.map((p) => `<tr><th scope="row">${esc(p.nombre)}</th><td class="mono">${fmtNum(p.ver)}</td><td class="mono">${fmtNum(p.agregar)}</td></tr>`).join("")}</tbody></table>`
          : `<p class="hint">Nadie ha abierto la ficha de un café en este periodo.</p>`}
      </section>
    </div>

    <h3 class="op-tit">Carritos abandonados</h3>
    <p class="hint">Gente que ya dejó su correo en la página y armó un carrito que lleva más de una hora quieto. El recordatorio sale una sola vez por carrito y solo a quien marcó la casilla de recibir correos; si tiene su bono de bienvenida sin usar, el correo se lo recuerda.${d.auto ? " <b>El envío automático está prendido</b>: cada mañana salen solos los que llevan un día." : ""}</p>
    <div class="table-scroll"><table class="b2b-tabla co-tabla op-tabla">
      <thead><tr><th>Quién</th><th>Qué dejó</th><th>Total</th><th>Quieto</th><th></th></tr></thead>
      <tbody>${d.carritos.length ? d.carritos.map((c) => `<tr>
        <th scope="row">${esc(c.correo)}<small>${c.acepta ? "Acepta correos" : "No aceptó correos"}</small></th>
        <td class="op-prod">${c.items.map((i) => `${fmtNum(i.n)} × ${esc(i.nom)}`).join("<br>")}</td>
        <td class="mono">${cop(c.total)}</td>
        <td>${acHace(c.actualizado)}</td>
        <td class="op-acc">${c.recordado ? `<span class="op-estado op-entregado">Recordado el ${coFecha(c.recordado)}</span>`
          : c.acepta ? `<button class="btn sm primary" data-act="ac-recordar" data-id="${esc(c.v)}">Recordar por correo</button>`
          : `<span class="op-estado op-cancelado" title="La ley pide su autorización para mandarle publicidad">Sin permiso de correo</span>`}</td></tr>`).join("")
        : `<tr><td colspan="5" class="hint">Ningún carrito con correo está esperando.</td></tr>`}</tbody></table></div>
    ${d.anonimos.n ? `<p class="hint">Además hay <b>${fmtNum(d.anonimos.n)}</b> ${d.anonimos.n === 1 ? "carrito" : "carritos"} de visitantes que no han dejado su correo (${cop(d.anonimos.total)}). A esos no se les puede escribir: los alcanza el anuncio de Meta cuando el píxel esté puesto, o el pop-up del bono, que es el que consigue el correo.</p>` : ""}

    <h3 class="op-tit">Llegaron a pagar y no pagaron</h3>
    <p class="hint">Abrieron la pasarela con sus datos y el pago no se completó; a las 2 horas la reserva se soltó sola. Es la gente más cerca de comprar: un mensaje corto suele bastar.</p>
    <div class="table-scroll"><table class="b2b-tabla co-tabla op-tabla">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total</th><th></th></tr></thead>
      <tbody>${d.sinPagar.length ? d.sinPagar.map((p) => `<tr>
        <th scope="row"><span class="mono">${esc(p.id)}</span><small>${coFecha(p.fecha)}</small></th>
        <td>${esc(p.nombre)}<small>${esc([p.ciudad, p.tel && "tel " + p.tel, p.correo].filter(Boolean).join(" · "))}</small></td>
        <td class="op-prod">${esc(p.productos).replace(/\n/g, "<br>")}</td>
        <td class="mono">${cop(p.total)}</td>
        <td class="op-acc">${p.tel ? `<a class="btn sm primary" href="${esc(acWa(p.tel))}?text=${encodeURIComponent(`Hola ${String(p.nombre).split(" ")[0]}, te escribimos de ${CONFIG.marca}. Vimos que tu pedido ${p.id} no alcanzó a pagarse. ¿Te ayudamos a terminarlo?`)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
          ${p.recordado ? `<span class="op-estado op-entregado">Ya se le escribió</span>` : p.correo ? `<button class="btn sm" data-act="ac-recordar-pedido" data-id="${esc(p.id)}">Avisar por correo</button>` : ""}</td></tr>`).join("")
        : `<tr><td colspan="5" class="hint">Nadie se ha quedado en la pasarela en los últimos 30 días.</td></tr>`}</tbody></table></div>

    <h3 class="op-tit">Quién se registró</h3>
    <p class="hint"><b>${fmtNum(d.nuevos.d7)}</b> en 7 días · <b>${fmtNum(d.nuevos.d30)}</b> en 30 días · <b>${fmtNum(d.nuevos.total)}</b> en total. La lista completa, los filtros y las campañas están en <b>Correos</b>.</p>
    ${d.inscritos ? `<div class="mkt-grid">${[["pop", "Por el pop-up del bono"], ["pie", "Por el pie de página"], ["gang", "Por la página de la gang"], ["sin", "Comunidad, sin origen"]]
      .map(([k, txt]) => `<div class="mkt" title="${k === "sin" ? "Se registraron antes del 10 de noviembre de 2026, cuando la página todavía no distinguía el pop-up del pie" : "Personas distintas que marcaron la casilla"}"><small>${txt}</small><b class="mono co-n">${fmtNum(d.inscritos[k].total)}</b><small>${fmtNum(d.inscritos[k].d7)} en los últimos 7 días</small></div>`).join("")}</div>
    <p class="hint">Cuenta personas que aceptaron recibir correos. «Sin origen» son los de antes del 10 de noviembre de 2026: entonces el pop-up y el pie llegaban igual a la hoja y no se pueden separar.</p>` : ""}
    <div class="table-scroll"><table class="b2b-tabla co-tabla">
      <thead><tr><th>Correo</th><th>Por dónde entró</th><th>Acepta correos</th><th>Alta</th></tr></thead>
      <tbody>${d.registros.length ? d.registros.map((c) => `<tr>
        <th scope="row">${esc(c.correo)}${c.nombre || c.ciudad ? `<small>${esc([c.nombre, c.ciudad].filter(Boolean).join(" · "))}</small>` : ""}</th>
        <td>${c.etiquetas.map((t) => `<span class="co-tag">${esc(t)}</span>`).join("")}</td>
        <td>${c.acepta ? `<span class="co-si">Sí</span>` : `<span class="co-no">No</span>`}</td>
        <td class="mono">${coFecha(c.alta)}</td></tr>`).join("")
        : `<tr><td colspan="4" class="hint">Todavía nadie se ha registrado.</td></tr>`}</tbody></table></div>

    <h3 class="op-tit">Últimos movimientos</h3>
    <ul class="ac-feed">${d.recientes.length ? d.recientes.map((r) => `<li>
      <time class="mono">${acHace(r.fecha)}</time>
      <span><b>${esc(r.correo || "Visitante " + r.visitante)}</b> · ${esc(AC_EVENTOS[r.evento] || r.evento)}${r.detalle ? (r.evento === "registro" ? ` (${esc(r.detalle)})` : " " + esc(r.detalle)) : ""}${r.valor && r.evento !== "ver" ? ` · ${cop(r.valor)}` : ""}</span></li>`).join("")
      : `<li class="hint">Sin movimientos todavía.</li>`}</ul>

    <section class="wpanel op-bono">
      <h3>El píxel de Meta</h3>
      <p class="hint">${pixel
        ? `Está puesto (${esc(pixel)}). Lo que recoge se ve en el Administrador de eventos de Meta, no aquí: sirve para que los anuncios les lleguen a quienes vieron un café o dejaron un carrito.`
        : `Todavía no está puesto: falta el identificador en <code>CONFIG.medicion.metaPixel</code>. Cuando esté, los mismos eventos de esta pestaña (vio un café, agregó al carrito, fue a pagar, compró) le llegan a Meta para los anuncios. Lo que Meta recoge se ve en su Administrador de eventos, no aquí.`}</p>
    </section>

    <section class="wpanel op-bono">
      <h3>Que tus propias visitas no cuenten</h3>
      <p class="hint">Probar la página desde casa infla estas cifras: diez vueltas al carrito se ven igual que diez clientes interesados. Abre
        <code>${esc(CONFIG.sitio)}/?nocontar</code> una vez en cada navegador que uses para probar —el tuyo y el de quien te ayude— y desde ahí no se anota nada,
        ni aquí ni en Meta. Se deshace con <code>?nocontar=no</code>. La marca vive en ese navegador, así que se pierde al borrar los datos del sitio.</p>
      <p class="hint">En Meta se excluye aparte, por dirección IP: <b>Administrador de eventos → Configuración → Tráfico interno</b>.</p>
      <div class="co-fila"><button class="btn" data-act="ac-limpiar">Borrar lo medido hasta ahora</button></div>
    </section>
  </section>`;
}

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-act^='ac-']"); if (!el || el.disabled) return;
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case "ac-cargar": AC.error = null; return acCargar();
    case "ac-limpiar":
      return modal("Borrar lo medido hasta ahora", `
        <p class="hint">Se borra la bitácora de la página y los carritos que están sin cerrar: el embudo, lo más visto, los últimos movimientos y la lista de carritos abandonados quedan en cero.</p>
        <p class="hint"><b>No se toca nada de lo que vendiste:</b> pedidos, contactos, bonos, suscripciones y stock siguen igual.</p>
        <p class="hint err">Desde aquí no tiene vuelta atrás. Si te arrepientes, la Hoja de Google guarda el historial de versiones (<i>Archivo → Historial de versiones</i>).</p>
        <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button>
          <button class="btn primary" data-act="ac-limpiar-ok">Sí, borrar</button></div>`, "narrow");
    case "ac-limpiar-ok":
      closeModal();
      return fetch(CONFIG.registro, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ accion: "limpiar", clave: coClave() }) })
        .then((r) => r.json())
        .then((j) => { if (!j.ok) throw new Error(j.error); toast(j.borradas ? `Listo: ${fmtNum(j.borradas)} ${j.borradas === 1 ? "fila borrada" : "filas borradas"}.` : "No había nada que borrar."); acCargar(); })
        .catch(() => toast("No se pudo borrar. Revisa la conexión y vuelve a intentar.", { type: "err" }));
    case "ac-dias": AC.dias = +id; return acCargar();
    case "ac-recordar": {
      const c = AC.datos.carritos.find((x) => x.v === id); if (!c) return;
      return modal("Recordar el carrito", `
        <p class="hint">A <b>${esc(c.correo)}</b> le llega un correo con lo que dejó (${c.items.map((i) => `${fmtNum(i.n)} × ${esc(i.nom)}`).join(", ")}) y un botón para volver. Sale una sola vez.</p>
        <p class="hint">Quedan ${fmtNum(AC.datos.cuota)} correos de Gmail por hoy.</p>
        <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="ac-recordar-ok" data-id="${esc(id)}">Enviar</button></div>`, "narrow");
    }
    case "ac-recordar-ok": { const c = AC.datos.carritos.find((x) => x.v === id); return acRecordar({ carrito: id }, c ? c.correo : "el cliente"); }
    case "ac-recordar-pedido": {
      const p = AC.datos.sinPagar.find((x) => x.id === id); if (!p) return;
      return modal("Avisar del pedido sin pagar", `
        <p class="hint">A <b>${esc(p.correo)}</b> le llega un correo: su pedido <b>${esc(p.id)}</b> no alcanzó a pagarse, las bolsas se soltaron y puede pedirlo otra vez o responder si el pago le dio problema. Sale una sola vez.</p>
        <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="ac-recordar-pedido-ok" data-id="${esc(id)}">Enviar</button></div>`, "narrow");
    }
    case "ac-recordar-pedido-ok": { const p = AC.datos.sinPagar.find((x) => x.id === id); return acRecordar({ pedido: id }, p ? p.correo : "el cliente"); }
  }
});

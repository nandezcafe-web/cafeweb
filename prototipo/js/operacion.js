/* ============================================================
   PANEL · PEDIDOS, DESPACHOS Y SUSCRIPCIONES
   Lo que llega de la tienda vive en la misma Hoja de Google que los
   correos (tools/correos/Codigo.gs) y se lee con la misma clave.
   - Pedidos: nuevo → pagado → despachado (con guía, le llega al
     cliente por correo) → entregado.
   - Suscripciones: en espera (dejó el correo) → activa (pagó, con la
     fecha del primer envío). Cada envío registrado corre la fecha
     1 o 2 meses y le manda la guía al suscriptor.
   Cada mañana el script le escribe a Nandez lo que toca despachar.
   ============================================================ */
const OP = { datos: null, cargando: false, error: null, filtro: "pendientes" };
const OP_ESTADOS = {
  nuevo: { txt: "Por confirmar", sig: "pagado", accion: "Marcar pagado" },
  pagado: { txt: "Por despachar", sig: "despachado", accion: "Despachar" },
  despachado: { txt: "En camino", sig: "entregado", accion: "Entregado" },
  entregado: { txt: "Entregado" },
  cancelado: { txt: "Cancelado" },
};
const SUB_ESTADOS = { espera: "En espera", activa: "Activa", pausada: "Pausada", cancelada: "Cancelada" };
const opDia = (v) => (v ? String(v).slice(0, 10) : "");
const opDias = (v) => Math.round((new Date(opDia(v) + "T00:00:00") - new Date(isoToday() + "T00:00:00")) / 864e5);
const opPlan = (id) => { const p = PLANES.find((x) => x.id === id) || (CAFETERIA.id === id ? CAFETERIA : null); return p ? tx(p.nombre) : id; };

function opCargar() {
  if (!CONFIG.registro || !coClave()) return;
  OP.cargando = true; OP.error = null; render();
  fetch(CONFIG.registro + "?accion=operacion&clave=" + encodeURIComponent(coClave()))
    .then((r) => r.json())
    .then((j) => {
      OP.cargando = false;
      if (!j.ok) OP.error = j.error === "clave" ? "La clave no coincide. Cámbiala en la pestaña Correos." : "El script respondió con un error.";
      else OP.datos = j;
      render();
    })
    .catch(() => { OP.cargando = false; OP.error = "No se pudo conectar con la hoja. Si el script se actualizó, publica una versión nueva de la implementación."; render(); });
}
function opMandar(cuerpo, listo) {
  closeModal();
  return fetch(CONFIG.registro, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ clave: coClave(), ...cuerpo }) })
    .then((r) => r.json())
    .then((j) => { if (!j.ok) throw new Error(j.error); toast(listo(j)); opCargar(); })
    .catch(() => toast("No se guardó. Revisa la conexión y vuelve a intentar.", { type: "err" }));
}

function viewOperacion() {
  if (!CONFIG.registro || !coClave()) return `<section class="co-vacio">
      <p class="eyebrow">Pedidos</p><h2>Primero, conecta la hoja</h2>
      <p class="hint">Los pedidos y las suscripciones se guardan en la misma Hoja de Google que los correos. Conéctala en la pestaña <b>Correos</b> y vuelve aquí.</p>
      <div class="co-fila"><button class="btn primary" data-act="atab" data-tab="correos">Ir a Correos</button></div></section>`;
  if (!OP.datos && !OP.cargando && !OP.error) setTimeout(opCargar, 0);
  if (!OP.datos) return `<section class="co-vacio"><p class="eyebrow">Pedidos</p>
      <h2>${OP.error ? "No se pudo cargar" : "Cargando pedidos…"}</h2>
      ${OP.error ? `<p class="err">${esc(OP.error)}</p><div class="co-fila"><button class="btn" data-act="op-cargar">Intentar otra vez</button></div>` : ""}</section>`;

  const { pedidos, suscripciones: subs, bonos } = OP.datos;
  const porConfirmar = pedidos.filter((p) => p.estado === "nuevo"), porDespachar = pedidos.filter((p) => p.estado === "pagado");
  const activas = subs.filter((s) => s.estado === "activa").sort((a, b) => opDia(a.proximo).localeCompare(opDia(b.proximo)));
  const tocan = activas.filter((s) => s.proximo && opDias(s.proximo) <= 7);
  const kpi = (n, txt, alerta) => `<div class="mkt${alerta && n ? " op-alerta" : ""}"><small>${txt}</small><b class="mono co-n">${fmtNum(n)}</b></div>`;
  const filtros = [["pendientes", "Pendientes", porConfirmar.length + porDespachar.length], ["todos", "Todos", pedidos.length],
    ...Object.entries(OP_ESTADOS).map(([k, v]) => [k, v.txt, pedidos.filter((p) => p.estado === k).length])];
  const lista = pedidos.filter((p) => OP.filtro === "todos" || (OP.filtro === "pendientes" ? ["nuevo", "pagado"].includes(p.estado) : p.estado === OP.filtro));

  return `<section class="co op">
    <div class="section-head co-head"><p class="eyebrow">Pedidos y despachos</p>
      <h2>Lo que hay que <em>despachar</em></h2>
      <p class="hint">Cada pedido de la tienda llega aquí. Cuando lo despachas con la guía, al cliente le llega por correo. Cada mañana a las 7 te llega a ${esc(CONFIG.correo)} el resumen de lo que toca.</p>
      <div class="co-fila"><button class="btn sm" data-act="op-cargar">${OP.cargando ? "Actualizando…" : "Actualizar"}</button>
        <a class="btn sm" href="${esc(OP.datos.hoja)}" target="_blank" rel="noopener">Abrir la hoja</a></div></div>

    <div class="mkt-grid">${kpi(porConfirmar.length, "Por confirmar el pago", true)}${kpi(porDespachar.length, "Por despachar", true)}
      ${kpi(tocan.length, "Suscripciones en 7 días", true)}${kpi(bonos.usados, `Bonos usados de ${fmtNum(bonos.entregados)}`)}</div>

    <h3 class="op-tit">Pedidos</h3>
    <div class="co-etiquetas" role="group" aria-label="Filtrar pedidos">
      ${filtros.map(([k, txt, n]) => `<button class="chip" aria-pressed="${OP.filtro === k}" data-act="op-filtro" data-id="${k}">${txt} · ${n}</button>`).join("")}</div>
    <div class="table-scroll"><table class="b2b-tabla co-tabla op-tabla">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>${lista.length ? lista.map((p) => {
        const e = OP_ESTADOS[p.estado] || { txt: p.estado };
        return `<tr>
        <th scope="row"><span class="mono">${esc(p.id)}</span><small>${coFecha(p.fecha)}</small></th>
        <td>${esc(p.nombre)}<small>${esc([p.ciudad, p.tel && "WA " + p.tel, p.correo].filter(Boolean).join(" · "))}</small></td>
        <td class="op-prod">${esc(p.productos).replace(/\n/g, "<br>")}${p.notas ? `<small class="err">${esc(p.notas)}</small>` : ""}</td>
        <td class="mono">${cop(p.total)}${p.bono ? `<small>bono ${esc(p.bono)} −${cop(p.descuento)}</small>` : ""}</td>
        <td><span class="op-estado op-${esc(p.estado)}">${esc(e.txt)}</span>${p.guia ? `<small>${esc(p.transportadora)} · ${esc(p.guia)}</small>` : ""}</td>
        <td class="op-acc">${e.sig ? `<button class="btn sm ${p.estado === "pagado" ? "primary" : ""}" data-act="op-avanzar" data-id="${esc(p.id)}">${e.accion}</button>` : ""}
          ${p.estado === "nuevo" ? `<button class="btn sm" data-act="op-cancelar" data-id="${esc(p.id)}">Cancelar</button>` : ""}
          ${p.tel ? `<a class="btn sm" href="https://wa.me/57${esc(String(p.tel).replace(/\D/g, "").replace(/^57(?=\d{10}$)/, ""))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</td></tr>`;
      }).join("") : `<tr><td colspan="6" class="hint">Nada por aquí${OP.filtro === "pendientes" ? ": todo está despachado" : ""}.</td></tr>`}</tbody></table></div>

    <h3 class="op-tit">Suscripciones</h3>
    <p class="hint">Mientras no haya cobro automático, quien se suscribe queda <b>en espera</b>. Cuando pague, actívala con la fecha del primer envío.</p>
    <div class="table-scroll"><table class="b2b-tabla co-tabla op-tabla">
      <thead><tr><th>Suscriptor</th><th>Plan</th><th>Molienda</th><th>Próximo envío</th><th>Estado</th><th></th></tr></thead>
      <tbody>${subs.length ? [...activas, ...subs.filter((s) => s.estado !== "activa")].map((s) => {
        const d = s.proximo ? opDias(s.proximo) : null;
        const cuando = s.estado !== "activa" || d == null ? "—"
          : d < 0 ? `<span class="op-tarde">Atrasado ${-d} ${-d === 1 ? "día" : "días"}</span>` : d === 0 ? `<span class="op-tarde">Hoy</span>` : `${coFecha(s.proximo)}<small>en ${d} ${d === 1 ? "día" : "días"}</small>`;
        return `<tr>
        <th scope="row">${esc(s.correo)}<small>${esc(s.ciudad || "")}</small></th>
        <td>${esc(opPlan(s.plan))}<small>${esc(s.pago)} · ${Number(s.cada) === 2 ? "cada 2 meses" : "cada mes"}${s.kit === "sí" ? " · con kit" : ""}</small></td>
        <td>${esc(s.molienda || "—")}</td>
        <td class="mono">${cuando}${s.envios ? `<small>${fmtNum(s.envios)} enviados</small>` : ""}</td>
        <td><span class="op-estado op-sub-${esc(s.estado)}">${esc(SUB_ESTADOS[s.estado] || s.estado)}</span></td>
        <td class="op-acc">${s.estado === "activa" ? `<button class="btn sm ${d != null && d <= 3 ? "primary" : ""}" data-act="op-sub-envio" data-id="${s.fila}">Registrar envío</button>
            <button class="btn sm" data-act="op-sub" data-id="${s.fila}" data-estado="pausada">Pausar</button>`
          : s.estado === "cancelada" ? "" : `<button class="btn sm" data-act="op-sub-activar" data-id="${s.fila}">${s.estado === "pausada" ? "Reanudar" : "Activar"}</button>`}</td></tr>`;
      }).join("") : `<tr><td colspan="6" class="hint">Todavía nadie se ha suscrito.</td></tr>`}</tbody></table></div>

    <section class="wpanel op-bono">
      <h3>El bono de bienvenida</h3>
      <p class="hint">A quien se une a la comunidad le llega solo un correo con un código de ${BONO_PCT_PANEL} % para su primer pedido, que vence a los 30 días. A los 23 días, si no lo ha usado, le llega un recordatorio.</p>
      <p><b class="mono">${fmtNum(bonos.entregados)}</b> entregados · <b class="mono">${fmtNum(bonos.usados)}</b> usados
        (${bonos.entregados ? fmtNum((bonos.usados / bonos.entregados) * 100) : 0} %) · <b class="mono">${fmtNum(bonos.vigentes)}</b> vigentes sin usar
        ${bonos.sinEnviar ? ` · <span class="err">${fmtNum(bonos.sinEnviar)} esperan cupo de Gmail (salen mañana)</span>` : ""}</p>
    </section>
  </section>`;
}
/* El panel no carga la tienda: el porcentaje es el mismo BONO.pct de Codigo.gs */
const BONO_PCT_PANEL = 10;

function opAvanzar(id) {
  const p = OP.datos.pedidos.find((x) => x.id === id); if (!p) return;
  const sig = OP_ESTADOS[p.estado]?.sig;
  if (sig !== "despachado") return opMandar({ accion: "pedido", id, estado: sig }, () => `${id}: ${OP_ESTADOS[sig].txt.toLowerCase()}.`);
  modal(`Despachar <em>${esc(id)}</em>`, `
    <p class="hint">${esc(p.nombre)} · ${esc(p.ciudad)}<br>${esc(p.productos).replace(/\n/g, "<br>")}</p>
    <div class="form-grid">
      <div class="field"><label class="lbl" for="op-transp">Transportadora</label><input id="op-transp" class="input" value="${esc(CONFIG.envio.transportadora)}"></div>
      <div class="field"><label class="lbl" for="op-guia">Número de guía</label><input id="op-guia" class="input mono" autocomplete="off"></div></div>
    <p class="hint">${p.correo ? `A ${esc(p.correo)} le llega la guía por correo.` : "Este pedido no dejó correo: mándale la guía por WhatsApp."}</p>
    <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="op-despachar-ok" data-id="${esc(id)}">Despachado</button></div>`, "narrow");
}
function opSubEnvio(fila) {
  const s = OP.datos.suscripciones.find((x) => x.fila === +fila); if (!s) return;
  modal("Registrar envío", `
    <p class="hint">${esc(s.correo)} · ${esc(opPlan(s.plan))} · molienda ${esc(s.molienda)}<br>La próxima fecha se corre ${Number(s.cada) === 2 ? "dos meses" : "un mes"}.</p>
    <div class="form-grid">
      <div class="field"><label class="lbl" for="op-transp">Transportadora</label><input id="op-transp" class="input" value="${esc(CONFIG.envio.transportadora)}"></div>
      <div class="field"><label class="lbl" for="op-guia">Número de guía</label><input id="op-guia" class="input mono" autocomplete="off"></div></div>
    <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="op-sub-envio-ok" data-id="${s.fila}">Enviado</button></div>`, "narrow");
}
function opSubActivar(fila) {
  const s = OP.datos.suscripciones.find((x) => x.fila === +fila); if (!s) return;
  modal(`${s.estado === "pausada" ? "Reanudar" : "Activar"} la suscripción`, `
    <p class="hint">${esc(s.correo)} · ${esc(opPlan(s.plan))}. Actívala cuando haya pagado.</p>
    <div class="field"><label class="lbl" for="op-proximo">Fecha del ${s.envios ? "próximo" : "primer"} envío</label><input id="op-proximo" class="input" type="date" value="${isoToday()}"></div>
    <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="op-sub-activar-ok" data-id="${s.fila}">Activar</button></div>`, "narrow");
}
const opGuia = () => ({ transportadora: ($("#op-transp")?.value || "").trim(), guia: ($("#op-guia")?.value || "").trim() });
const opAviso = (j) => (j.avisado ? " Le llegó la guía por correo." : "");

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act^='op-']"); if (!el || el.disabled) return;
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case "op-cargar": OP.error = null; return opCargar();
    case "op-filtro": OP.filtro = id; return render();
    case "op-avanzar": return opAvanzar(id);
    case "op-cancelar":
      return modal("Cancelar el pedido", `<p class="hint">El pedido <b>${esc(id)}</b> queda cancelado. No se le avisa al cliente.</p>
        <div class="dlg-actions"><button class="btn" data-act="close">Volver</button><button class="btn primary" data-act="op-cancelar-ok" data-id="${esc(id)}">Sí, cancelar</button></div>`, "narrow");
    case "op-cancelar-ok": return opMandar({ accion: "pedido", id, estado: "cancelado" }, () => `${id} cancelado.`);
    case "op-despachar-ok": {
      const g = opGuia(); if (!g.guia) return toast("Escribe el número de guía.", { type: "err" });
      return opMandar({ accion: "pedido", id, estado: "despachado", ...g }, (j) => `${id} despachado.${opAviso(j)}`);
    }
    case "op-sub-envio": return opSubEnvio(id);
    case "op-sub-envio-ok": {
      const g = opGuia(); if (!g.guia) return toast("Escribe el número de guía.", { type: "err" });
      return opMandar({ accion: "sub-envio", fila: +id, ...g }, (j) => `Envío registrado. El próximo: ${coFecha(j.proximo)}.${opAviso(j)}`);
    }
    case "op-sub-activar": return opSubActivar(id);
    case "op-sub-activar-ok": {
      const f = $("#op-proximo")?.value; if (!f) return toast("Escoge la fecha.", { type: "err" });
      return opMandar({ accion: "suscripcion", fila: +id, estado: "activa", proximo: f }, () => `Suscripción activa. Primer envío: ${coFecha(f)}.`);
    }
    case "op-sub": return opMandar({ accion: "suscripcion", fila: +id, estado: el.dataset.estado }, () => "Suscripción pausada.");
  }
});

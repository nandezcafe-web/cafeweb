/* ============================================================
   PANEL · CORREOS
   Los contactos que deja la página (comunidad, listas de espera,
   suscripción, cotizaciones, pedidos) viven en una Hoja de Google
   de Nandez, a través del script de tools/correos/Codigo.gs.
   Aquí se ven, se filtran por etiqueta, se exportan a CSV y se les
   escribe una campaña que sale desde Gmail. Todo gratis.
   La clave del script se guarda solo en el navegador de quien la pegó.
   ============================================================ */
const CO_KEY = "nandez-correos-clave";
const CO = { datos: null, cargando: false, error: null, etiqueta: "", buscar: "", resultado: null, borrador: { asunto: "", mensaje: "" } };
const coClave = () => { try { return localStorage.getItem(CO_KEY) || ""; } catch { return ""; } };
const coFecha = (v) => (v ? fmtFecha(String(v).slice(0, 10)) : "—");

function coCargar() {
  if (!CONFIG.registro || !coClave()) return;
  CO.cargando = true; CO.error = null; render();
  fetch(CONFIG.registro + "?accion=lista&clave=" + encodeURIComponent(coClave()))
    .then((r) => r.json())
    .then((j) => {
      CO.cargando = false;
      if (!j.ok) { CO.error = j.error === "clave" ? "La clave no coincide. Pégala de nuevo." : "El script respondió con un error."; if (j.error === "clave") coOlvidar(false); }
      else CO.datos = j;
      render();
    })
    .catch(() => { CO.cargando = false; CO.error = "No se pudo conectar con la hoja. Revisa la dirección del script y que esté publicado para cualquier persona."; render(); });
}
function coOlvidar(pintar = true) { try { localStorage.removeItem(CO_KEY); } catch {} CO.datos = null; if (pintar) render(); }

function coVisibles() {
  const q = CO.buscar.trim().toLowerCase();
  return (CO.datos?.contactos || []).filter((c) => (!CO.etiqueta || c.etiquetas.includes(CO.etiqueta))
    && (!q || `${c.correo} ${c.nombre || ""} ${c.ciudad || ""}`.toLowerCase().includes(q)));
}
const coDestinatarios = () => (CO.datos?.contactos || []).filter((c) => c.acepta && !c.baja && (!CO.etiqueta || c.etiquetas.includes(CO.etiqueta)));

function viewCorreos() {
  if (!CONFIG.registro) return `<section class="co-vacio">
      <p class="eyebrow">Correos</p><h2>Conecta la hoja de contactos</h2>
      <p class="hint">Los correos que deja la gente en la página todavía no se guardan en ningún lado. Se conectan una sola vez, gratis, con una Hoja de Google:</p>
      <ol class="co-pasos">
        <li>Entra a <b>script.google.com</b> con la cuenta de Nandez y crea un proyecto nuevo.</li>
        <li>Pega el archivo <code>tools/correos/Codigo.gs</code> y ejecuta la función <b>configurar</b>.</li>
        <li>Publícalo: Implementar → Aplicación web → acceso de cualquier persona.</li>
        <li>Pasa la dirección que termina en <code>/exec</code> para ponerla en <code>CONFIG.registro</code>.</li>
      </ol>
      <p class="hint">Los pasos con detalle están en <code>docs/12_correos_y_remarketing.md</code>.</p></section>`;
  if (!coClave()) return `<section class="co-vacio">
      <p class="eyebrow">Correos</p><h2>Pega la clave de la hoja</h2>
      <p class="hint">La clave aparece en el registro del script después de ejecutar <b>configurar</b>. Se guarda solo en este navegador.</p>
      <div class="co-fila"><input id="co-clave" class="input" type="password" autocomplete="off" placeholder="Clave del script">
        <button class="btn primary" data-act="co-clave">Guardar y cargar</button></div>
      ${CO.error ? `<p class="err">${esc(CO.error)}</p>` : ""}</section>`;
  if (!CO.datos && !CO.cargando && !CO.error) setTimeout(coCargar, 0);
  if (!CO.datos) return `<section class="co-vacio"><p class="eyebrow">Correos</p>
      <h2>${CO.error ? "No se pudo cargar" : "Cargando contactos…"}</h2>
      ${CO.error ? `<p class="err">${esc(CO.error)}</p><div class="co-fila"><button class="btn" data-act="co-cargar">Intentar otra vez</button>
        <button class="btn" data-act="co-olvidar">Cambiar la clave</button></div>` : ""}</section>`;

  const todos = CO.datos.contactos, aceptan = todos.filter((c) => c.acepta && !c.baja), bajas = todos.filter((c) => c.baja);
  const conteo = {};
  todos.forEach((c) => c.etiquetas.forEach((e) => { conteo[e] = (conteo[e] || 0) + 1; }));
  const etiquetas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  const lista = coVisibles(), para = coDestinatarios();
  const kpi = (n, txt) => `<div class="mkt"><small>${txt}</small><b class="mono co-n">${fmtNum(n)}</b></div>`;
  return `<section class="co">
    <div class="section-head co-head"><p class="eyebrow">Correos y remarketing</p>
      <h2>Quién nos dejó <em>su correo</em></h2>
      <p class="hint">Solo se le escribe publicidad a quien marcó la casilla de la comunidad. Las listas de espera reciben el aviso de su producto.</p>
      <div class="co-fila">
        <button class="btn sm" data-act="co-cargar">${CO.cargando ? "Actualizando…" : "Actualizar"}</button>
        <button class="btn sm" data-act="co-csv">Exportar CSV</button>
        <a class="btn sm" href="${esc(CO.datos.hoja)}" target="_blank" rel="noopener">Abrir la hoja</a>
        <button class="btn sm" data-act="co-olvidar">Cambiar la clave</button></div></div>

    <div class="mkt-grid">${kpi(todos.length, "Contactos")}${kpi(aceptan.length, "Aceptan correos")}${kpi(bajas.length, "Se dieron de baja")}${kpi(CO.datos.cuota, "Envíos que quedan hoy")}</div>

    <div class="co-etiquetas" role="group" aria-label="Filtrar por etiqueta">
      <button class="chip" aria-pressed="${!CO.etiqueta}" data-act="co-etiqueta" data-id="">Todos · ${todos.length}</button>
      ${etiquetas.map(([e, n]) => `<button class="chip" aria-pressed="${CO.etiqueta === e}" data-act="co-etiqueta" data-id="${esc(e)}">${esc(e)} · ${n}</button>`).join("")}
    </div>
    <input id="co-buscar" class="input co-buscar" type="search" placeholder="Buscar por correo, nombre o ciudad" value="${esc(CO.buscar)}">

    <div class="table-scroll"><table class="b2b-tabla co-tabla">
      <thead><tr><th>Correo</th><th>Etiquetas</th><th>Acepta correos</th><th>Alta</th><th>Último registro</th></tr></thead>
      <tbody>${lista.length ? lista.map((c) => `<tr>
        <th scope="row">${esc(c.correo)}${c.nombre || c.ciudad ? `<small>${esc([c.nombre, c.ciudad].filter(Boolean).join(" · "))}</small>` : ""}</th>
        <td>${c.etiquetas.map((e) => `<span class="co-tag">${esc(e)}</span>`).join(" ")}</td>
        <td>${c.baja ? `<span class="co-no">Baja ${coFecha(c.baja)}</span>` : c.acepta ? `<span class="co-si">Sí</span>` : `<span class="co-no">No</span>`}</td>
        <td class="mono">${coFecha(c.alta)}</td><td class="mono">${coFecha(c.ultimo)}</td></tr>`).join("")
        : `<tr><td colspan="5" class="hint">Todavía no hay contactos${CO.etiqueta || CO.buscar ? " con ese filtro" : ""}.</td></tr>`}</tbody></table></div>

    <section class="co-campana wpanel">
      <h3>Escribir una campaña</h3>
      <p class="hint">Sale desde el Gmail de Nandez con la marca, y cada correo trae su enlace para darse de baja.
        Va a <b>${fmtNum(para.length)}</b> ${para.length === 1 ? "persona" : "personas"}${CO.etiqueta ? ` con la etiqueta «${esc(CO.etiqueta)}»` : " que aceptan correos"}.
        ${para.length > CO.datos.cuota ? `Hoy alcanzan ${fmtNum(CO.datos.cuota)}; el resto queda contado para mañana.` : ""}</p>
      <div class="field"><label class="lbl" for="co-asunto">Asunto</label><input id="co-asunto" class="input" maxlength="150" placeholder="Salió el Tibo B" value="${esc(CO.borrador.asunto)}"></div>
      <div class="field"><label class="lbl" for="co-mensaje">Mensaje</label>
        <textarea id="co-mensaje" class="input co-mensaje" rows="8" placeholder="Escribe como le hablarías a un amigo. Deja una línea en blanco entre párrafos.">${esc(CO.borrador.mensaje)}</textarea></div>
      <div class="co-fila"><button class="btn" data-act="co-prueba">Enviarme una prueba</button>
        <button class="btn primary" data-act="co-enviar" ${para.length ? "" : "disabled"}>Enviar a ${fmtNum(Math.min(para.length, CO.datos.cuota))}</button></div>
      ${CO.resultado ? `<p class="hint co-resultado">${esc(CO.resultado)}</p>` : ""}
      ${CO.datos.envios?.length ? `<p class="lbl co-hist-t">Últimos envíos</p><ul class="co-hist">${CO.datos.envios.map((e) =>
        `<li><span class="mono">${coFecha(e.fecha)}</span> <b>${esc(e.asunto)}</b> · ${esc(e.para)} · ${fmtNum(e.enviados)} enviados${e.pendientes ? `, ${fmtNum(e.pendientes)} para mañana` : ""}</li>`).join("")}</ul>` : ""}
    </section>
  </section>`;
}

function coCSV() {
  const filas = [["correo", "nombre", "etiquetas", "acepta_correos", "alta", "ciudad"]]
    .concat(coVisibles().map((c) => [c.correo, c.nombre || "", c.etiquetas.join("; "), c.acepta && !c.baja ? "si" : "no", String(c.alta || "").slice(0, 10), c.ciudad || ""]));
  const csv = filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `nandez-contactos-${isoToday()}${CO.etiqueta ? "-" + slug(CO.etiqueta) : ""}.csv`;
  document.body.append(a); a.click(); a.remove();
}

function coEnviar(prueba) {
  const asunto = ($("#co-asunto")?.value || "").trim(), mensaje = ($("#co-mensaje")?.value || "").trim();
  if (!asunto || !mensaje) return toast("Escribe el asunto y el mensaje.", { type: "err" });
  CO.borrador = { asunto, mensaje };
  if (prueba) return coMandar(true);
  const n = Math.min(coDestinatarios().length, CO.datos.cuota);
  modal("Enviar la campaña", `<p class="hint">Vas a enviar «<b>${esc(asunto)}</b>» a <b>${fmtNum(n)}</b> ${n === 1 ? "persona" : "personas"}. Un correo enviado no se puede recoger.</p>
    <div class="dlg-actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="co-enviar-ok">Sí, enviar</button></div>`, "narrow");
}
function coMandar(prueba) {
  closeModal();
  CO.resultado = prueba ? "Enviando la prueba…" : "Enviando…"; render();
  fetch(CONFIG.registro, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ accion: "enviar", clave: coClave(), prueba: !!prueba, etiqueta: CO.etiqueta, ...CO.borrador }) })
    .then((r) => r.json())
    .then((j) => {
      CO.resultado = !j.ok ? (j.error === "clave" ? "La clave no coincide." : "No se pudo enviar: revisa el asunto y el mensaje.")
        : prueba ? "Listo: la prueba llegó a tu Gmail. Revísala antes de enviar."
        : `Enviados ${fmtNum(j.enviados)}.${j.pendientes ? ` Quedan ${fmtNum(j.pendientes)} para mañana: vuelve a enviar la misma campaña.` : ""}`;
      if (j.ok) CO.datos.cuota = j.cuota;
      render();
      if (j.ok && !prueba) coCargar();
    })
    .catch(() => { CO.resultado = "No se pudo conectar con el script."; render(); });
}

/* Las acciones de esta pestaña: el panel general deja pasar lo que no conoce */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act^='co-']"); if (!el || el.disabled) return;
  switch (el.dataset.act) {
    case "co-clave": {
      const v = ($("#co-clave")?.value || "").trim(); if (!v) return;
      try { localStorage.setItem(CO_KEY, v); } catch {}
      CO.error = null; return coCargar();
    }
    case "co-cargar": CO.error = null; return coCargar();
    case "co-olvidar": return coOlvidar();
    case "co-etiqueta": CO.etiqueta = el.dataset.id || ""; return render();
    case "co-csv": return coCSV();
    case "co-prueba": return coEnviar(true);
    case "co-enviar": return coEnviar(false);
    case "co-enviar-ok": return coMandar(false);
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "co-buscar") { CO.buscar = e.target.value; render(); }
  if (e.target.id === "co-asunto") CO.borrador.asunto = e.target.value;
  if (e.target.id === "co-mensaje") CO.borrador.mensaje = e.target.value;
});

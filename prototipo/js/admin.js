/* ============================================================
   PANEL INTERNO · aplicación aparte, no va en la página pública
   Entrada con correo y contraseña. No se guarda la contraseña:
   solo un verificador PBKDF2 (310.000 vueltas) con sal aleatoria.
   Para cambiarla:  node tools/clave.js "nueva contraseña"
   ============================================================ */
const AUTH = {
  correo: "9cbdfca2c4a1d804c916b1c3c55cc6b4",                                   // sha256(correo), primeros 32
  sal: "181eaf41d155f3402939f88bdc9c998b",
  clave: "2f08f481bccf330d4c0d3d211a847298420f96a7210b77ff9a6697f0a646ce8f",
  vueltas: 310000,
  sesion: "altura-admin-ok",
};

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const bytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

async function verificar(correo, clave) {
  const mailHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(correo.trim().toLowerCase()))).slice(0, 32);
  if (mailHash !== AUTH.correo) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: bytes(AUTH.sal), iterations: AUTH.vueltas, hash: "SHA-256" }, key, 256);
  return hex(bits) === AUTH.clave;
}

const sesionActiva = () => { try { return sessionStorage.getItem(AUTH.sesion) === "1"; } catch { return false; } };

function viewLogin() {
  return `<section class="login">
    <div class="login-card reveal">
      <svg class="mark" viewBox="0 0 28 20" aria-hidden="true"><path d="M1 19 L9 7 L13 12 L19 3 L27 19 Z" fill="currentColor"/></svg>
      <p class="eyebrow">${esc(CONFIG.marca)} · panel interno</p>
      <h1>Entrar</h1>
      <p class="hint">Cotizador, inventario, clientes y mercado. Esta parte no aparece en la página pública.</p>
      <form class="login-form" onsubmit="return false">
        <div class="field"><label class="lbl" for="lg-mail">Correo</label>
          <input id="lg-mail" class="input" type="email" autocomplete="username" placeholder="correo@dominio.com"></div>
        <div class="field"><label class="lbl" for="lg-pass">Contraseña</label>
          <input id="lg-pass" class="input" type="password" autocomplete="current-password"></div>
        <p class="err" id="lg-err" hidden>Correo o contraseña incorrectos.</p>
        <button class="btn primary lg" data-act="login" id="lg-btn">Entrar</button>
      </form>
    </div>
  </section>`;
}

async function entrar() {
  const b = $("#lg-btn"), err = $("#lg-err");
  b.disabled = true; b.textContent = "Comprobando…"; err.hidden = true;
  const ok = await verificar($("#lg-mail").value, $("#lg-pass").value);
  if (!ok) { b.disabled = false; b.textContent = "Entrar"; err.hidden = false; $("#lg-pass").select(); return; }
  try { sessionStorage.setItem(AUTH.sesion, "1"); } catch {}
  UI.animate = true; render();
}
function salir() { try { sessionStorage.removeItem(AUTH.sesion); } catch {} UI.animate = true; render(); }

/* ---------- panel ---------- */
const ATABS = [["cotizador", "Cotizador"], ["inventario", "Inventario"], ["clientes", "Clientes"], ["mercado", "Mercado"]];
const APANELS = { cotizador: viewCotizador, inventario: viewInventario, clientes: viewClientes, mercado: viewMercado };

function viewPanel() {
  const quieto = S.compras.reduce((s, c) => s + enJuego(c), 0);
  return `<div class="admin-bar reveal">
      <div><span class="lbl">${esc(CONFIG.marca)} · interno</span><b>Panel de administración</b></div>
      <div class="seg" role="group" aria-label="Secciones">
        ${ATABS.map(([k, t]) => `<button data-act="atab" data-tab="${k}" aria-pressed="${UI.atab === k}">${t}</button>`).join("")}
      </div>
      <div class="admin-side"><span class="mono" title="Plata sin recuperar">${copK(quieto)} en bodega</span>
        <button class="btn sm" data-act="salir">Salir</button></div>
    </div>
    <div class="admin-body">${APANELS[UI.atab]()}</div>`;
}

const FOOT = `<footer class="foot"><span>Panel interno de <b>${CONFIG.marca}</b>. Datos de ejemplo mientras no se carguen los reales.</span>
  <button class="btn sm" data-act="reset-demo">Reiniciar datos de la demo</button></footer>`;

function render() {
  const ae = document.activeElement, fid = ae && ae.id && !ae.closest("dialog") ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  const dentro = sesionActiva();
  document.body.dataset.view = dentro ? "panel" : "login";
  const v = $("#view");
  v.classList.toggle("calm", !UI.animate);
  v.innerHTML = dentro ? viewPanel() + FOOT : viewLogin();
  if (dentro && UI.atab === "cotizador") renderCot();
  if (UI.animate) countUp();
  UI.animate = false;
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus({ preventScroll: true }); if (sel) try { n.setSelectionRange(...sel); } catch {} } }
}
const softRefresh = () => render();
const go = () => {};            // el panel no navega a la página pública
function countUp() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = +el.dataset.count, dec = +el.dataset.dec || 0, pre = el.dataset.pre || "", suf = el.dataset.suf || "", t0 = performance.now();
    const stepFn = (now) => { const k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + fmtNum(target * e, dec) + suf; if (k < 1) requestAnimationFrame(stepFn); };
    requestAnimationFrame(stepFn);
  });
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
  const { act, id } = el.dataset;
  switch (act) {
    case "login": return entrar();
    case "salir": return salir();
    case "close": return closeModal();
    case "atab": UI.atab = el.dataset.tab; UI.animate = true; return render();
    case "cot-reset": UI.q = nuevaCot(); UI.animate = false; return render();
    case "cot-save": return cotSave();
    case "cot-save-ok": return cotSaveOk();
    case "mkt-save": return guardarMercado();
    case "inv-paso": return invPaso(id, el.dataset.p);
    case "inv-paso-ok": return invPasoOk();
    case "cl-ver": return clienteVer(id);
    case "cl-wa": return clienteWa(id);
    case "cl-nuevo": return clienteNuevo(id);
    case "cl-guardar": return clienteGuardar();
    case "reset-demo":
      try { localStorage.removeItem(CONFIG.storageKey); } catch {}
      S = seed(); UI.q = null; UI.animate = true; return render();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.target.id === "lg-mail" || e.target.id === "lg-pass")) { e.preventDefault(); entrar(); }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.q && UI.q) { UI.q[t.dataset.q] = t.type === "number" ? (parseFloat(t.value) || 0) : t.value; renderCot(); }
});
$("#dlg").addEventListener("click", (e) => { if (e.target === $("#dlg")) closeModal(); });

aplicarCfgGuardada();
render();

/* ============================================================
   PANEL INTERNO · aplicación aparte, no va en la página pública
   Solo el seguimiento de la página: pedidos, actividad, stock y
   correos. El inventario por lote, los costos, el cotizador y el
   mercado van en otro panel (quote.js, inventory.js, clients.js y
   market.js siguen en el repositorio para ese, pero aquí no se cargan).
   Entra cada quien con su correo y su contraseña (ver AUTH, abajo).
   ============================================================ */
/* Quién puede entrar. Una línea por persona: el correo no se guarda en claro,
   solo su huella (sha256, primeros 32), y la contraseña tampoco, solo un
   verificador PBKDF2 de 310.000 vueltas con su propia sal. La etiqueta es para
   poder listarlas y quitarlas desde la consola; con ella no se entra.
     Agregar o cambiar:  node tools/clave.js "la contraseña" correo@dominio.com
     Quitar:             node tools/clave.js --quitar etiqueta
     Ver quiénes hay:    node tools/clave.js --lista */
const AUTH = {
  cuentas: [
    { etiqueta: "nandezcafe", correo: "9cbdfca2c4a1d804c916b1c3c55cc6b4", sal: "580570908cf1f921f0fbb4b90a7db886", clave: "9407fe73eb4bbab1b186b11be0e38697e10c773aefec81f9c02f90ba6f3b48e9" },
    { etiqueta: "ana", correo: "ea8fd4a36706f0d9120839357cf811e7", sal: "6681f3d5da40707969224518ea03a486", clave: "105b6084865a359cb72a0556fe483b97e402c03bbe2bab323ccd2f7332e1f924" },
  ],
  vueltas: 310000,
  sesion: "altura-admin-ok",
};

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const bytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

/* Se prueban todas las cuentas hasta el final, aunque la primera ya calce: si
   se cortara en la que coincide, el tiempo de respuesta diría qué correos
   existen. Por eso también se deriva la clave para las que no coinciden. */
async function verificar(correo, clave) {
  const mailHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(correo.trim().toLowerCase()))).slice(0, 32);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveBits"]);
  let entra = false;
  for (const c of AUTH.cuentas) {
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: bytes(c.sal), iterations: AUTH.vueltas, hash: "SHA-256" }, key, 256);
    if (c.correo === mailHash && hex(bits) === c.clave) entra = true;
  }
  return entra;
}

const sesionActiva = () => { try { return sessionStorage.getItem(AUTH.sesion) === "1"; } catch { return false; } };

function viewLogin() {
  return `<section class="login">
    <div class="login-card reveal">
      <svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="12" cy="6.6" rx="3.3" ry="5.4" transform="rotate(${r} 12 12)"/>`).join("")}</g><circle cx="12" cy="12" r="1.3" fill="var(--paper)"/></svg>
      <p class="eyebrow">${esc(CONFIG.marca)} · panel interno</p>
      <h1>Entrar</h1>
      <p class="hint">Pedidos, actividad de la página, stock y correos. Esta parte no aparece en la página pública.</p>
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
const ATABS = [["pedidos", "Pedidos"], ["actividad", "Actividad"], ["stock", "Stock"], ["correos", "Correos"]];
const APANELS = { pedidos: viewOperacion, actividad: viewActividad, stock: viewStock, correos: viewCorreos };

function viewPanel() {
  if (!APANELS[UI.atab]) UI.atab = "pedidos";
  return `<div class="admin-bar reveal">
      <div><span class="lbl">${esc(CONFIG.marca)} · interno</span><b>Panel de administración</b></div>
      <div class="seg" role="group" aria-label="Secciones">
        ${ATABS.map(([k, t]) => `<button data-act="atab" data-tab="${k}" aria-pressed="${UI.atab === k}">${t}</button>`).join("")}
      </div>
      <div class="admin-side"><button class="btn sm" data-act="salir">Salir</button></div>
    </div>
    <div class="admin-body">${APANELS[UI.atab]()}</div>`;
}

const FOOT = `<footer class="foot"><span>Panel interno de <b>${CONFIG.marca}</b>. Todo lo que ves aquí sale de la Hoja de Google.</span></footer>`;

function render() {
  const ae = document.activeElement, fid = ae && ae.id && !ae.closest("dialog") ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  const dentro = sesionActiva();
  document.body.dataset.view = dentro ? "panel" : "login";
  const v = $("#view");
  v.classList.toggle("calm", !UI.animate);
  v.innerHTML = dentro ? viewPanel() + FOOT : viewLogin();
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
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.target.id === "lg-mail" || e.target.id === "lg-pass")) { e.preventDefault(); entrar(); }
});
$("#dlg").addEventListener("click", (e) => { if (e.target === $("#dlg")) closeModal(); });

render();

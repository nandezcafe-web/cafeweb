/* ============================================================
   ALTURA · núcleo: configuración, datos, estado y utilidades
   Modelo: compramos café a pequeños productores, le ponemos marca y lo vendemos.
   La página pública vende DOS cosas: el Geisha y el lote en subasta.
   Datos de ejemplo — reemplazar por los reales.
   ============================================================ */
const CONFIG = {
  fnc: { precioCarga: 2005000, factorBase: 94, fecha: "2026-09-16" },  // referencia del día (editable en Mercado)
  mercado: { ny: 282, trm: 3128 },
  storageKey: "altura-v5",
  whatsapp: "",            // 573001234567 para que los pedidos salgan solos
  marca: "Altura",
  lugar: "Chinácota, Norte de Santander",
};

/* Supuestos de costos: cámbialos por tus cotizaciones reales */
const COSTOS = {
  transporte: 300, trilla: 500, tueste: 5000, empaque: 1300,
  indirectos: 8, mermaTueste: 17, cerezaAPergamino: 5,
  margenObjetivo: 35, primaSugerida: 15,
};

const LV = {
  DECLARADO:   { label: "Declarado",   c: "var(--ink-3)", k: 1, desc: "Lo dice el productor.", ej: "Variedad" },
  DOCUMENTADO: { label: "Documentado", c: "var(--doc)",   k: 2, desc: "Hay un documento que lo respalda.", ej: "Informe de trilla" },
  VERIFICADO:  { label: "Verificado",  c: "var(--leaf)",  k: 3, desc: "Lo comprobamos nosotros o un tercero.", ej: "Catación Q-grader" },
  CERTIFICADO: { label: "Certificado", c: "var(--gold)",  k: 4, desc: "Lo avala una entidad competente.", ej: "Sello orgánico" },
};
const PROC_COLOR = { Lavado: "#3f6a4b", Natural: "#9c3322", Honey: "#b98330", "Anaeróbico": "#6b3a5c" };
const A = (v, nivel, fuente, fecha, extra = {}) => ({ v, nivel, fuente, fecha, ...extra });

function seed() {
  return {
    v: 5, seq: 300,
    /* ---------- EL CAFÉ QUE VENDEMOS ---------- */
    productos: [
      {
        id: "P-GEI", loteId: "C-001", nombre: "Geisha de Chinácota", sub: "Lavado · cosecha 2026",
        productor: "Familia fundadora", finca: "Finca Ejemplo A", municipio: "Chinácota", origen: "Finca Ejemplo A · Chinácota",
        variedad: "Geisha", proceso: "Lavado", tueste: "Medio-claro", cosecha: "Principal 2026",
        altitud: 1750, puntaje: 88, nivel: "VERIFICADO", fuente: "Q-grader independiente", fecha: "2026-09-02",
        notas: ["Jazmín", "Bergamota", "Durazno", "Té blanco"],
        /* la ficha de transparencia */
        ficha: {
          variedad: A("Geisha", "DECLARADO", "Productor", "2026-06-10"),
          altitud: A(1750, "VERIFICADO", "GPS en visita de campo", "2026-06-10"),
          proceso: A("Lavado", "DOCUMENTADO", "Bitácora con fotos", "2026-06-22", { detalle: "Fermentación 36 h · Marquesina 18 días" }),
          puntaje: A(88, "VERIFICADO", "Q-grader independiente", "2026-09-02", { vig: 6 }),
          factor: A(91, "DOCUMENTADO", "Informe de trilla", "2026-07-02"),
          cosecha: A("Principal 2026", "DECLARADO", "Productor", "2026-06-10"),
        },
        pago: { pagadoKg: 26000, referenciaKg: 16040, fecha: "2026-06-25" },   // lo que pagamos vs. el precio del día
        historia: "Tres mil palos de Geisha sembrados en la finca de la familia, a 1.750 metros. Esta es la primera cosecha que sale con nombre propio: 60 kilos de pergamino que dieron 153 bolsas y nada más.",
        receta: { metodo: "V60", dosis: "15 g", agua: "250 ml", temp: "93 °C", tiempo: "2:45", molienda: "Media" },
        variantes: [
          { g: 100, precio: 32000, label: "Muestra", nota: "para probarlo antes", stock: 38 },
          { g: 250, precio: 68000, label: "Bolsa", nota: "lo que compra la mayoría", stock: 74, principal: true },
          { g: 1000, precio: 245000, label: "Kilo", nota: "para cafeterías", stock: 6 },
        ],
        /* espejo plano para los módulos internos */
        presentacion: 250, precio: 68000, stock: 74, destacado: true,
      },
    ],

    /* ---------- CAFÉ COMPRADO ---------- */
    compras: [
      { id: "C-001", productor: "Familia fundadora", finca: "Finca Ejemplo A", municipio: "Chinácota", fecha: "2026-06-25",
        estadoCafe: "Pergamino seco", kg: 60, factor: 91, humedad: 11, precioKg: 26000, sca: 88, destino: "Tostado", estado: "EMPACADO",
        kgVerde: 46.2, kgTostado: 38.3, bolsas: 153, bolsasVendidas: 79, precioVenta: 68000, ingresos: 5372000,
        costos: { compra: 1560000, trilla: 30000, tueste: 231000, empaque: 199000 } },
      { id: "C-002", productor: "Productor aliado", finca: "Finca del aliado", municipio: "Toledo", fecha: "2026-09-02",
        estadoCafe: "Pergamino seco", kg: 45, factor: 89, humedad: 11, precioKg: 34000, sca: 88.5, destino: "Subasta", estado: "TRILLADO",
        kgVerde: 35.4, costos: { compra: 1530000, trilla: 22500 } },
      { id: "C-003", productor: "Doña Ejemplo", finca: "Finca Ejemplo C", municipio: "Arboledas", fecha: "2026-09-12",
        estadoCafe: "Pergamino seco", kg: 180, factor: 94, humedad: 11.5, precioKg: 17000, sca: 83.5, destino: "Por definir", estado: "EN BODEGA",
        costos: { compra: 3060000 } },
    ],

    /* ---------- CLIENTES Y PEDIDOS ---------- */
    clientes: [
      { id: "CL-001", nombre: "Café Ejemplo Centro", tipo: "Cafetería", ciudad: "Cúcuta", tel: "300 111 1111" },
      { id: "CL-002", nombre: "Tostaduría Ejemplo", tipo: "Tostador", ciudad: "Bucaramanga", tel: "300 222 2222" },
      { id: "CL-003", nombre: "Tienda Ejemplo Pamplona", tipo: "Tienda", ciudad: "Pamplona", tel: "300 333 3333" },
      { id: "CL-004", nombre: "Ana Ejemplo", tipo: "Persona", ciudad: "Bogotá", tel: "" },
    ],
    pedidos: [
      { id: "PD-101", clienteId: "CL-001", nombre: "Café Ejemplo Centro", ciudad: "Cúcuta", fecha: "2026-09-08", canal: "tienda",
        items: [{ id: "P-GEI", nombre: "Geisha 250 g", n: 12, precio: 68000 }], total: 816000 },
      { id: "PD-102", clienteId: "CL-001", nombre: "Café Ejemplo Centro", ciudad: "Cúcuta", fecha: "2026-08-11", canal: "tienda",
        items: [{ id: "P-GEI", nombre: "Geisha 250 g", n: 10, precio: 68000 }], total: 680000 },
      { id: "PD-103", clienteId: "CL-002", nombre: "Tostaduría Ejemplo", ciudad: "Bucaramanga", fecha: "2026-08-28", canal: "tienda",
        items: [{ id: "P-GEI", nombre: "Geisha 1 kg", n: 4, precio: 245000 }], total: 980000 },
      { id: "PD-104", clienteId: "CL-002", nombre: "Tostaduría Ejemplo", ciudad: "Bucaramanga", fecha: "2026-06-30", canal: "tienda",
        items: [{ id: "P-GEI", nombre: "Geisha 1 kg", n: 3, precio: 245000 }], total: 735000 },
      { id: "PD-105", clienteId: "CL-003", nombre: "Tienda Ejemplo Pamplona", ciudad: "Pamplona", fecha: "2026-05-18", canal: "directo",
        items: [{ id: "P-GEI", nombre: "Geisha 250 g", n: 8, precio: 68000 }], total: 544000 },
      { id: "PD-106", clienteId: "CL-004", nombre: "Ana Ejemplo", ciudad: "Bogotá", fecha: "2026-09-14", canal: "tienda",
        items: [{ id: "P-GEI", nombre: "Geisha 100 g", n: 2, precio: 32000 }], total: 64000 },
    ],
    espera: [],   // lista de espera del próximo lote
  };
}

function load() { try { const s = JSON.parse(localStorage.getItem(CONFIG.storageKey)); return s && s.v === 5 ? s : null; } catch { return null; } }
function save() { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(S)); } catch {} }

let S = load() || seed();
const UI = { view: "inicio", atab: "cotizador", animate: true, carrito: [], au: null, q: null };

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtNum = (n, dec = 0) => Number(n || 0).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const cop = (n) => "$" + fmtNum(Math.round(n || 0));
const copK = (n) => (Math.abs(n) >= 1e6 ? "$" + fmtNum(n / 1e6, 1) + " M" : cop(n));
const isoToday = () => new Date().toISOString().slice(0, 10);
const fmtFecha = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "";
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");
const nextId = (p) => `${p}-${S.seq++}`;
const num = (id, def = 0) => { const el = $("#" + id); const v = el ? parseFloat(el.value) : NaN; return isNaN(v) ? def : v; };
const geisha = () => S.productos.find((p) => p.id === "P-GEI") || S.productos[0];
const gramos = (g) => (g >= 1000 ? g / 1000 + " kg" : g + " g");

function precioComiteKg(factor = CONFIG.fnc.factorBase) {
  return (CONFIG.fnc.precioCarga * (CONFIG.fnc.factorBase / factor)) / 125;
}
const pesoSeco12 = (kg, humedad) => (humedad > 12 ? kg * ((100 - humedad) / 88) : kg);
const kgExcelso = (kgPergamino, factor) => kgPergamino * (70 / factor);

/* Referencias del día guardadas en el navegador */
function aplicarCfgGuardada() {
  if (S.cfg?.fnc) Object.assign(CONFIG.fnc, S.cfg.fnc);
  if (S.cfg?.mercado) Object.assign(CONFIG.mercado, S.cfg.mercado);
}

/* ---------- montaña: la altitud como firma visual ---------- */
function rng(seedStr) {
  let a = 0; for (const ch of String(seedStr)) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function ridge(o, { w = 320, h = 150, dark = false, label = true } = {}) {
  const r = rng(o.id || o.nombre || "x"), alt = +(o.altitud?.v ?? o.altitud) || 1500, t = Math.min(1, Math.max(0.08, (alt - 1000) / 1200));
  const col = PROC_COLOR[o.proceso?.v ?? o.proceso] || "#6a5646";
  const peakX = w * (0.5 + r() * 0.3), peakY = h * (0.92 - t * 0.6);
  const layer = (amp, off, jit) => {
    let d = `M0 ${h}`;
    for (let i = 0; i <= 14; i++) {
      const x = (w * i) / 14, dist = Math.abs(x - peakX) / w;
      const y = Math.min(h, Math.max(peakY + off, peakY + off + dist * h * amp + (r() - 0.5) * jit));
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + ` L${w} ${h} Z`;
  };
  const gid = "g" + Math.random().toString(36).slice(2, 9);
  const lineCol = dark ? "rgba(243,230,214,.5)" : "rgba(29,20,15,.4)";
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset="1" stop-color="${col}" stop-opacity="${dark ? 0.25 : 0.5}"/></linearGradient></defs>
    <path d="${layer(0.5, h * 0.12, 14)}" fill="${col}" opacity="${dark ? 0.28 : 0.2}"/>
    <path class="front" d="${layer(1.05, 0, 10)}" fill="url(#${gid})"/>
    ${label ? `<line x1="0" x2="${w}" y1="${peakY}" y2="${peakY}" stroke="${lineCol}" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>` : ""}
  </svg>${label ? `<span class="alt-label" style="top:${((peakY / h) * 100).toFixed(1)}%">${fmtNum(alt)} msnm</span>` : ""}`;
}

/* ---------- modal y avisos ---------- */
function modal(title, body, cls = "") {
  const d = $("#dlg"); d.className = cls;
  $("#dlg-title").innerHTML = title; $("#dlg-body").innerHTML = body;
  d.querySelector(".dlg-body").scrollTop = 0;
  if (!d.open) d.showModal();
}
const closeModal = () => $("#dlg").open && $("#dlg").close();

function toast(msg, { label, act, type } = {}) {
  const t = document.createElement("div");
  t.className = "toast " + (type || "");
  t.innerHTML = `<span class="t-ico"></span><span>${msg}</span>`;
  const kill = () => { t.classList.add("out"); setTimeout(() => t.remove(), 300); };
  if (label) { const b = document.createElement("button"); b.className = "tbtn"; b.textContent = label; b.onclick = () => { act(); kill(); }; t.append(b); }
  $("#toasts").append(t);
  setTimeout(kill, label ? 7000 : 4200);
}
function later(ms, fn) { setTimeout(() => { if (fn() !== false) { save(); softRefresh(); } }, ms); }

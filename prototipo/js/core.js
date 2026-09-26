/* ============================================================
   NANDEZ CAFÉ · núcleo: configuración, idioma, datos y utilidades
   Compramos café a fincas de Norte de Santander, cada una con su
   variedad; los lotes excepcionales van a subasta. Más adelante
   entra el café de nuestra propia tierra.
   Textos y fotos: PENDIENTES, los pone el cliente.
   ============================================================ */
const CONFIG = {
  marca: "Nandez Café",
  lugar: { es: "Norte de Santander, Colombia", en: "Norte de Santander, Colombia" },
  fnc: { precioCarga: 2005000, factorBase: 94, fecha: "2026-09-16" },
  mercado: { ny: 282, trm: 3128 },
  storageKey: "nandez-v6",
  whatsapp: "",                 // 573001234567
  correo: "nandezcafe@gmail.com",
  /* Pagos. Mientras no haya links, el pedido sale por WhatsApp o correo.
     Ver docs/06_pagos_y_suscripciones.md */
  pagos: {
    mercadoPago: "",            // link de pago general o Checkout Pro (/api/checkout)
    porProducto: {},            // { "C-GEI-250": "https://mpago.la/xxxx" }
    suscripcion: {},            // { descubrir: "https://mpago.la/xxxx" }
  },
};

const COSTOS = { transporte: 300, trilla: 500, tueste: 5000, empaque: 1300, indirectos: 8,
  mermaTueste: 17, cerezaAPergamino: 5, margenObjetivo: 35, primaSugerida: 15 };

const LV = {
  DECLARADO:   { label: { es: "Declarado", en: "Stated" },     c: "var(--ink-3)", k: 1, desc: { es: "Lo dice el productor.", en: "Stated by the producer." } },
  DOCUMENTADO: { label: { es: "Documentado", en: "Documented" }, c: "var(--doc)",  k: 2, desc: { es: "Hay un documento que lo respalda.", en: "Backed by a document." } },
  VERIFICADO:  { label: { es: "Verificado", en: "Verified" },   c: "var(--leaf)", k: 3, desc: { es: "Lo comprobamos nosotros o un tercero.", en: "Checked by us or a third party." } },
  CERTIFICADO: { label: { es: "Certificado", en: "Certified" }, c: "var(--gold)", k: 4, desc: { es: "Lo avala una entidad competente.", en: "Backed by a certifying body." } },
};
const PROC_COLOR = { Lavado: "#3f6a4b", Natural: "#9c3322", Honey: "#b98330", "Anaeróbico": "#6b3a5c" };
const A = (v, nivel, fuente, fecha, extra = {}) => ({ v, nivel, fuente, fecha, ...extra });

/* ---------- idioma ---------- */
const T = {
  nav_inicio: { es: "Inicio", en: "Home" }, nav_cafes: { es: "Cafés", en: "Coffees" },
  nav_subasta: { es: "Subasta", en: "Auction" }, nav_suscripcion: { es: "Suscripción", en: "Subscription" },
  nav_diario: { es: "Diario", en: "Journal" },
  comprar: { es: "Comprar", en: "Buy" }, agregar: { es: "Agregar al pedido", en: "Add to order" },
  ver_cafe: { es: "Ver el café", en: "View coffee" }, agotado: { es: "Agotado", en: "Sold out" },
  pedido: { es: "Tu pedido", en: "Your order" }, total: { es: "Total", en: "Total" },
  pagar_mp: { es: "Pagar con Mercado Pago", en: "Pay with Mercado Pago" },
  pedir_wa: { es: "Pedir por WhatsApp", en: "Order on WhatsApp" },
  seguir: { es: "Seguir viendo", en: "Keep browsing" },
  disponibles: { es: "disponibles", en: "available" }, por_kg: { es: "por kg", en: "per kg" },
  ficha: { es: "La ficha", en: "The data" }, receta: { es: "Cómo prepararlo", en: "How to brew it" },
  pagado: { es: "Le pagamos al productor", en: "We paid the producer" },
  referencia: { es: "Precio de referencia ese día", en: "Reference price that day" },
  sobre_ref: { es: "por encima de la referencia", en: "above the reference" },
  pendiente: { es: "Contenido por confirmar", en: "Content to be confirmed" },
  leer: { es: "Leer", en: "Read" }, volver: { es: "Volver", en: "Back" },
  en_vivo: { es: "en vivo", en: "live" }, cerrada: { es: "cerrada", en: "closed" },
  suscribirme: { es: "Suscribirme", en: "Subscribe" }, mes: { es: "al mes", en: "per month" },
};
const t = (k) => (T[k] ? T[k][UI.lang] || T[k].es : k);
const tx = (o) => (o && typeof o === "object" && !Array.isArray(o) ? (o[UI.lang] ?? o.es) : o);
const lvl = (nivel) => tx(LV[nivel].label);

function seed() {
  return {
    v: 6, seq: 400,

    /* ---------- FINCAS ALIADAS ---------- */
    fincas: [
      { id: "F-01", productor: "Domingo Torres", finca: "Finca por confirmar", municipio: "Toledo", altitud: 1950,
        variedad: "Geisha", exclusiva: true, premios: { es: "Ganador de concursos de calidad (por confirmar)", en: "Quality competition winner (to be confirmed)" },
        historia: { es: "PENDIENTE: la historia de don Domingo, cuántos años lleva con el Geisha y qué premios ha ganado.",
                    en: "PENDING: Domingo's story, how long he has grown Geisha and which awards he has won." }, pendiente: true },
      { id: "F-02", productor: "Productor por confirmar", finca: "Lote Chinácota", municipio: "Chinácota", altitud: 1750,
        variedad: "Bourbon rosado", exclusiva: false,
        historia: { es: "PENDIENTE: quién cultiva este lote y por qué su café sabe distinto.", en: "PENDING: who grows this lot and why it tastes different." }, pendiente: true },
      { id: "F-03", productor: "Productor por confirmar", finca: "Lote Arboledas", municipio: "Arboledas", altitud: 1550,
        variedad: "Castillo", exclusiva: false,
        historia: { es: "PENDIENTE: historia de la finca.", en: "PENDING: farm story." }, pendiente: true },
      { id: "F-00", productor: "Familia Nández", finca: "Nuestra finca", municipio: "Chinácota", altitud: 1750,
        variedad: "Geisha", exclusiva: true, propia: true, proxima: 2027,
        historia: { es: "Tres mil palos de Geisha sembrados por la familia. La primera cosecha con nuestro nombre sale en 2027.",
                    en: "Three thousand Geisha trees planted by the family. Our first harvest under our own name arrives in 2027." } },
    ],

    /* ---------- CAFÉS A LA VENTA ---------- */
    productos: [
      { id: "P-GEI", fincaId: "F-02", loteId: "C-001",
        nombre: { es: "Bourbon rosado", en: "Pink Bourbon" }, sub: { es: "Lavado · cosecha 2026", en: "Washed · 2026 harvest" },
        variedad: "Bourbon rosado", proceso: "Lavado", tueste: { es: "Medio-claro", en: "Medium-light" }, cosecha: "2026",
        altitud: 1750, puntaje: 87.5, nivel: "VERIFICADO", fuente: "Q-grader", fecha: "2026-09-02",
        notas: { es: ["Jazmín", "Bergamota", "Durazno"], en: ["Jasmine", "Bergamot", "Peach"] },
        ficha: {
          variedad: A("Bourbon rosado", "DECLARADO", "Productor", "2026-06-10"),
          altitud: A(1750, "VERIFICADO", "GPS en visita de campo", "2026-06-10"),
          proceso: A("Lavado", "DOCUMENTADO", "Bitácora con fotos", "2026-06-22", { detalle: "Fermentación 36 h · Marquesina 18 días" }),
          puntaje: A(87.5, "VERIFICADO", "Q-grader independiente", "2026-09-02", { vig: 6 }),
          factor: A(91, "DOCUMENTADO", "Informe de trilla", "2026-07-02"),
        },
        pago: { pagadoKg: 26000, referenciaKg: 16040, fecha: "2026-06-25" },
        receta: { metodo: "V60", dosis: "15 g", agua: "250 ml", temp: "93 °C", tiempo: "2:45", molienda: { es: "Media", en: "Medium" } },
        variantes: [
          { g: 100, precio: 32000, label: { es: "Muestra", en: "Sample" }, nota: { es: "para probarlo", en: "try it first" }, stock: 38 },
          { g: 250, precio: 68000, label: { es: "Bolsa", en: "Bag" }, nota: { es: "lo más pedido", en: "most ordered" }, stock: 74, principal: true },
          { g: 1000, precio: 245000, label: { es: "Kilo", en: "Kilo" }, nota: { es: "para cafeterías", en: "for cafés" }, stock: 6 },
        ],
        presentacion: 250, precio: 68000, stock: 74, destacado: true },

      { id: "P-CAS", fincaId: "F-03", loteId: "C-003",
        nombre: { es: "Castillo de Arboledas", en: "Castillo from Arboledas" }, sub: { es: "Lavado · cosecha 2026", en: "Washed · 2026 harvest" },
        variedad: "Castillo", proceso: "Lavado", tueste: { es: "Medio", en: "Medium" }, cosecha: "2026",
        altitud: 1550, puntaje: 84, nivel: "DOCUMENTADO", fuente: "Catación propia", fecha: "2026-09-14",
        notas: { es: ["Panela", "Chocolate", "Naranja"], en: ["Brown sugar", "Chocolate", "Orange"] },
        ficha: {
          variedad: A("Castillo", "DECLARADO", "Productor", "2026-09-12"),
          altitud: A(1550, "DECLARADO", "Productor", "2026-09-12"),
          proceso: A("Lavado", "DECLARADO", "Productor", "2026-09-12", { detalle: "Fermentación 18 h" }),
          puntaje: A(84, "DOCUMENTADO", "Catación propia", "2026-09-14", { vig: 6 }),
          factor: A(94, "DOCUMENTADO", "Informe de trilla", "2026-09-13"),
        },
        pago: { pagadoKg: 17000, referenciaKg: 16040, fecha: "2026-09-12" },
        receta: { metodo: "Prensa francesa", dosis: "30 g", agua: "500 ml", temp: "94 °C", tiempo: "4:00", molienda: { es: "Gruesa", en: "Coarse" } },
        variantes: [
          { g: 250, precio: 38000, label: { es: "Bolsa", en: "Bag" }, nota: { es: "el de todos los días", en: "the everyday one" }, stock: 90, principal: true },
          { g: 1000, precio: 132000, label: { es: "Kilo", en: "Kilo" }, nota: { es: "para cafeterías", en: "for cafés" }, stock: 14 },
        ],
        presentacion: 250, precio: 38000, stock: 90 },
    ],

    /* ---------- SUSCRIPCIÓN ---------- */
    planes: [
      { id: "descubrir", nombre: { es: "Descubrir", en: "Discover" }, precio: 68000, envios: 1,
        desc: { es: "Una bolsa de 250 g al mes, siempre del lote más reciente.", en: "One 250 g bag a month, always from the newest lot." },
        incluye: { es: ["250 g cada mes", "Ficha del lote en cada envío", "Cancelas cuando quieras"], en: ["250 g every month", "Lot data sheet in every shipment", "Cancel anytime"] } },
      { id: "dos", nombre: { es: "Dos fincas", en: "Two farms" }, precio: 120000, envios: 2, destacado: true,
        desc: { es: "Dos bolsas de 250 g de fincas distintas, para comparar en la misma semana.", en: "Two 250 g bags from different farms, to compare side by side." },
        incluye: { es: ["2 × 250 g cada mes", "Dos orígenes distintos", "Acceso anticipado a la subasta", "Cancelas cuando quieras"], en: ["2 × 250 g monthly", "Two different origins", "Early access to the auction", "Cancel anytime"] } },
      { id: "cafeteria", nombre: { es: "Cafetería", en: "Café" }, precio: 460000, envios: 2,
        desc: { es: "Dos kilos al mes, con precio de mayorista y entrega programada.", en: "Two kilos a month at wholesale price, scheduled delivery." },
        incluye: { es: ["2 kg cada mes", "Precio de mayorista", "Tostión a tu perfil", "Material para tu carta"], en: ["2 kg monthly", "Wholesale price", "Roast to your profile", "Menu material"] } },
    ],

    /* ---------- DIARIO (blog) — PENDIENTE de contenido real ---------- */
    entradas: [
      { id: "B-01", fecha: "2026-09-20", tag: { es: "Origen", en: "Origin" },
        titulo: { es: "Por qué el factor de rendimiento decide el precio de tu café", en: "Why yield factor decides what your coffee costs" },
        resumen: { es: "PENDIENTE. Explicar en palabras simples qué es el factor, cómo se mide y por qué dos bultos iguales valen distinto.", en: "PENDING. Explain in plain words what the yield factor is and why two identical sacks are worth different amounts." },
        cuerpo: { es: "PENDIENTE: texto de la entrada.", en: "PENDING: post body." } },
      { id: "B-02", fecha: "2026-09-10", tag: { es: "Finca", en: "Farm" },
        titulo: { es: "Un día en la finca de don Domingo", en: "A day at Domingo's farm" },
        resumen: { es: "PENDIENTE. La visita, el beneficio, el secado y por qué su Geisha gana concursos.", en: "PENDING. The visit, the processing, the drying and why his Geisha wins competitions." },
        cuerpo: { es: "PENDIENTE: texto de la entrada.", en: "PENDING: post body." } },
      { id: "B-03", fecha: "2026-08-28", tag: { es: "Taza", en: "Cup" },
        titulo: { es: "Cómo preparar en casa un café que costó una cosecha", en: "How to brew, at home, a coffee that took a whole harvest" },
        resumen: { es: "PENDIENTE. Receta base, errores comunes y cómo ajustar la molienda.", en: "PENDING. Base recipe, common mistakes and how to adjust the grind." },
        cuerpo: { es: "PENDIENTE: texto de la entrada.", en: "PENDING: post body." } },
    ],

    /* ---------- INTERNO ---------- */
    compras: [
      { id: "C-001", productor: "Lote Chinácota", finca: "Lote Chinácota", municipio: "Chinácota", fecha: "2026-06-25",
        estadoCafe: "Pergamino seco", kg: 60, factor: 91, humedad: 11, precioKg: 26000, sca: 87.5, destino: "Tostado", estado: "EMPACADO",
        kgVerde: 46.2, kgTostado: 38.3, bolsas: 153, bolsasVendidas: 79, precioVenta: 68000, ingresos: 5372000,
        costos: { compra: 1560000, trilla: 30000, tueste: 231000, empaque: 199000 } },
      { id: "C-002", productor: "Domingo Torres", finca: "Finca por confirmar", municipio: "Toledo", fecha: "2026-09-02",
        estadoCafe: "Pergamino seco", kg: 45, factor: 89, humedad: 11, precioKg: 34000, sca: 88.5, destino: "Subasta", estado: "TRILLADO",
        kgVerde: 35.4, costos: { compra: 1530000, trilla: 22500 } },
      { id: "C-003", productor: "Lote Arboledas", finca: "Lote Arboledas", municipio: "Arboledas", fecha: "2026-09-12",
        estadoCafe: "Pergamino seco", kg: 180, factor: 94, humedad: 11.5, precioKg: 17000, sca: 84, destino: "Tostado", estado: "EMPACADO",
        kgVerde: 134, kgTostado: 111.2, bolsas: 444, bolsasVendidas: 354, precioVenta: 38000, ingresos: 13452000,
        costos: { compra: 3060000, trilla: 90000, tueste: 670000, empaque: 577000 } },
    ],
    clientes: [
      { id: "CL-001", nombre: "Café Ejemplo Centro", tipo: "Cafetería", ciudad: "Cúcuta", tel: "300 111 1111" },
      { id: "CL-002", nombre: "Tostaduría Ejemplo", tipo: "Tostador", ciudad: "Bucaramanga", tel: "300 222 2222" },
      { id: "CL-003", nombre: "Tienda Ejemplo Pamplona", tipo: "Tienda", ciudad: "Pamplona", tel: "300 333 3333" },
    ],
    pedidos: [
      { id: "PD-101", clienteId: "CL-001", nombre: "Café Ejemplo Centro", ciudad: "Cúcuta", fecha: "2026-09-08", canal: "tienda",
        items: [{ id: "P-GEI", nombre: "Bourbon rosado 250 g", n: 12, precio: 68000 }], total: 816000 },
      { id: "PD-102", clienteId: "CL-001", nombre: "Café Ejemplo Centro", ciudad: "Cúcuta", fecha: "2026-08-11", canal: "tienda",
        items: [{ id: "P-CAS", nombre: "Castillo 250 g", n: 20, precio: 38000 }], total: 760000 },
      { id: "PD-103", clienteId: "CL-002", nombre: "Tostaduría Ejemplo", ciudad: "Bucaramanga", fecha: "2026-08-28", canal: "tienda",
        items: [{ id: "P-GEI", nombre: "Bourbon rosado 1 kg", n: 4, precio: 245000 }], total: 980000 },
      { id: "PD-104", clienteId: "CL-003", nombre: "Tienda Ejemplo Pamplona", ciudad: "Pamplona", fecha: "2026-05-18", canal: "directo",
        items: [{ id: "P-CAS", nombre: "Castillo 250 g", n: 8, precio: 38000 }], total: 304000 },
    ],
    espera: [], suscriptores: [],
  };
}

function load() { try { const s = JSON.parse(localStorage.getItem(CONFIG.storageKey)); return s && s.v === 6 ? s : null; } catch { return null; } }
function save() { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(S)); } catch {} }
function idiomaGuardado() { try { return localStorage.getItem("nandez-lang"); } catch { return null; } }

let S = load() || seed();
const UI = { view: "inicio", lang: idiomaGuardado() || (navigator.language || "es").slice(0, 2) === "en" ? "en" : "es",
  atab: "cotizador", animate: true, carrito: [], au: null, q: null, cafe: null, entrada: null };

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtNum = (n, dec = 0) => Number(n || 0).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const cop = (n) => "$" + fmtNum(Math.round(n || 0));
const copK = (n) => (Math.abs(n) >= 1e6 ? "$" + fmtNum(n / 1e6, 1) + " M" : cop(n));
const isoToday = () => new Date().toISOString().slice(0, 10);
const fmtFecha = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString(UI.lang === "en" ? "en-GB" : "es-CO", { day: "numeric", month: "short", year: "numeric" }) : "";
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const nextId = (p) => `${p}-${S.seq++}`;
const num = (id, def = 0) => { const el = $("#" + id); const v = el ? parseFloat(el.value) : NaN; return isNaN(v) ? def : v; };
const gramos = (g) => (g >= 1000 ? g / 1000 + " kg" : g + " g");
const prodById = (id) => S.productos.find((p) => p.id === id);
const fincaDe = (p) => S.fincas.find((f) => f.id === p.fincaId) || {};

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


/* ---------- SEO: sitio, rutas y textos de cada página ---------- */
CONFIG.sitio = "https://cafeweb-five.vercel.app";   // cambiar cuando haya dominio propio

const RUTAS = { inicio: "", cafes: "cafes", cafe: "cafe", subasta: "subasta", suscripcion: "suscripcion", diario: "diario", entrada: "diario" };
const slugEntrada = (e) => slug(tx(e.titulo)).slice(0, 60);

function ruta(view, id, lang) {
  const L = lang || UI.lang, base = L === "en" ? "/en/" : "/";
  const enIdioma = (o) => (o && typeof o === "object" ? (o[L] ?? o.es) : o);
  if (view === "cafe" && id) { const p = prodById(id); return p ? base + "cafe-" + slug(enIdioma(p.nombre)) : base + "cafes"; }
  if (view === "entrada" && id) { const e = S.entradas.find((x) => x.id === id); return e ? base + "diario-" + slug(enIdioma(e.titulo)).slice(0, 60) : base + "diario"; }
  return base + (RUTAS[view] || "");
}
function vistaDeRuta(path) {
  const p = String(path).replace(/^\/(en\/)?/, "").replace(/\.html$/, "").replace(/\/$/, "");
  if (!p) return { view: "inicio" };
  if (p.startsWith("cafe-")) { const pr = S.productos.find((x) => slug(x.nombre.es) === p.slice(5) || slug(x.nombre.en) === p.slice(5)); return pr ? { view: "cafe", id: pr.id } : { view: "cafes" }; }
  if (p.startsWith("diario-")) { const e = S.entradas.find((x) => slug(x.titulo.es).slice(0, 60) === p.slice(7) || slug(x.titulo.en).slice(0, 60) === p.slice(7)); return e ? { view: "entrada", id: e.id } : { view: "diario" }; }
  const v = Object.keys(RUTAS).find((k) => RUTAS[k] === p && k !== "cafe" && k !== "entrada");
  return { view: v || "inicio" };
}

/* Título y descripción por página, escritos para buscar "café de origen",
   "café especial de Norte de Santander" y "subasta de café Geisha". */
function meta(view, id) {
  view = view || UI.view; id = id || null;
  const en = UI.lang === "en", marca = CONFIG.marca;
  const p = (view === "cafe" && id && prodById(id)) || S.productos[0];
  const e = (view === "entrada" && id && S.entradas.find((x) => x.id === id)) || S.entradas[0];
  const limpio = (s) => String(s).replace(/^PEND\w+[:.]\s*/i, "");
  const M = {
    inicio: en
      ? { t: marca + " · Single origin Colombian coffee from Norte de Santander",
          d: "We grow coffee in Chinácota and choose the best lots from farms across Norte de Santander, Colombia. Single origin, one farm per coffee, with altitude, variety, process and cupping score for each lot." }
      : { t: marca + " · Café de origen de Norte de Santander",
          d: "Sembramos café en Chinácota y escogemos los mejores lotes de las fincas de Norte de Santander. Un café por finca, con su altura, su variedad, su proceso y su puntaje de catación." },
    cafes: en
      ? { t: "Coffees on sale · " + marca,
          d: "One coffee per farm: Pink Bourbon, Castillo and the Geisha lot going to auction. Colombian specialty coffee roasted in Norte de Santander and shipped countrywide." }
      : { t: "Cafés a la venta · " + marca,
          d: "Un café por finca: Bourbon rosado, Castillo y el lote Geisha que va a subasta. Café especial colombiano tostado en Norte de Santander, con envío a todo el país." },
    cafe: en
      ? { t: tx(p.nombre) + " · " + p.puntaje + " SCA · coffee from " + (fincaDe(p).municipio || "Colombia") + " · " + marca,
          d: tx(p.nombre) + ": " + p.variedad + " " + p.proceso.toLowerCase() + " grown at " + fmtNum(p.altitud) + " m in " + (fincaDe(p).municipio || "") + ", " + p.puntaje + " SCA points. Notes of " + tx(p.notas).join(", ").toLowerCase() + ". From " + cop(p.variantes[0].precio) + "." }
      : { t: tx(p.nombre) + " · " + p.puntaje + " SCA · café de " + (fincaDe(p).municipio || "Colombia") + " · " + marca,
          d: tx(p.nombre) + ": " + p.variedad + " " + p.proceso.toLowerCase() + " cultivado a " + fmtNum(p.altitud) + " msnm en " + (fincaDe(p).municipio || "") + ", con " + p.puntaje + " puntos SCA. Notas de " + tx(p.notas).join(", ").toLowerCase() + ". Desde " + cop(p.variantes[0].precio) + "." },
    subasta: en
      ? { t: "Live Geisha coffee auction · " + marca,
          d: "Bid live for a Geisha microlot from Toledo, Norte de Santander: reserve price, at least three bidders and anti-sniping extension. Only 30 kg of green coffee." }
      : { t: "Subasta de café Geisha en vivo · " + marca,
          d: "Puja en vivo por un microlote de Geisha de Toledo, Norte de Santander: precio de reserva, mínimo tres participantes y extensión anti-último-segundo. Solo 30 kg de café verde." },
    suscripcion: en
      ? { t: "Colombian coffee subscription · " + marca,
          d: "Freshly roasted Colombian specialty coffee every month, from COP 68,000. One or two farms per shipment, with the lot data sheet. Cancel anytime." }
      : { t: "Suscripción de café colombiano · " + marca,
          d: "Café especial recién tostado cada mes, desde $68.000. Una o dos fincas por envío, con la ficha del lote. Cancelas cuando quieras." },
    diario: en
      ? { t: "Journal: buying coffee in Norte de Santander · " + marca,
          d: "Farm visits, prices, yield factor, processing and brewing: what we learn buying coffee straight from growers in Norte de Santander." }
      : { t: "Diario: comprar café en Norte de Santander · " + marca,
          d: "Visitas a fincas, precios, factor de rendimiento, beneficio y preparación: lo que aprendemos comprando café directo a los productores de Norte de Santander." },
    entrada: { t: tx(e.titulo) + " · " + marca, d: limpio(tx(e.resumen)).slice(0, 155) },
  };
  return M[view] || M.inicio;
}

/* Preguntas que la gente escribe en el buscador y que responden los asistentes de IA */
const FAQ = [
  { q: { es: "¿Qué es el café de origen y en qué se diferencia del café común?", en: "What is single origin coffee and how is it different?" },
    a: { es: "El café de origen viene de una sola finca y una sola cosecha, no de la mezcla de muchos productores. Por eso se puede saber quién lo cultivó, a qué altura y con qué proceso, y por eso una taza sabe distinta de otra.",
         en: "Single origin coffee comes from one farm and one harvest, not from a blend of many growers. That is why you can know who grew it, at what altitude and with which process, and why one cup tastes different from another." } },
  { q: { es: "¿Cuánto cuesta un café especial colombiano?", en: "How much does Colombian specialty coffee cost?" },
    a: { es: "En 2026 una bolsa de 250 g de café especial en Colombia va entre $35.000 y $70.000, según la variedad y el puntaje de catación. Un Geisha o un lote de subasta cuesta más porque se produce en cantidades muy pequeñas.",
         en: "In 2026 a 250 g bag of specialty coffee in Colombia runs between COP 35,000 and 70,000, depending on variety and cupping score. A Geisha or an auction lot costs more because very little of it exists." } },
  { q: { es: "¿Qué significa el puntaje SCA de un café?", en: "What does the SCA score mean?" },
    a: { es: "Es la calificación de un catador certificado sobre 100 puntos. Desde 80 se considera café especial y desde 86 es excepcional. Publicamos quién hizo la catación y en qué fecha, porque el puntaje envejece junto con el café.",
         en: "It is a certified cupper's score out of 100. From 80 it counts as specialty and from 86 it is exceptional. We publish who cupped it and when, because the score ages along with the coffee." } },
  { q: { es: "¿Por qué se cultiva buen café en Norte de Santander?", en: "Why is good coffee grown in Norte de Santander?" },
    a: { es: "Las fincas de Chinácota, Toledo y Arboledas están entre 1.500 y 1.950 metros, con noches frías que maduran el grano despacio. Es una región menos conocida que Huila o Nariño, y por eso todavía se consiguen microlotes excepcionales a precios sensatos.",
         en: "Farms in Chinácota, Toledo and Arboledas sit between 1,500 and 1,950 metres, with cold nights that ripen the cherry slowly. It is a lesser known region than Huila or Nariño, so exceptional microlots can still be found at sensible prices." } },
  { q: { es: "¿Cómo funciona una subasta de café?", en: "How does a coffee auction work?" },
    a: { es: "Se publica un lote pequeño con su puntaje y su ficha, se abre con un precio de salida y los compradores pujan por kilo de café verde. Se adjudica solo si se alcanza el precio de reserva y participan al menos tres compradores distintos.",
         en: "A small lot is published with its score and data sheet, opens at a starting price and buyers bid per kilo of green coffee. It is awarded only if the reserve price is met and at least three different buyers take part." } },
  { q: { es: "¿Le compran directo al productor?", en: "Do you buy directly from the grower?" },
    a: { es: "Sí. Vamos a la finca, medimos el factor de rendimiento y la humedad delante del productor, y pagamos de contado por encima del precio de referencia del día. Sin intermediarios entre la finca y la bolsa.",
         en: "Yes. We go to the farm, measure yield factor and moisture in front of the grower, and pay cash above the day's reference price. No middlemen between the farm and the bag." } },
];

/* ---------- montaña: la altitud como firma visual ---------- */
function rng(seedStr) {
  let a = 0; for (const ch of String(seedStr)) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function ridge(o, { w = 320, h = 150, dark = false, label = true } = {}) {
  const r = rng(o.id || o.finca || "x"), alt = +(o.altitud?.v ?? o.altitud) || 1500, tt = Math.min(1, Math.max(0.08, (alt - 1000) / 1200));
  const col = PROC_COLOR[o.proceso?.v ?? o.proceso] || "#6a5646";
  const peakX = w * (0.5 + r() * 0.3), peakY = h * (0.92 - tt * 0.6);
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

/* ---------- ventas: cliente y atribución al lote (lo usan la tienda y el panel) ---------- */
const bolsasLibres = (c) => Math.max(0, Math.round((c.bolsas || 0) - (c.bolsasVendidas || 0)));

function upsertCliente(nombre, ciudad, tel) {
  let cl = S.clientes.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase());
  if (cl) { cl.tel = tel || cl.tel; cl.ciudad = ciudad || cl.ciudad; return cl; }
  cl = { id: nextId("CL"), nombre, tipo: "Cliente", ciudad, tel };
  S.clientes.unshift(cl);
  return cl;
}

/* Cada venta descuenta del lote que produjo ese café (admite fracciones: muestras de 100 g) */
function atribuirVenta(producto, unidades, valor) {
  const c = S.compras.find((x) => x.id === producto.loteId); if (!c || !unidades) return;
  c.bolsasVendidas = (c.bolsasVendidas || 0) + unidades;
  c.ingresos = (c.ingresos || 0) + (valor != null ? valor : unidades * producto.precio);
  if (bolsasLibres(c) < 1) c.estado = "VENDIDO";
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
  const el = document.createElement("div");
  el.className = "toast " + (type || "");
  el.innerHTML = `<span class="t-ico"></span><span>${msg}</span>`;
  const kill = () => { el.classList.add("out"); setTimeout(() => el.remove(), 300); };
  if (label) { const b = document.createElement("button"); b.className = "tbtn"; b.textContent = label; b.onclick = () => { act(); kill(); }; el.append(b); }
  $("#toasts").append(el);
  setTimeout(kill, label ? 7000 : 4200);
}
function later(ms, fn) { setTimeout(() => { if (fn() !== false) { save(); softRefresh(); } }, ms); }

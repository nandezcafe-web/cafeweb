/* ============================================================
   Arma el sitio:
     prototipo/<ruta>.html      → una página HTML real por sección (español)
     prototipo/en/<ruta>.html   → lo mismo en inglés
     prototipo/sitemap.xml, robots.txt, llms.txt
     prototipo/nandez.html      → la tienda en un solo archivo (para enviar)
     admin/index.html           → panel interno con login
   El HTML sale ya escrito para que lo lean Google y los crawlers de IA
   (GPTBot, ClaudeBot y compañía no ejecutan JavaScript); encima, el mismo
   JavaScript toma el control en el navegador y la página sigue siendo una SPA.
   Uso: node tools/build.js
   ============================================================ */
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = path.join(__dirname, "..", "prototipo");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const escribir = (rel, txt) => { const f = path.join(SRC, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, txt); };
const css = ["styles.css", "auction.css"].map(read).join("\n");
const mod = (f) => `/* ---- ${f}.js ---- */\n` + read(`js/${f}.js`);
const MODS = ["core", "fases", "shop", "pages", "auction", "main"];
/* huella de los archivos: obliga al navegador a bajar la versión nueva tras cada despliegue */
const TODOS = ["core", "fases", "shop", "pages", "auction", "main", "quote", "inventory", "clients", "market", "admin"];
/* huella de las imágenes: si una foto cambia, cambia su dirección y ningún navegador sirve la vieja */
const IMG_DIRS = ["grano", "portada", "productos"].map((d) => path.join(SRC, "img", d));
const IMG_V = require("crypto").createHash("md5")
  .update(Buffer.concat(IMG_DIRS.flatMap((d) => fs.readdirSync(d).sort().map((f) => fs.readFileSync(path.join(d, f))))))
  .digest("hex").slice(0, 8);
const VERSION = require("crypto").createHash("md5").update(css + TODOS.map((f) => read("js/" + f + ".js")).join("") + IMG_V).digest("hex").slice(0, 8);
const FUENTES = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">`;

/* ---------- 1. un “navegador” mínimo para ejecutar las vistas en Node ---------- */
function mundo(lang) {
  const nodo = () => ({ style: { setProperty() {} }, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    append() {}, remove() {}, setAttribute() {}, getAttribute: () => null, querySelector: () => null, querySelectorAll: () => [], focus() {}, addEventListener() {} });
  const doc = { documentElement: nodo(), head: { querySelector: () => null }, body: { dataset: {}, innerHTML: "" },
    title: "", activeElement: null, getElementById: nodo, querySelector: nodo, querySelectorAll: () => [],
    createElement: nodo, addEventListener() {} };
  const ctx = {
    IMG_V,
    console, Date, Math, JSON, String, Number, Array, Object, Set, Map, Intl, isNaN, parseInt, parseFloat, encodeURIComponent,
    document: doc, window: { addEventListener() {}, scrollTo() {}, open() {} },
    navigator: { language: lang }, location: { pathname: "/", hash: "", href: "/", search: "" },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    history: { pushState() {}, replaceState() {} },
    setInterval: () => 0, setTimeout: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    performance: { now: () => 0 }, fetch: () => Promise.resolve({ json: () => ({}) }),
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  MODS.forEach((f) => {
    const src = f === "main" ? read("js/main.js").split("/* ---------- arranque ---------- */")[0] : read(`js/${f}.js`);
    vm.runInContext(src, ctx, { filename: f + ".js" });
  });
  vm.runInContext(`UI.lang = ${JSON.stringify(lang)}; UI.au = newAuction(); UI.animate = false;`, ctx);
  return ctx;
}

/* ---------- 2. páginas a generar ---------- */
function paginas(ctx) {
  const ids = JSON.parse(ev(ctx, "JSON.stringify({p:S.productos.map(x=>x.id), e:S.entradas.map(x=>x.id)})"));
  return [
    { view: "inicio", prio: "1.0" }, { view: "cafes", prio: "0.9" },
    ...ids.p.map((id) => ({ view: "cafe", id, prio: "0.9" })),
    { view: "subasta", prio: "0.8" }, { view: "suscripcion", prio: "0.8" }, { view: "diario", prio: "0.7" },
    { view: "contacto", prio: "0.5" }, { view: "envios", prio: "0.5" }, { view: "terminos", prio: "0.3" }, { view: "privacidad", prio: "0.3" },
    ...ids.e.map((id) => ({ view: "entrada", id, prio: "0.6" })),
  ];
}

const ev = (ctx, expr) => vm.runInContext(expr, ctx);

/* la barra de abajo del celular: cinco accesos al alcance del pulgar, con su texto */
const IC = {
  inicio: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z"/>',
  cafes: '<ellipse cx="12" cy="12" rx="6.2" ry="8.6" transform="rotate(32 12 12)"/><path d="M8.8 17.6c2.8-2.6 3.6-8.6 6.4-11.2"/>',
  subasta: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.4 1.8M9.5 3.5h5"/>',
  pedido: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  mas: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
};
const ic = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
function dockHTML(ctx, activa, lang) {
  const T = (k) => ev(ctx, `t(${JSON.stringify(k)})`), R = (v) => ev(ctx, `ruta(${JSON.stringify(v)})`);
  const ir = (v, k, extra = "") => `<a class="dock-it" href="${R(v)}" data-act="go" data-to="${v}"${v === activa ? ' aria-current="page"' : ""}>${ic(v)}${extra}<span data-i18n="${k}">${T(k)}</span></a>`;
  const hoja = [["suscripcion", "nav_suscripcion"], ["diario", "nav_diario"], ["contacto", "nav_contacto"]]
    .map(([v, k]) => `<a class="tab" href="${R(v)}" data-act="go" data-to="${v}" data-i18n="${k}"${v === activa ? ' aria-current="page"' : ""}>${T(k)} </a>`).join("");
  return `<nav class="dock" aria-label="${lang === "en" ? "Quick access" : "Accesos"}">
  ${ir("inicio", "nav_inicio")}
  ${ir("cafes", "nav_cafes")}
  ${ir("subasta", "nav_subasta", '<span class="live-dot" id="dock-live"></span>')}
  <button class="dock-it" id="dock-pedido" data-act="carrito">${ic("pedido")}<span class="dock-n" id="dock-n" hidden></span><span data-i18n="nav_pedido">${T("nav_pedido")}</span></button>
  <button class="dock-it" id="dock-mas" data-act="mas" aria-expanded="false" aria-controls="dock-hoja">${ic("mas")}<span data-i18n="nav_mas">${T("nav_mas")}</span></button>
</nav>
<div class="dock-hoja" id="dock-hoja" hidden>
  ${hoja}
  <div class="lang" role="group" aria-label="${lang === "en" ? "Language" : "Idioma"}">
    <button data-act="lang" data-lang="es" aria-pressed="${lang === "es"}">Español</button>
    <button data-act="lang" data-lang="en" aria-pressed="${lang === "en"}">English</button>
  </div>
</div>`;
}

function navHTML(ctx, activa) {
  const it = [["inicio", "nav_inicio"], ["cafes", "nav_cafes"], ["subasta", "nav_subasta"], ["suscripcion", "nav_suscripcion"], ["diario", "nav_diario"]];
  const extra = { subasta: '<span class="live-dot" id="nav-live"></span><span class="mono nav-time" data-live-time></span>' };
  return it.map(([v, k]) => {
    const href = ev(ctx, `ruta(${JSON.stringify(v)})`), txt = ev(ctx, `t(${JSON.stringify(k)})`);
    return `<a class="tab" href="${href}" data-act="go" data-to="${v}" data-i18n="${k}"${v === activa ? ' aria-current="page"' : ""}>${txt} ${extra[v] || ""}</a>`;
  }).join("\n      ");
}

function pagina(ctx, { view, id }, lang) {
  ev(ctx, `UI.view = ${JSON.stringify(view)}; UI.cafe = ${JSON.stringify(id || null)} || UI.cafe; UI.entrada = ${JSON.stringify(id || null)} || UI.entrada;`);
  const cuerpo = ev(ctx, `VIEWS[${JSON.stringify(view)}]() + FOOT()`);
  const M = ev(ctx, `meta(${JSON.stringify(view)}, ${JSON.stringify(id || null)})`);
  const ld = JSON.stringify(ev(ctx, `datosEstructurados(${JSON.stringify(view)}, ${JSON.stringify(id || null)})`));
  const sitio = ev(ctx, "CONFIG.sitio");
  const url = sitio + ev(ctx, `ruta(${JSON.stringify(view)}, ${JSON.stringify(id || null)}, ${JSON.stringify(lang)})`);
  const alt = { es: sitio + ev(ctx, `ruta(${JSON.stringify(view)}, ${JSON.stringify(id || null)}, "es")`),
                en: sitio + ev(ctx, `ruta(${JSON.stringify(view)}, ${JSON.stringify(id || null)}, "en")`) };
  const activa = view === "cafe" ? "cafes" : view === "entrada" ? "diario" : view;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<title>${M.t}</title>
<meta name="description" content="${M.d.replace(/"/g, "&quot;")}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="es" href="${alt.es}">
<link rel="alternate" hreflang="en" href="${alt.en}">
<link rel="alternate" hreflang="x-default" href="${alt.es}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${ev(ctx, "CONFIG.marca")}">
<meta property="og:title" content="${M.t}">
<meta property="og:description" content="${M.d.replace(/"/g, "&quot;")}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${lang === "en" ? "en_US" : "es_CO"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#E6D7C3">
<meta name="color-scheme" content="light">
${FUENTES}
<link rel="stylesheet" href="/styles.css?v=${VERSION}">
<link rel="stylesheet" href="/auction.css?v=${VERSION}">
<script type="application/ld+json" id="ld-json">${ld}</script>
</head>
<body data-view="${view}">
<header class="top">
  <div class="top-inner">
    <a class="brand" href="${lang === "en" ? "/en/" : "/"}" data-act="go" data-to="inicio" aria-label="${ev(ctx, "CONFIG.marca")}">
      <svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="12" cy="6.6" rx="3.3" ry="5.4" transform="rotate(${r} 12 12)"/>`).join("")}</g><circle cx="12" cy="12" r="1.3" fill="var(--paper)"/></svg>
      <b>Nandez</b><small>${lang === "en" ? "single origin coffee" : "café de origen"}</small>
    </a>
    <nav class="tabs" id="nav-principal" aria-label="${lang === "en" ? "Sections" : "Secciones"}">
      <span class="tab-luz" aria-hidden="true"></span>
      ${navHTML(ctx, activa)}
    </nav>
    <button class="cart-btn" id="cart-btn" data-act="carrito" aria-label="${lang === "en" ? "Order" : "Pedido"}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 7Z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/></svg>
      <span class="cart-n" id="cart-n" hidden></span>
    </button>
    <button class="menu-btn" id="menu-btn" data-act="menu" aria-expanded="false" aria-controls="nav-principal" aria-label="${lang === "en" ? "Menu" : "Menú"}">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
    <div class="lang" role="group" aria-label="${lang === "en" ? "Language" : "Idioma"}">
      <button data-act="lang" data-lang="es" aria-pressed="${lang === "es"}">ES</button>
      <button data-act="lang" data-lang="en" aria-pressed="${lang === "en"}">EN</button>
    </div>
  </div>
</header>
${dockHTML(ctx, activa, lang)}

<main class="wrap${view === "inicio" ? "" : " calm"}" id="view">${cuerpo}</main>

<div class="tray" id="tray" hidden></div>
<div class="toasts" id="toasts" aria-live="polite"></div>
<dialog id="cart" class="drawer" aria-label="${lang === "en" ? "Your order" : "Tu pedido"}">
  <div class="cart-head"><h3>${lang === "en" ? "Your order" : "Tu pedido"}</h3>
    <button class="x" data-act="cart-close" aria-label="${lang === "en" ? "Close" : "Cerrar"}">✕</button></div>
  <div class="cart-body" id="cart-body"></div>
  <div class="cart-foot" id="cart-foot"></div>
</dialog>
<dialog id="dlg">
  <div class="dlg-head"><h3 id="dlg-title"></h3><button class="x" data-act="close" aria-label="${lang === "en" ? "Close" : "Cerrar"}">✕</button></div>
  <div class="dlg-body" id="dlg-body"></div>
</dialog>

<script>window.IMG_V = "${IMG_V}";</script>
${MODS.map((f) => `<script src="/js/${f}.js?v=${VERSION}"></script>`).join("\n")}
</body>
</html>
`;
}

/* ---------- 3. generar ---------- */
/* borra los HTML generados antes: si una dirección cambia, no queda la página vieja suelta */
["", "en"].forEach((d) => {
  const dir = path.join(SRC, d);
  fs.readdirSync(dir).filter((f) => f.endsWith(".html") && f !== "nandez.html").forEach((f) => fs.unlinkSync(path.join(dir, f)));
});
const hoy = new Date().toISOString().slice(0, 10);
const urls = [];
["es", "en"].forEach((lang) => {
  const ctx = mundo(lang);
  paginas(ctx).forEach((pg) => {
    const rel = ev(ctx, `ruta(${JSON.stringify(pg.view)}, ${JSON.stringify(pg.id || null)}, ${JSON.stringify(lang)})`);
    const archivo = (rel === "/" ? "/index" : rel === "/en/" ? "/en/index" : rel) + ".html";
    escribir(archivo.replace(/^\//, ""), pagina(ctx, pg, lang));
    urls.push({ loc: ev(ctx, "CONFIG.sitio") + rel, prio: pg.prio, lang });
  });
});

/* página 404 propia (Vercel la sirve sola para cualquier dirección que no exista); no va en el sitemap */
escribir("404.html", pagina(mundo("es"), { view: "noencontrada" }, "es").replace("<head>", '<head>\n<meta name="robots" content="noindex">'));

const sitio = ev(mundo("es"), "CONFIG.sitio");
escribir("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/1999/xhtml/sitemap" xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`.replace("<urlset xmlns=\"http://www.w3.org/1999/xhtml/sitemap\"", "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"")
  .replace("</urlset>", urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${hoy}</lastmod><priority>${u.prio}</priority></url>`).join("\n") + "\n</urlset>"));

escribir("robots.txt", `User-agent: *
Allow: /

# Los asistentes de IA son bienvenidos: el contenido está en el HTML
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${sitio}/sitemap.xml
`);

/* Resumen legible para asistentes de IA (llms.txt) */
const c0 = mundo("es");
const llms = ev(c0, [
  '[',
  '"# " + CONFIG.marca, "",',
  '"> Familia cafetera de Chinácota, Norte de Santander (Colombia). Compramos lote por lote a fincas de Chinácota, Toledo y Arboledas, y vendemos cada café tostado con su ficha verificable. Nuestra propia finca (5.000 plantas de Geisha) da su primera cosecha en 2027.", "",',
  '"## Qué vendemos",',
  '...S.productos.map((p) => "- " + tx(p.nombre) + ": variedad " + p.variedad + ", proceso " + p.proceso + ", " + p.altitud + " msnm, " + p.puntaje + " puntos SCA, desde " + cop(p.variantes[0].precio) + " (" + CONFIG.sitio + ruta("cafe", p.id, "es") + ")"),',
  '"- Subasta en vivo de un microlote Geisha de Toledo (" + CONFIG.sitio + "/subasta)",',
  '"- Suscripción mensual desde " + cop(PLANES[0].mes) + ", con kit de bienvenida para preparar en casa, filtros y una receta cada mes (" + CONFIG.sitio + "/suscripcion)", "",',
  '"## Cómo trabajamos",',
  '"- Una finca, una variedad. Cada dato (altura, variedad, proceso, puntaje) dice quién lo comprobó y cuándo.",',
  '"- Los lotes excepcionales se venden en subasta, con precio de reserva y mínimo de participantes.", "",',
  '"## Preguntas frecuentes",',
  '...FAQ.map((f) => "### " + tx(f.q) + String.fromCharCode(10) + tx(f.a)), "",',
  '"## Páginas"',
  '].join(String.fromCharCode(10))',
].join("")) + "\n" + urls.filter((u) => u.lang === "es").map((u) => "- " + u.loc).join("\n") + "\n";
escribir("llms.txt", llms);

/* ---------- 4. la tienda en un solo archivo (para enviar por WhatsApp) ---------- */
/* las piezas del grano, en texto, para que el archivo funcione sin conexión */
/* en el archivo suelto cada foto va dentro, en su tamaño chico */
const EMBEBER = { "cereza": "grano/cereza@0.5x", "capa-corte": "grano/capa-corte@0.5x",
                  "portada-ancho@0.5x": "portada/portada-ancho@0.5x", "portada-alto@0.5x": "portada/portada-alto@0.5x",
                  "p-gei@0.5x": "productos/p-gei@0.5x", "p-cas@0.5x": "productos/p-cas@0.5x",
                  "cierre@0.5x": "portada/cierre@0.5x" };
const pieza64 = (k) => "data:image/webp;base64," +
  fs.readFileSync(path.join(SRC, "img", `${EMBEBER[k]}.webp`)).toString("base64");
const GRANO_DENTRO = `const GRANO_EMBEBIDO = ${JSON.stringify(Object.fromEntries(Object.keys(EMBEBER).map((k) => [k, pieza64(k)])))};`;
const ctxEs = mundo("es");
vm.runInContext(GRANO_DENTRO, ctxEs);
const unSolo = pagina(ctxEs, { view: "inicio" }, "es")
  .replace(/<link rel="stylesheet" href="\/styles\.css\?v=\w+">\s*<link rel="stylesheet" href="\/auction\.css\?v=\w+">/, `<style>\n${css}\n</style>`)
  .replace(new RegExp(MODS.map((f) => `<script src="/js/${f}.js\\?v=${VERSION}"></script>`).join("\\s*")), `<script>\n${GRANO_DENTRO}\n${MODS.map(mod).join("\n")}\n</script>`)
  /* las fotos ya salen embebidas: el srcset sobra, cada una va en un solo tamaño */
  .replace(/\s*srcset="[^"]*"\s*sizes="[^"]*"/g, "")
  .replace(/<source media="[^"]*">/g, "");
escribir("nandez.html", unSolo);

/* ---------- 5. panel interno ---------- */
const panelJs = ["core", "quote", "inventory", "clients", "market", "admin"].map(mod).join("\n");
const panel = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Panel · Nandez Café</title>
<meta name="robots" content="noindex, nofollow">
${FUENTES}
<style>
${css}
</style>
</head>
<body data-view="login">
<header class="top"><div class="top-inner">
  <span class="brand"><svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="12" cy="6.6" rx="3.3" ry="5.4" transform="rotate(${r} 12 12)"/>`).join("")}</g><circle cx="12" cy="12" r="1.3" fill="var(--paper)"/></svg>
  <b>Nandez</b><small>panel interno</small></span>
</div></header>
<main class="wrap" id="view"></main>
<div class="toasts" id="toasts" aria-live="polite"></div>
<dialog id="dlg">
  <div class="dlg-head"><h3 id="dlg-title"></h3><button class="x" data-act="close" aria-label="Cerrar">✕</button></div>
  <div class="dlg-body" id="dlg-body"></div>
</dialog>
<script>
${panelJs}
</script>
</body>
</html>`;
const OUT = path.join(__dirname, "..", "admin");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), panel);
fs.writeFileSync(path.join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n");

console.log(`páginas: ${urls.length} (es+en) · un archivo: ${(unSolo.length / 1024).toFixed(1)} KB · panel: ${(panel.length / 1024).toFixed(1)} KB`);

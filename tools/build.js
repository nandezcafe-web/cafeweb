/* Arma dos páginas de un solo archivo:
     prototipo/altura.html   → página pública (para enviar por WhatsApp/correo)
     admin/index.html        → panel interno con login (se despliega aparte)
   Uso: node tools/build.js
*/
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "..", "prototipo");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const css = ["styles.css", "auction.css"].map(read).join("\n");
const mod = (f) => `/* ---- ${f}.js ---- */\n` + read(`js/${f}.js`);

const cabeza = (titulo) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>\n${css}\n</style>`;

const armazon = (extra = "") => `<main class="wrap" id="view"></main>
${extra}
<div class="toasts" id="toasts" aria-live="polite"></div>
<dialog id="dlg">
  <div class="dlg-head"><h3 id="dlg-title"></h3><button class="x" data-act="close" aria-label="Cerrar">✕</button></div>
  <div class="dlg-body" id="dlg-body"></div>
</dialog>`;

/* ---- pública: un archivo con todo lo del sitio ---- */
const publica = read("index.html")
  .replace(/<link rel="stylesheet" href="styles.css">\s*<link rel="stylesheet" href="auction.css">/, () => `<style>\n${css}\n</style>`)
  .replace(/(<script src="js\/[a-z]+\.js"><\/script>\s*)+/, () =>
    `<script>\n${["core", "shop", "pages", "auction", "main"].map(mod).join("\n")}\n</script>\n`);
if (/href="styles\.css"|src="js\//.test(publica)) throw new Error("quedaron referencias externas en la pública");
fs.writeFileSync(path.join(SRC, "nandez.html"), publica);

/* ---- panel interno: página aparte, con login ---- */
const panelJs = ["core", "quote", "inventory", "clients", "market", "admin"].map(mod).join("\n");
const panel = `<!doctype html>
<html lang="es">
<head>
${cabeza("Panel · Nandez Café")}
<meta name="robots" content="noindex, nofollow">
</head>
<body data-view="login">
<header class="top"><div class="top-inner">
  <span class="brand"><svg class="mark" viewBox="0 0 28 20" aria-hidden="true"><path d="M1 19 L9 7 L13 12 L19 3 L27 19 Z" fill="currentColor"/></svg>
  <b>Nandez</b><small>panel interno</small></span>
</div></header>
${armazon()}
<script>
${panelJs}
</script>
</body>
</html>`;
const OUT = path.join(__dirname, "..", "admin");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), panel);
fs.writeFileSync(path.join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n");

console.log("pública:", (publica.length / 1024).toFixed(1) + " KB   panel:", (panel.length / 1024).toFixed(1) + " KB");

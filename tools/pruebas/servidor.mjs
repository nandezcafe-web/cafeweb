/* ============================================================
   LA TIENDA DE PRUEBA · para comprar desde el navegador sin tocar nada real
   Uso:  node tools/pruebas/servidor.mjs [puerto]      (por defecto 5190)

   Sirve la página de verdad (prototipo/) con tres cambios hechos al vuelo en
   js/core.js, nunca en el archivo: la hoja apunta a /hoja-prueba, la pasarela
   tiene una llave pública de pruebas y el widget de Wompi es uno simulado.
   Detrás corren los api/pago.js y api/wompi.js de verdad, contra la hoja
   simulada (tools/pruebas/simulador.mjs). El widget simulado le pide el cobro a
   este servidor, que lo valida como lo haría Wompi (firma de integridad
   incluida) y le manda a api/wompi.js el aviso firmado.

   /estado-prueba muestra los pedidos, el stock y los correos que habrían salido.
   ============================================================ */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { RAIZ, hojaSimulada, conectar, hojaResponde, api, llamar, WOMPI } from "./simulador.mjs";

const PUERTO = Number(process.argv[2]) || 5190;
const SITIO = path.join(RAIZ, "prototipo");
const catalogo = JSON.parse(fs.readFileSync(path.join(SITIO, "data/catalogo.json"), "utf8"));
const mundo = hojaSimulada(catalogo);
conectar(mundo);
process.chdir(RAIZ);   // api/_tienda.js lee prototipo/data/catalogo.json desde aquí
const { pago, wompi } = await api();

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

/* El widget de Wompi, simulado: muestra el monto y los medios de prueba */
const WIDGET = `window.WidgetCheckout = function (cfg) { this.cfg = cfg; };
WidgetCheckout.prototype.open = function (cb) {
  var cfg = this.cfg, d = document.createElement("div");
  d.id = "wompi-prueba";
  d.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:grid;place-items:center";
  d.innerHTML = '<div style="background:#fff;color:#111;padding:24px;border-radius:12px;font:15px sans-serif;min-width:320px;display:grid;gap:8px">' +
    '<b>Wompi · simulado</b><span data-monto>$' + (cfg.amountInCents / 100).toLocaleString("es-CO") + ' · ' + cfg.reference + '</span>' +
    '<small>' + ((cfg.customerData || {}).email || "") + ' · IVA $' + ((cfg.taxInCents || {}).vat / 100).toLocaleString("es-CO") + '</small>' +
    ['card:4242424242424242|Tarjeta 4242 (aprueba)', 'card:4111111111111111|Tarjeta 4111 (rechaza)', 'nequi:3991111111|Nequi 3991111111 (aprueba)',
     'pse:1|PSE banco 1 (aprueba)', 'cerrar|Cerrar sin pagar'].map(function (o) {
      var p = o.split("|"); return '<button data-medio="' + p[0] + '">' + p[1] + '</button>'; }).join("") + '</div>';
  document.body.appendChild(d);
  d.addEventListener("click", function (e) {
    var m = e.target.getAttribute("data-medio"); if (!m) return;
    d.remove();
    if (m === "cerrar") return;
    fetch("/wompi-prueba/cobrar", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medio: m, j: { reference: cfg.reference, amountInCents: cfg.amountInCents, currency: cfg.currency,
        expirationTime: cfg.expirationTime, signature: cfg.signature } }) })
      .then(function (r) { return r.json(); })
      .then(function (r) { if (r.error) { document.body.setAttribute("data-wompi-error", r.error); return; } cb({ transaction: r.transaction }); });
  });
};`;

const leer = (req) => new Promise((ok) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => ok(b)); });
const responder = (res, codigo, cuerpo, tipo = "application/json") =>
  res.writeHead(codigo, { "Content-Type": tipo, "Cache-Control": "no-store" })
    .end(typeof cuerpo === "string" || Buffer.isBuffer(cuerpo) ? cuerpo : JSON.stringify(cuerpo));

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  try {
    if (u.pathname === "/hoja-prueba")
      return responder(res, 200, hojaResponde(mundo.gs, req.method, await leer(req), u.searchParams));
    if (u.pathname === "/api/pago" || u.pathname === "/api/wompi") {
      const r = await llamar(u.pathname === "/api/pago" ? pago : wompi, JSON.parse((await leer(req)) || "{}"));
      const { codigo, ...cuerpo } = r;
      return responder(res, codigo, cuerpo);
    }
    if (u.pathname === "/wompi-prueba/cobrar") {
      const { j, medio } = JSON.parse(await leer(req)), c = WOMPI.cobrar(j, medio);
      if (c.error) return responder(res, 200, c);
      /* como Wompi: el aviso firmado va al servidor de la tienda */
      const aviso = await llamar(wompi, WOMPI.aviso(c.transaction));
      return responder(res, 200, { ...c, aviso });
    }
    if (u.pathname === "/widget-prueba.js") return responder(res, 200, WIDGET, TIPOS[".js"]);
    if (u.pathname === "/estado-prueba") {
      const H = mundo.H;
      return responder(res, 200, { pedidos: H("Pedidos").slice(1).map((f) => ({ id: f[0], estado: f[2], nombre: f[3], correo: f[4],
          total: f[11], iva: f[24], canal: f[13], notas: f[18], transaccion: f[26], documento: f[19], direccion: f[20], departamento: f[22] })),
        stock: H("Stock").slice(1), correos: mundo.correos.map((c) => ({ para: c.to, asunto: c.subject })) });
    }
    /* la página: rutas limpias como en Vercel (/cafes → cafes.html) */
    let f = path.join(SITIO, decodeURIComponent(u.pathname));
    if (!f.startsWith(SITIO)) return responder(res, 403, "no");
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
    if (!fs.existsSync(f)) return responder(res, 404, fs.readFileSync(path.join(SITIO, "404.html"), "utf8"), TIPOS[".html"]);
    let cuerpo = fs.readFileSync(f);
    if (u.pathname === "/js/core.js") {
      /* los tres cambios de la tienda de prueba, solo en lo que se sirve */
      const txt = cuerpo.toString("utf8")
        .replace(/registro: "[^"]*"/, 'registro: "/hoja-prueba"')
        .replace(/llavePublica: ""/, 'llavePublica: "pub_test_PRUEBA"')
        .replace(/widget: "https:\/\/checkout\.wompi\.co\/widget\.js"/, 'widget: "/widget-prueba.js"');
      if (!txt.includes('"/hoja-prueba"') || !txt.includes("pub_test_PRUEBA") || !txt.includes("/widget-prueba.js"))
        throw new Error("no se pudo preparar core.js para la tienda de prueba");
      cuerpo = txt;
    }
    return responder(res, 200, cuerpo, TIPOS[path.extname(f)] || "application/octet-stream");
  } catch (e) {
    return responder(res, 500, { error: e.message });
  }
}).listen(PUERTO, () => console.log(`tienda de prueba en http://localhost:${PUERTO} · estado en /estado-prueba`));

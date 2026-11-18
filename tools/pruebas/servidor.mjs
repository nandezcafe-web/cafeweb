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
import { mercadoPagoSimulado, TOKEN_VALIDO } from "./mp-simulado.mjs";

const ARGS = process.argv.slice(2);
const PUERTO = Number(ARGS.find((a) => /^\d+$/.test(a))) || 5190;
/* --wompi-real: el widget y el cobro son los del Wompi de PRUEBAS de verdad (sandbox),
   con las llaves de tools/pruebas/.wompi-prueba.env. La hoja sigue simulada. */
const REAL = ARGS.includes("--wompi-real");
const SITIO = path.join(RAIZ, "prototipo");
const catalogo = JSON.parse(fs.readFileSync(path.join(SITIO, "data/catalogo.json"), "utf8"));
const mundo = hojaSimulada(catalogo);
const fetchReal = globalThis.fetch;
conectar(mundo);
const LLAVES = {};
if (REAL) {
  const archivo = path.join(RAIZ, "tools/pruebas/.wompi-prueba.env");
  if (!fs.existsSync(archivo)) throw new Error("falta tools/pruebas/.wompi-prueba.env");
  fs.readFileSync(archivo, "utf8").split(/\r?\n/).forEach((l) => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(\S+)/); if (m) LLAVES[m[1]] = m[2]; });
  /* solo sandbox: con llaves de producción esto cobraría de verdad */
  if (!/^pub_test_/.test(LLAVES.WOMPI_LLAVE_PUBLICA || "") || !/^test_integrity_/.test(LLAVES.WOMPI_INTEGRIDAD || "") || !/^test_events_/.test(LLAVES.WOMPI_EVENTOS || ""))
    throw new Error("las llaves de .wompi-prueba.env deben ser de pruebas (pub_test_, test_integrity_, test_events_)");
  Object.assign(process.env, { WOMPI_INTEGRIDAD: LLAVES.WOMPI_INTEGRIDAD, WOMPI_EVENTOS: LLAVES.WOMPI_EVENTOS });
}
process.chdir(RAIZ);   // api/_tienda.js lee prototipo/data/catalogo.json desde aquí
const { pago, wompi } = await api();
/* Mercado Pago simulado detrás de api/tarjeta.js, api/checkout.js y api/webhook.js */
const MP = mercadoPagoSimulado(), fetchHoja = globalThis.fetch;
globalThis.fetch = (url, op) => (new URL(url).host === "api.mercadopago.com" ? MP.fetch(url, op) : fetchHoja(url, op));
process.env.MP_ACCESS_TOKEN = TOKEN_VALIDO;
const deApi = async (f) => (await import(new URL("file:///" + path.join(RAIZ, "api", f).split(path.sep).join("/")).href)).default;
const MANEJADORES = { "/api/pago": pago, "/api/wompi": wompi, "/api/tarjeta": await deApi("tarjeta.js"),
  "/api/checkout": await deApi("checkout.js"), "/api/webhook": await deApi("webhook.js") };

/* Los campos de tarjeta de Mercado Pago, simulados: el titular decide el resultado
   (APRO aprueba, FUND sin fondos, SECU código mal, OTHE otro rechazo), como en su ambiente de pruebas */
const SDK_MP = `window.MercadoPago = function (llave) { this.llave = llave; };
MercadoPago.prototype.bricks = function () { return { create: function (tipo, id, cfg) {
  var caja = document.getElementById(id);
  caja.innerHTML = '<div data-mp-prueba style="display:grid;gap:6px;padding:10px;border:1px dashed #888;border-radius:8px;background:#fff;color:#111;font:14px sans-serif">' +
    '<b>Mercado Pago · campos simulados</b><span data-monto>' + Number(cfg.initialization.amount) + '</span>' +
    '<input data-num aria-label="Número de tarjeta" value="5031 7557 3453 0604">' +
    '<select data-titular aria-label="Titular"><option>APRO</option><option>FUND</option><option>SECU</option><option>OTHE</option></select>' +
    '<input data-cvv aria-label="Código de seguridad" value="123"></div>';
  window.__ladrillos = (window.__ladrillos || 0) + 1;
  return Promise.resolve({
    getFormData: function () {
      var q = function (s) { return caja.querySelector(s); };
      if (!q("[data-num]")) return Promise.reject(new Error("sin campos"));
      if (q("[data-num]").value.replace(/\\D/g, "").length < 15 || q("[data-cvv]").value.length < 3) return Promise.resolve(null);
      return Promise.resolve({ token: "tok_" + q("[data-titular]").value + "_" + Math.random().toString(36).slice(2, 10),
        payment_method_id: "master", issuer_id: "1", installments: 1, transaction_amount: cfg.initialization.amount,
        payer: { email: (cfg.initialization.payer || {}).email || "", identification: { type: "CC", number: "1090123456" } } });
    },
    unmount: function () { caja.innerHTML = ""; return Promise.resolve(); }
  });
} }; };`;

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

/* El widget de Wompi, simulado: muestra el monto y los medios de prueba */
const WIDGET = `window.WidgetCheckout = function (cfg) {
  /* como el real: un campo de la dirección presente pero sin valor no deja abrir */
  var sa = cfg.shippingAddress || {};
  for (var k in sa) if (sa[k] === undefined || sa[k] === null) throw new Error("Wompi Widget Error: Los campos de shipping address no estan completos o sus largos no son válidos");
  this.cfg = cfg; };
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
    if (MANEJADORES[u.pathname]) {
      const r = await llamar(MANEJADORES[u.pathname], JSON.parse((await leer(req)) || "{}"), { host: req.headers.host });
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
    /* Wompi real: se le pregunta el estado a Wompi (consulta pública de la transacción, sin
       secretos) y se le pasa a api/wompi.js el aviso firmado con el secreto de eventos de
       pruebas, como haría Wompi con la URL de eventos (que no alcanza a localhost). */
    if (REAL && u.pathname === "/wompi-real/aviso") {
      const id = String(u.searchParams.get("id") || "");
      if (!/^[\w-]+$/.test(id)) return responder(res, 400, { error: "id" });
      let tr = null;
      for (let i = 0; i < 30; i++) {
        const r = await fetchReal("https://sandbox.wompi.co/v1/transactions/" + id);
        tr = (await r.json()).data;
        if (tr && tr.status !== "PENDING") break;
        await new Promise((ok) => setTimeout(ok, 2000));
      }
      if (!tr) return responder(res, 502, { error: "wompi no respondió" });
      const t = { id: tr.id, reference: tr.reference, status: tr.status, amount_in_cents: tr.amount_in_cents,
        currency: tr.currency, payment_method_type: tr.payment_method_type };
      const aviso = await llamar(wompi, WOMPI.aviso(t));
      console.log("wompi real:", t.reference, t.status, t.payment_method_type, t.amount_in_cents / 100, "→", JSON.stringify(aviso));
      return responder(res, 200, { transaccion: t, aviso });
    }
    if (u.pathname === "/widget-prueba.js") return responder(res, 200, WIDGET, TIPOS[".js"]);
    if (u.pathname === "/mp-sdk-prueba.js") return responder(res, 200, SDK_MP, TIPOS[".js"]);
    if (u.pathname === "/estado-prueba") {
      const H = mundo.H;
      return responder(res, 200, { pedidos: H("Pedidos").slice(1).map((f) => ({ id: f[0], estado: f[2], nombre: f[3], correo: f[4],
          total: f[11], iva: f[24], canal: f[13], notas: f[18], transaccion: f[26], documento: f[19], direccion: f[20], departamento: f[22] })),
        stock: H("Stock").slice(1), correos: mundo.correos.map((c) => ({ para: c.to, asunto: c.subject })),
        mp: { cobros: MP.cobros.map((c) => ({ llave: c.llave, monto: c.cuerpo.transaction_amount, correo: c.cuerpo.payer?.email })), pagos: Object.values(MP.pagos) } });
    }
    /* la página: rutas limpias como en Vercel (/cafes → cafes.html) */
    let f = path.join(SITIO, decodeURIComponent(u.pathname));
    if (!f.startsWith(SITIO)) return responder(res, 403, "no");
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
    if (!fs.existsSync(f)) return responder(res, 404, fs.readFileSync(path.join(SITIO, "404.html"), "utf8"), TIPOS[".html"]);
    let cuerpo = fs.readFileSync(f);
    if (u.pathname === "/js/core.js") {
      /* los cambios de la tienda de prueba, solo en lo que se sirve: la hoja simulada, las
         llaves de prueba y el widget y los campos de tarjeta simulados */
      let txt = cuerpo.toString("utf8")
        .replace(/registro: "[^"]*"/, 'registro: "/hoja-prueba"')
        /* el píxel de Meta es el real: una compra de prueba no se le cuenta a Meta */
        .replace(/metaPixel: "[^"]*"/, 'metaPixel: ""').replace(/ga4: "[^"]*"/, 'ga4: ""')
        .replace('mp: { llavePublica: "", sdk: "https://sdk.mercadopago.com/js/v2" }', 'mp: { llavePublica: "TEST-PRUEBA", sdk: "/mp-sdk-prueba.js" }');
      if (REAL) {
        /* el widget de Wompi de verdad, en sandbox. Al cerrarlo, la página le pasa a este
           servidor el id de la transacción para que confirme el estado con Wompi. */
        txt = txt.replace(/pasarela: "[^"]*"/, 'pasarela: "wompi"')
          .replace('wompi: { llavePublica: "", widget: "https://checkout.wompi.co/widget.js" }',
            'wompi: { llavePublica: "' + LLAVES.WOMPI_LLAVE_PUBLICA + '", widget: "https://checkout.wompi.co/widget.js" }') +
          '\nwindow.addEventListener("load", function () { var o = window.resultadoPago; window.resultadoPago = function (tr) {' +
          ' if (tr && tr.id) fetch("/wompi-real/aviso?id=" + encodeURIComponent(tr.id)).then(function (r) { return r.json(); })' +
          '.then(function (r) { document.body.setAttribute("data-aviso", JSON.stringify(r)); }); return o.apply(this, arguments); }; });\n';
        if (!txt.includes(LLAVES.WOMPI_LLAVE_PUBLICA) || !txt.includes('pasarela: "wompi"')) throw new Error("no se pudo preparar core.js con Wompi real");
      } else {
        txt = txt.replace('wompi: { llavePublica: "", widget: "https://checkout.wompi.co/widget.js" }', 'wompi: { llavePublica: "pub_test_PRUEBA", widget: "/widget-prueba.js" }');
        if (!txt.includes("pub_test_PRUEBA")) throw new Error("no se pudo preparar core.js para la tienda de prueba");
      }
      if (!txt.includes('"/hoja-prueba"') || !txt.includes('"/mp-sdk-prueba.js"'))
        throw new Error("no se pudo preparar core.js para la tienda de prueba");
      cuerpo = txt;
    }
    return responder(res, 200, cuerpo, TIPOS[path.extname(f)] || "application/octet-stream");
  } catch (e) {
    return responder(res, 500, { error: e.message });
  }
}).listen(PUERTO, () => console.log(`tienda de prueba en http://localhost:${PUERTO} · estado en /estado-prueba`));

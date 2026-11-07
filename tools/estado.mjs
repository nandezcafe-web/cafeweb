/* ============================================================
   ¿QUÉ FALTA PARA COBRAR EN LÍNEA?
   Uso:  node tools/estado.mjs              revisa el repositorio
         node tools/estado.mjs --en-vivo    además pregunta a la página publicada

   Con --en-vivo le pregunta a Vercel si ya tiene los secretos, sin crear pedidos
   ni mover nada: manda solicitudes que se rechazan antes de tocar la hoja.
   Los pasos completos están en docs/13_activar_pagos.md.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leer = (f) => { try { return fs.readFileSync(path.join(RAIZ, f), "utf8"); } catch { return ""; } };
const EN_VIVO = process.argv.includes("--en-vivo");
const core = leer("prototipo/js/core.js"), gs = leer("tools/correos/Codigo.gs");
let cat = {}; try { cat = JSON.parse(leer("prototipo/data/catalogo.json")); } catch {}
let vercel = {}; try { vercel = JSON.parse(leer("vercel.json")); } catch {}

const llave = (core.match(/llavePublica:\s*"([^"]*)"/) || [])[1] || "";
const registro = (core.match(/registro:\s*"([^"]*)"/) || [])[1] || "";
const sitio = (core.match(/sitio:\s*"([^"]*)"/) || [])[1] || "https://cafeweb-five.vercel.app";
const ambiente = llave.startsWith("pub_prod_") ? "producción" : llave.startsWith("pub_test_") ? "pruebas" : "";

const filas = [];
const revisar = (ok, que, falta) => filas.push({ ok, que, falta });

const pasarela = (core.match(/pasarela:\s*"([^"]*)"/) || [])[1] || "";
const MP = pasarela === "mercadopago";
revisar(pasarela === "wompi" || MP, `La pasarela elegida es ${MP ? "Mercado Pago" : "Wompi"} (CONFIG.pagos.pasarela)`, 'Poner pasarela: "mercadopago" o "wompi" en prototipo/js/core.js');
if (!MP) revisar(!!ambiente, `Llave pública de Wompi en la página${ambiente ? " · " + ambiente : ""}`,
  "Pegar la llave pública (pub_test_… para probar) en CONFIG.pagos.wompi.llavePublica, prototipo/js/core.js");
revisar(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(registro), "La hoja de Google está conectada (CONFIG.registro)",
  "Publicar tools/correos/Codigo.gs como aplicación web y pegar la URL /exec en CONFIG.registro");
revisar(cat.registro === registro && Array.isArray(cat.productos) && cat.productos.every((p) => Array.isArray(p.variantes)),
  "El catálogo publicado está al día con la página (precios, envío, IVA, hoja)", "Correr: node tools/build.js");
revisar(String(vercel.functions?.["api/*.js"]?.includeFiles || "").includes("catalogo.json"),
  "Las funciones de Vercel llevan el catálogo (vercel.json)", "Agregar includeFiles: \"prototipo/data/catalogo.json\" en vercel.json");
revisar(["api/pago.js", "api/wompi.js", "api/checkout.js", "api/webhook.js", "api/_tienda.js", "api/package.json"].every((f) => leer(f)), "El servidor de pagos está en api/", "Faltan archivos en api/");
revisar(/function pago_\(/.test(gs) && /function liberarReservas\(/.test(gs) && /esPasarela_/.test(gs),
  "El script de la hoja sabe confirmar pagos y liberar reservas (en el repositorio)", "tools/correos/Codigo.gs no es la versión con pagos");

if (EN_VIVO) {
  const intentar = async (url, op) => { try { const r = await fetch(url, op); return { codigo: r.status, j: await r.json().catch(() => ({})) }; } catch (e) { return { codigo: 0, j: { error: e.message } }; } };
  const post = (u, b) => intentar(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  if (MP) {
    /* sin comprador: si el token está, responde 400 por el nombre y no escribe nada en la hoja */
    const c = await post(sitio + "/api/checkout", {});
    revisar(c.codigo === 400, "Vercel tiene MP_ACCESS_TOKEN", c.codigo === 503 ? "Agregar MP_ACCESS_TOKEN (Access Token de Mercado Pago) en Vercel → Settings → Environment Variables y volver a desplegar"
      : `La página no respondió como se esperaba (${c.codigo} ${c.j.error || ""}): ¿ya está desplegada esta versión?`);
    /* aviso sin pago: sin token responde 503; con token lo ignora y no mueve nada */
    const w = await post(sitio + "/api/webhook", { type: "nada" });
    revisar(w.codigo === 200, "El aviso de pagos de Mercado Pago (api/webhook) responde", w.codigo === 503 ? "Falta MP_ACCESS_TOKEN en Vercel"
      : `La página no respondió como se esperaba (${w.codigo} ${w.j.error || ""})`);
  } else {
    /* sin comprador: si el secreto está, responde 400 por el nombre y no escribe nada */
    const p = await post(sitio + "/api/pago", {});
    revisar(p.codigo === 400, "Vercel tiene WOMPI_INTEGRIDAD", p.codigo === 503 ? "Agregar WOMPI_INTEGRIDAD en Vercel → Settings → Environment Variables y volver a desplegar"
      : `La página no respondió como se esperaba (${p.codigo} ${p.j.error || ""}): ¿ya está desplegada esta versión?`);
    /* aviso sin firma: si el secreto está, responde 401 y no mueve nada */
    const w = await post(sitio + "/api/wompi", { event: "nada" });
    revisar(w.codigo === 401, "Vercel tiene WOMPI_EVENTOS", w.codigo === 503 ? "Agregar WOMPI_EVENTOS en Vercel y volver a desplegar"
      : `La página no respondió como se esperaba (${w.codigo} ${w.j.error || ""})`);
  }
  if (registro) {
    const s = await intentar(registro + "?accion=stock");
    revisar(s.j && s.j.ok && s.j.stock, "La hoja publicada tiene la versión con stock (accion=stock)",
      "Pegar el Codigo.gs de hoy en Apps Script, ejecutar configurar y publicar una NUEVA versión de la implementación");
  }
}

console.log(`\n¿QUÉ FALTA PARA COBRAR EN LÍNEA?${EN_VIVO ? " (con la página publicada)" : ""}\n`);
filas.forEach((f) => console.log(`  ${f.ok ? "✓" : "✗"}  ${f.que}`));
const faltan = filas.filter((f) => !f.ok);
if (!faltan.length) console.log(`\nTodo listo${ambiente === "pruebas" ? " para probar con tarjetas de prueba. Para vender: llaves de producción (docs/13)" : ""}.`);
else { console.log("\nLO QUE FALTA, EN ORDEN"); faltan.forEach((f, i) => console.log(`  ${i + 1}. ${f.falta}`)); }
if (!EN_VIVO) console.log("\nVercel no se revisó. Para eso: node tools/estado.mjs --en-vivo");
console.log("Los pasos completos: docs/13_activar_pagos.md\n");

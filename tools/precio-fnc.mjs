/* Revisa el precio de la FNC, la bolsa y la TRM, y lo anota en prototipo/data/mercado.json.
   Lo corre la tarea de GitHub .github/workflows/precio-fnc.yml cada día hábil; también a mano:
     node tools/precio-fnc.mjs
   Si el precio de la carga cambió frente a la fecha anterior, lo deja escrito en
   GITHUB_OUTPUT para que la tarea abra un aviso (llega por correo). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import leer from "../api/mercado.js";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const archivo = path.join(raiz, "prototipo", "data", "mercado.json");

/* la función del servidor espera (req, res): aquí le damos un res mínimo */
const d = await new Promise((ok) => leer({ method: "GET" }, {
  setHeader() {}, status() { return this; }, end() { ok({}); }, json: ok,
}));
if (!d.precioCarga || !d.fecha) { console.error("No se pudo leer la FNC:", d.error || d.errores); process.exit(1); }

const datos = fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo, "utf8")) : { historial: [] };
const h = datos.historial;
const fila = { fecha: d.fecha, precioCarga: d.precioCarga, ny: d.ny, tasaFnc: d.tasaFnc, trm: d.trm };
const i = h.findIndex((x) => x.fecha === d.fecha);
const previo = h.filter((x) => x.fecha < d.fecha).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
const antes = JSON.stringify(h);
if (i >= 0) h[i] = fila; else h.push(fila);
h.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
/* solo se escribe si hay un dato nuevo: así la tarea no hace un commit por cada vuelta */
if (JSON.stringify(h) !== antes) {
  datos.actualizado = d.leido;
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(datos, null, 2) + "\n");
}

const peso = (n) => "$" + Math.round(n).toLocaleString("es-CO");
const nuevo = i < 0 && previo && previo.precioCarga !== d.precioCarga;
let resumen = `FNC ${d.fecha}: ${peso(d.precioCarga)} la carga · bolsa NY ${d.ny} US¢/lb · TRM ${d.trm}`;
if (nuevo) {
  const dif = d.precioCarga - previo.precioCarga, pct = (dif / previo.precioCarga) * 100;
  resumen = `La FNC ${dif > 0 ? "subió" : "bajó"} el precio: ${peso(previo.precioCarga)} → ${peso(d.precioCarga)} (${dif > 0 ? "+" : ""}${pct.toFixed(1).replace(".", ",")} %) el ${d.fecha}`;
}
console.log(resumen);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `cambio=${nuevo ? "si" : "no"}\nresumen=${resumen}\n`);

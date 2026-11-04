/* Lo que comparten api/pago.js y api/wompi.js: el catálogo con los precios de
   verdad, la cuenta del pedido, los datos del comprador y la conversación con la
   hoja (Apps Script). El navegador nunca dice cuánto cuesta algo: aquí se vuelve
   a calcular con lo que publicó tools/build.js. El guion bajo del nombre hace
   que Vercel no lo publique como ruta. */
import { readFile } from "node:fs/promises";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";

const RUTA_CATALOGO = path.join(process.cwd(), "prototipo", "data", "catalogo.json");

/* El catálogo que publica tools/build.js. En Vercel se lee del disco (vercel.json
   lo incluye en la función); si no está, se pide a la misma página. */
export async function catalogo(req) {
  try {
    return JSON.parse(await readFile(RUTA_CATALOGO, "utf8"));
  } catch {
    const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
    if (!host) throw new Error("sin catálogo");
    const r = await fetch(`https://${host}/data/catalogo.json`);
    if (!r.ok) throw new Error("sin catálogo");
    return r.json();
  }
}

export const sha256 = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");
/* comparar firmas sin dar pistas por el tiempo que tarda */
export function iguales(a, b) {
  const x = Buffer.from(String(a || "").toLowerCase()), y = Buffer.from(String(b || "").toLowerCase());
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}
export function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}

/* Número de pedido: fecha y seis letras al azar, para que no se pueda adivinar */
export function numeroPedido(ahora = new Date()) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", b = randomBytes(6);
  const mmdd = String(ahora.getMonth() + 1).padStart(2, "0") + String(ahora.getDate()).padStart(2, "0");
  return `NDZ-${mmdd}-` + [...b].map((x) => abc[x % abc.length]).join("");
}

const gramos = (g) => (g >= 1000 ? g / 1000 + " kg" : g + " g");
/* Un café en preventa se cobra aunque no tenga bolsas: se despacha el día de
   `entrega`. Vale hasta el final del día de `cierre` (hora de Colombia), aunque el
   catálogo no se haya vuelto a publicar. Igual que en la página, deja de serlo
   apenas el café tiene bolsas: desde ahí se vende de lo que hay. */
export const enPreventa = (p, ahora = new Date()) =>
  !!(p && p.preventa && !(p.variantes || []).some((v) => Number(v.stock) > 0)
    && (!p.cierre || new Date(p.cierre + "T23:59:59-05:00") >= ahora));
const fechaCorta = (iso) => new Date(iso + "T12:00:00-05:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });
/* Más que esto en un solo pedido es más probable un error (o alguien apartando
   todo el inventario) que una compra: se le pide escribir por WhatsApp. */
export const MAX_BOLSAS = 30;

/* La cuenta del pedido con los precios del catálogo. Es la misma cuenta que hace
   el carrito (prototipo/js/shop.js): envío según el subtotal antes del bono, el
   bono redondeado al peso, y el IVA que ya va dentro del precio. */
export function cotizar(cat, items, pctBono = 0) {
  if (!Array.isArray(items) || !items.length || items.length > 20) return { error: "carrito" };
  const lineas = [];
  for (const it of items) {
    const p = (cat.productos || []).find((x) => x.id === it?.id);
    const v = p && (p.variantes || []).find((x) => x.g === Number(it.g));
    const n = Number(it?.n);
    if (!p || !v) return { error: "producto", id: it?.id };
    if (p.proximamente || !(v.precio > 0)) return { error: "no-disponible", id: p.id };
    if (!Number.isInteger(n) || n < 1) return { error: "cantidad", id: p.id };
    const ya = lineas.find((l) => l.id === p.id && l.g === v.g);
    /* En preventa: el precio de preventa si lo hay, y lo que se aparta es el cupo
       (0 = sin tope), no unas bolsas que todavía no existen. */
    const pre = enPreventa(p);
    if (ya) ya.n += n;
    else lineas.push({ id: p.id, g: v.g, n, precio: pre && p.preventaPrecio > 0 ? p.preventaPrecio : v.precio,
      stock: pre ? Number(p.cupo) || 0 : Number(v.stock) || 0,
      nombre: `${p.nombre?.es || p.id} ${gramos(v.g)}`,
      forma: (p.sale?.es || "") + (pre ? " · preventa, sale el " + fechaCorta(p.entrega || p.cierre) : ""),
      ...(pre ? { preventa: true } : {}) });
  }
  if (lineas.reduce((s, l) => s + l.n, 0) > MAX_BOLSAS) return { error: "cantidad" };
  const subtotal = lineas.reduce((s, l) => s + l.precio * l.n, 0);
  const pct = Math.min(Math.max(Number(pctBono) || 0, 0), 50);
  const descuento = Math.round((subtotal * pct) / 100);
  const envio = subtotal >= cat.envio.gratisDesde ? 0 : cat.envio.costo;
  const iva = cat.iva ? Math.round(((subtotal - descuento) * cat.iva) / (100 + cat.iva)) : 0;
  return { lineas, subtotal, descuento, envio, total: subtotal - descuento + envio, iva };
}

/* Los datos del comprador, revisados otra vez aquí: el navegador también los
   revisa, pero lo que llega al servidor puede venir de cualquier parte. */
export function comprador(c = {}) {
  const t = (v, n) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n);
  const d = { nombre: t(c.nombre, 60), apellidos: t(c.apellidos, 60), documento: t(c.documento, 20), tel: t(c.tel, 20),
    direccion: t(c.direccion, 120), detalle: t(c.detalle, 120), ciudad: t(c.ciudad, 60),
    departamento: t(c.departamento, 40), correo: t(c.correo, 120).toLowerCase() };
  if (!d.nombre || !d.apellidos) return { error: "nombre" };
  if (d.documento.replace(/\D/g, "").length < 5) return { error: "documento" };
  if (d.tel.replace(/\D/g, "").length < 7) return { error: "tel" };
  if (!d.direccion || !d.ciudad || !d.departamento) return { error: "direccion" };
  /* con pago en línea el correo es obligatorio: ahí llega la constancia del pago */
  if (!/^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$/.test(d.correo)) return { error: "correo" };
  return { d };
}

/* La hoja de Google (tools/correos/Codigo.gs). Va como texto plano, igual que
   desde la página: Apps Script lo recibe sin pedir permiso previo. */
export async function hoja(registro, cuerpo) {
  const r = await fetch(registro, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(cuerpo), redirect: "follow" });
  return r.json();
}
export async function hojaGet(registro, params) {
  const r = await fetch(registro + "?" + new URLSearchParams(params).toString(), { redirect: "follow" });
  return r.json();
}
export const registroDe = (cat) => process.env.REGISTRO_URL || cat.registro || "";

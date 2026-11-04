/* ============================================================
   PREVENTA DE PRUEBA · reservar un café que todavía no tiene bolsas
   Uso:  node tools/pruebas/preventa.mjs

   Corre api/pago.js y la hoja (tools/correos/Codigo.gs) de verdad, con Wompi,
   Google Sheets y Gmail simulados (tools/pruebas/simulador.mjs). Revisa que:
   - una reserva sin cupo se cobra aunque el café tenga 0 bolsas,
   - el precio de preventa es el que se cobra,
   - con cupo, la hoja lleva la cuenta para todos y no deja pasar de ahí,
   - un cobro vencido devuelve su lugar en el cupo,
   - pasado el último día, ya no se puede reservar,
   - y el Castillo, que sí tiene bolsas, sigue descontando de su stock.
   No toca la hoja real ni envía correos.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { hojaSimulada, conectar, api, llamar } from "./simulador.mjs";

const hoy = new Date(), dia = (d) => new Date(hoy.getTime() + d * 864e5).toISOString().slice(0, 10);
const cafe = (id, extra) => ({ id, nombre: { es: id, en: id }, sale: { es: "En grano" }, proximamente: false, color: "#2F5A3C",
  sub: { es: "", en: "" }, gramos: 250, foto: "", url: { es: "https://prueba.local/" + id, en: "https://prueba.local/en/" + id }, ...extra });
const CAT = {
  productos: [
    cafe("P-CAS", { precio: 40000, preventa: false, entrega: "", variantes: [{ g: 250, precio: 40000, stock: 50 }] }),
    /* sin cupo y sin precio de preventa: lo que hay hoy en el catálogo real */
    cafe("P-PAR", { precio: 40000, preventa: true, entrega: dia(10), cierre: dia(10), cupo: 0, preventaPrecio: 0,
      variantes: [{ g: 250, precio: 40000, stock: 0 }] }),
    /* con cupo de 3 y precio de preventa */
    cafe("P-BLE", { precio: 40000, preventa: true, entrega: dia(10), cierre: dia(10), cupo: 3, preventaPrecio: 36000,
      variantes: [{ g: 250, precio: 40000, stock: 0 }] }),
    /* una preventa que ya cerró */
    cafe("P-VIE", { precio: 40000, preventa: true, entrega: dia(-2), cierre: dia(-2), cupo: 0, preventaPrecio: 0,
      variantes: [{ g: 250, precio: 40000, stock: 0 }] }),
  ],
  envio: { costo: 12000, gratisDesde: 120000 }, iva: 5, registro: "https://hoja.prueba/exec",
};
const TMP = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMPDIR || "/tmp"), "preventa-"));
fs.mkdirSync(path.join(TMP, "prototipo/data"), { recursive: true });
fs.writeFileSync(path.join(TMP, "prototipo/data/catalogo.json"), JSON.stringify(CAT));
process.chdir(TMP);

const { gs, props, H } = hojaSimulada(CAT);
conectar({ gs, props });
const { pago } = await api();

let n = 0;
const comprador = () => (n++, { nombre: "Ana", apellidos: "Prueba", documento: String(1000000000 + n), tel: "3001234567",
  direccion: "Calle 10 # 5-23", ciudad: "Cúcuta", departamento: "Norte de Santander", correo: `p${n}@correo.com` });
const reservar = (items) => llamar(pago, { items, comprador: comprador(), idioma: "es", llavePublica: "pub_test_X" });
const stock = () => Object.fromEntries(H("Stock").slice(1).map((f) => [f[0], Number(f[2])]));

const fallas = [];
const revisar = (ok, que) => { console.log((ok ? "  OK     " : "  FALLA  ") + que); if (!ok) fallas.push(que); };

let r = await reservar([{ id: "P-PAR", g: 250, n: 2 }]);
revisar(r.codigo === 200 && r.ok, "sin cupo, El Paraíso con 0 bolsas se puede pagar");
revisar(r.subtotal === 80000, "sin precio de preventa se cobra el de siempre");
revisar(/preventa, sale el/.test(r.lineas?.[0]?.forma || ""), "la línea dice que es preventa y cuándo sale");
revisar(!("P-PAR-250" in stock()) && !("P-PAR-250-pre" in stock()), "sin cupo no se descuenta nada de la hoja");
const fila = H("Pedidos").find((f) => f[0] === r.reference);
revisar(fila && /preventa/.test(fila[7]), "el pedido en la hoja dice preventa");

r = await reservar([{ id: "P-BLE", g: 250, n: 2 }]);
revisar(r.ok && r.subtotal === 72000, "con precio de preventa se cobran $36.000 por bolsa");
revisar(stock()["P-BLE-250-pre"] === 1, "la hoja lleva el cupo aparte: quedan 1 de 3");
const vence = r.reference;
r = await reservar([{ id: "P-BLE", g: 250, n: 2 }]);
revisar(r.codigo === 409 && r.error === "agotado", "con el cupo lleno, la siguiente reserva no pasa");

/* el cobro de 2 bolsas vence sin pagar: la hoja lo cancela y devuelve su lugar */
gs.doPost({ postData: { contents: JSON.stringify({ accion: "pedido", clave: props.CLAVE, id: vence, estado: "cancelado", soloReserva: true }) } });
revisar(stock()["P-BLE-250-pre"] === 3, "un cobro cancelado devuelve su lugar en el cupo");
r = await reservar([{ id: "P-BLE", g: 250, n: 3 }]);
revisar(r.ok, "y esos lugares se pueden volver a reservar");

r = await reservar([{ id: "P-VIE", g: 250, n: 1 }]);
revisar(r.codigo === 409, "pasado el último día, una preventa sin bolsas ya no se puede pagar");

r = await reservar([{ id: "P-CAS", g: 250, n: 1 }, { id: "P-PAR", g: 250, n: 1 }]);
revisar(r.ok && stock()["P-CAS-250"] === 49, "el Castillo, con bolsas, descuenta de su stock aunque vaya con una reserva");

console.log(fallas.length ? `\n${fallas.length} fallas` : "\nTodo bien");
process.exit(fallas.length ? 1 : 0);

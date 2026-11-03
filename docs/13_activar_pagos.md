# Activar el pago en línea (Wompi)

**Fecha:** 3 de noviembre de 2026
**Estado:** todo está construido y probado. Solo falta **pegar las llaves**: la página sigue funcionando como antes hasta que exista la llave pública.

Para saber en cualquier momento qué falta:

```bash
node tools/estado.mjs --en-vivo
```

---

## 1. Por qué Wompi

Costo de cobrar un pedido típico de Nandez, con el IVA de la comisión (tarifas publicadas a octubre de 2026):

| Pasarela | Pedido de $52.000 | Pedido de $92.000 | Condición |
|---|---|---|---|
| **Wompi** | **$2.473 (4,76 %)** | **$3.734 (4,06 %)** | 2,65 % + $700 + IVA, sin mensualidad |
| ePayco | $2.455 (4,72 %) | $3.711 (4,03 %) | Solo con cuenta Davivienda; con otro banco, 5,52 % |
| Mercado Pago | $2.988 (5,75 %) | $4.554 (4,95 %) | 3,29 % + $800 con la plata al instante |
| Bold / PayU | ~$3.110 (~6 %) | ~$4.700 (~5,1 %) | |

Wompi y ePayco quedan empatados (unos $18 por cobro), pero ePayco exige Davivienda. Wompi además: es del Grupo Bancolombia, el pago se abre **encima de la página** (la persona no se va a otro sitio), **firma el monto** para que nadie lo cambie desde el navegador, firma sus avisos, y tiene un ambiente de pruebas con tarjetas y Nequi de prueba.

**Por confirmar con Wompi:** que acepta persona natural (su documentación no lo dice).

## 2. Lo que hay que agregar, en orden

### A. La cuenta de Wompi
Registrarse en [comercios.wompi.co](https://comercios.wompi.co). Las llaves de **pruebas** salen de una vez; las de producción, cuando aprueben la cuenta. En *Desarrolladores → Secretos para integración técnica* están las cuatro:

| Llave | Empieza por | Va en |
|---|---|---|
| Pública | `pub_test_` | La página (paso B) |
| Privada | `prv_test_` | **En ningún lado**: el sistema no la usa |
| Integridad | `test_integrity_` | Vercel (paso C) |
| Eventos | `test_events_` | Vercel (paso C) |

### B. La llave pública en la página
En [prototipo/js/core.js](../prototipo/js/core.js), `CONFIG.pagos.wompi.llavePublica = "pub_test_…"`. Después `node tools/build.js`, commit y push. La pública es pública por diseño: puede ir en el repositorio.

### C. Los secretos en Vercel
*Settings → Environment Variables*, y luego **Redeploy**. **Nunca en el repositorio.**

| Variable | Valor |
|---|---|
| `WOMPI_INTEGRIDAD` | El secreto de integridad (`test_integrity_…`) |
| `WOMPI_EVENTOS` | El secreto de eventos (`test_events_…`) |
| `NANDEZ_CLAVE` | La clave del panel (la que deja `configurar` en Apps Script) |

### D. La URL de eventos en Wompi
En el panel de Wompi, *URL de eventos* = `https://cafeweb-five.vercel.app/api/wompi`. Se configura aparte en pruebas y en producción.

### E. La versión nueva del script de la hoja
Pegar [tools/correos/Codigo.gs](../tools/correos/Codigo.gs) completo en Apps Script, ejecutar **configurar** (crea lo que falte sin tocar lo que hay: la hoja Stock, las columnas nuevas y un disparador **cada hora** que libera reservas) y publicar una **nueva versión** de la misma implementación (*Implementar → Administrar implementaciones → editar*), para que la URL no cambie.

### F. Revisar y hacer una compra de prueba real
`node tools/estado.mjs --en-vivo` debe salir todo en ✓. Luego, en la página, una compra con los datos de prueba de Wompi:

| Medio | Aprueba | Rechaza |
|---|---|---|
| Tarjeta (cualquier fecha futura y CVC) | `4242 4242 4242 4242` | `4111 1111 1111 1111` |
| Nequi | `3991111111` | `3992222222` |
| PSE | el banco que dice que aprueba | el que rechaza |

Debe llegar «Pago recibido» al correo del comprador, «Pago confirmado» a nandezcafe@gmail.com, el pedido debe quedar **pagado** en la hoja y el stock bajar.

### G. Pasar a vender
Cambiar las tres llaves por las de producción (`pub_prod_`, `prod_integrity_`, `prod_events_`), poner la URL de eventos en producción y hacer una compra real pequeña. El sistema **no mezcla ambientes**: una llave de pruebas con un secreto de producción se rechaza, y un aviso de pruebas no toca la tienda real.

## 3. Cómo funciona por dentro

1. **La persona paga.** La página manda a `api/pago.js` solo qué quiere (café, presentación, cantidad) y sus datos. **Nunca el precio.**
2. **El servidor hace la cuenta** con el catálogo que publica el build (`prototipo/data/catalogo.json`): precios, envío, bono validado contra la hoja e IVA. Si el catálogo de la página estaba viejo, la persona ve «El total cambió» antes de pagar; nunca se cobra otro monto en silencio.
3. **La hoja aparta las bolsas: todo o nada.** Si una sola presentación no alcanza, no se aparta nada, no se gasta el bono y la página dice qué se agotó.
4. **El servidor firma el monto** con el secreto de integridad y el cobro vence a los 30 minutos.
5. **Se abre Wompi encima de la página.** La tarjeta nunca pasa por nuestros servidores.
6. **Wompi avisa a `api/wompi.js`**, que revisa la firma del aviso. Un aviso sin firma válida no mueve nada. Con el aviso de *aprobado* la hoja marca el pedido **pagado** y salen los dos correos. Si Wompi repite el aviso, no pasa nada dos veces.

| Si… | Pasa esto |
|---|---|
| El pago se rechaza | La reserva sigue; la persona puede reintentar y el reintento suelta la reserva anterior, aunque haya recargado la página |
| Nadie paga | A las **2 horas** la hoja suelta las bolsas y el bono (disparador cada hora) |
| El pago llega después de soltar | Se vuelve a apartar y se marca pagado, con nota; si ya no hay bolsas, se avisa |
| Llega menos plata que el total | No se marca pagado: nota y correo a Nandez |
| Wompi anula un pago | El pedido vuelve a «nuevo» y se avisa a Nandez para no despacharlo |
| La pasarela no responde | La página ofrece transferencia o Nequi sin perder el carrito ni lo escrito |

En el panel, una reserva sin pagar dice **«Pagando en línea»** y no tiene botón de marcar pagado: la marca el aviso de Wompi, no una persona. Cada pedido pagado tiene su botón **Factura** con los datos para el servicio gratuito de la DIAN.

## 4. Las pruebas

```bash
node tools/pruebas/compras.mjs 150                  # catálogo de prueba
node tools/pruebas/compras.mjs 60 --catalogo real   # el catálogo que se vende hoy
node tools/pruebas/servidor.mjs                     # la tienda en el navegador: http://localhost:5190
```

`compras.mjs` corre el código de verdad (servidor, script de la hoja y factura del panel) y simula solo Wompi, Google y Gmail, en memoria: **no toca la hoja real ni envía correos**. El Wompi simulado rechaza un cobro mal firmado y firma sus avisos como el real.

**Resultado del 3 de noviembre de 2026:** 196/196 con el catálogo de prueba y 106/106 con el real, **302 compras y 336 pedidos pagados**, con los 8 invariantes en verde (stock, transacciones, plata, correos, bonos, facturas). Además, 6 compras en el navegador con clics reales en `servidor.mjs`: aprobada con tarjeta, rechazada y reintentada con Nequi, total cambiado y pagada por PSE, en inglés y en el celular, sin correo y con la pasarela caída.

Las compras en el navegador encontraron **dos errores que se corrigieron**: el widget se abría debajo del carrito (un diálogo modal deja todo lo demás inerte, y el primer clic cerraba el carrito en vez de pagar), y la reserva sin pagar se olvidaba al recargar la página, con lo que se apartaban dos veces las mismas bolsas.

**Lo que estas pruebas no cubren:** el Wompi de verdad. Eso se prueba en el paso F, con las llaves de prueba.

## 5. Límites conocidos

- **Alguien podría apartar inventario sin pagar.** Lo frenan el tope de 30 bolsas por pedido y la liberación a las 2 horas, pero no hay límite de intentos por persona.
- **Pagos en efectivo o que tardan más de 2 horas:** si llegan, se vuelven a apartar; si ya no hay bolsas, queda la nota y el aviso.
- **Devoluciones:** se hacen desde el panel de Wompi; el sistema se entera por el aviso de anulación.
- **La factura** se sigue haciendo a mano en el servicio gratuito de la DIAN, con el botón Factura del panel.
- **El link de Mercado Pago** solo aparece si no hay llave de Wompi.

# 15 · Activar Mercado Pago para la preventa

**Fecha:** 7 de noviembre de 2026
**Estado:** el código está listo y probado (`node tools/pruebas/mercadopago.mjs`). Faltan tres pasos tuyos, porque llevan secretos o cuentas: el token en Vercel, el script de la hoja y el push.

Mercado Pago pasa por la **misma tubería segura que Wompi**: el navegador solo dice qué café quiere; el servidor rehace la cuenta con el catálogo, aparta el cupo de la preventa en la hoja y crea el cobro con *su* total. Quien marca el pedido como pagado es el aviso de Mercado Pago a `api/webhook.js` (que antes le pregunta a Mercado Pago, con el token, cómo quedó ese pago), no la página. Antes, `api/checkout.js` creaba la preferencia con los precios que mandaba el navegador y no reservaba nada; eso ya no existe.

Cuando haya cuenta de Wompi, se cambia `CONFIG.pagos.pasarela` de `"mercadopago"` a `"wompi"` (pasos en [13_activar_pagos.md](13_activar_pagos.md)).

## Pasos, en este orden

### 1. El Access Token de Mercado Pago
En [mercadopago.com.co/developers](https://www.mercadopago.com.co/developers) → *Tus integraciones* → crear una aplicación (**Checkout Pro**) → *Credenciales de producción* → copiar el **Access Token** (`APP_USR-…`). Para probar antes, las credenciales de prueba (`TEST-…`) con usuarios de prueba.

### 2. Variables en Vercel
*Settings → Environment Variables* y luego **Redeploy**. Nunca en el repositorio.

| Variable | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | El Access Token del paso 1 |
| `NANDEZ_CLAVE` | La clave del panel (la que deja `configurar` en Apps Script). Sin ella el aviso de pago no puede marcar nada. |

La URL de avisos **no se configura en ningún panel**: cada cobro lleva la suya (`/api/webhook`).

### 3. La versión nueva del script de la hoja
Pegar [tools/correos/Codigo.gs](../tools/correos/Codigo.gs) completo en Apps Script, ejecutar **configurar** y publicar una **nueva versión** de la misma implementación. Cambió una cosa: ahora la hoja reconoce `mercadopago` como canal de pasarela (reserva el cupo, libera la reserva a las 2 horas, no manda el correo hasta que el pago se aprueba). **Sin este paso, un pedido de Mercado Pago no reserva el cupo.**

### 4. Revisar
```bash
node tools/estado.mjs --en-vivo
```
Debe salir todo en ✓ (incluido «Vercel tiene MP_ACCESS_TOKEN»). Luego una compra pequeña real (o de prueba) y revisar: «Pago recibido» al correo del comprador, «Pago confirmado» a nandezcafe@gmail.com, el pedido **pagado** en la hoja y el cupo descontado.

## La tarjeta dentro de la página (10 de noviembre de 2026)

Con la **llave pública** de Mercado Pago (`APP_USR-…`, está junto al Access Token en *Credenciales de producción*) pegada en `CONFIG.pagos.mp.llavePublica`, la tarjeta se paga **sin salir de la página**: los campos aparecen dentro del carrito, los pone Mercado Pago (Checkout Bricks) y lo que sale de ahí es un token de un solo uso, así que la tarjeta nunca pasa por nuestros servidores. Cobra `api/tarjeta.js` con el mismo `MP_ACCESS_TOKEN`; no hay que configurar nada más. Sin la llave, todo sigue como abajo: la persona va a Mercado Pago y vuelve.

- **Tarjeta:** aquí mismo. Aprobada o rechazada al instante (sin «en revisión»), y si se aprueba el pedido queda **pagado en ese momento**, sin esperar el aviso.
- **PSE, Nequi o cuenta de Mercado Pago:** siguen por Mercado Pago. PSE de todos modos pasa por la página del banco.
- **Rechazada:** el motivo en palabras de cliente («la tarjeta no tiene cupo», «revisa el código de seguridad»…) y «Intentar con otra tarjeta», que suelta la reserva anterior.
- **Si los precios cambiaron** desde que abrió la página, no se cobra: se le muestra el total nuevo.
- **Nunca dos cobros por un pedido:** la llave de idempotencia es el número de la reserva.

Además, el carrito pide menos: **un solo campo de nombre y apellidos**; la **ciudad llena sola el departamento** (salvo nombres que existen en dos departamentos, como Toledo); y **los datos quedan guardados en el navegador de quien compró**, así que la segunda compra no se escribe nada y el carrito abre directo en el pago. «Olvidar mis datos» los borra.

Pruebas: `node tools/pruebas/tarjeta.mjs 150` (166/166 y 8 invariantes el 10-nov-2026) y la tienda de prueba `node tools/pruebas/servidor.mjs`, con campos de tarjeta simulados.

## Lo que ve el cliente (sin la llave pública)
1. Llena el carrito y sus datos (el correo es obligatorio: ahí llega la constancia).
2. «Pagar ahora» → se abre Mercado Pago (tarjeta, PSE o Nequi; **sin efectivo**, porque un cobro en corresponsal tarda días y la reserva se libera a las 2 horas).
3. Al terminar vuelve a la página con «Pago recibido» y la fecha de despacho de la preventa. Si no paga o cancela, vuelve con el carrito intacto para reintentar.
4. Si el servidor no responde (por ejemplo, falta el token), la página ofrece el pago por transferencia o Nequi sin perder lo que escribió.

## Reglas que cuida el código
- El monto lo pone el servidor; nadie lo cambia desde el navegador.
- Todo o nada: si falta una bolsa o el cupo, no se aparta ninguna y no se gasta el bono.
- Pagó menos del total → no se marca pagado y se avisa a Nandez.
- Aviso repetido → no pasa nada dos veces.
- Pago devuelto después de pagado → el pedido vuelve a «nuevo»: no se despacha.
- Con bono, el pedido va a Mercado Pago en una sola línea por el total exacto (no acepta líneas negativas); sin bono, una línea por café y el envío aparte.

---

## Lo demás que quedó pendiente (no es código)

### Dominio nandezcoffee.com
**Conectado el 7 de noviembre de 2026.** La dirección oficial es `https://www.nandezcoffee.com`; `nandezcoffee.com` redirige ahí (308) y `cafeweb-five.vercel.app` sigue respondiendo.
- Vercel: proyecto `cafeweb`, *Settings → Domains*.
- Hostinger, DNS: `A @ → 216.198.79.1` y `CNAME www → f2ae260d008bf6e7.vercel-dns-017.com`. No hay registros de correo.
- `CONFIG.sitio` (`prototipo/js/core.js`) y `SITIO` (`tools/correos/Codigo.gs`) ya usan el dominio. Los enlaces de los correos cambian cuando se vuelva a pegar `Codigo.gs` en Apps Script.

### Meta Pixel
Se crea en [business.facebook.com/events_manager](https://business.facebook.com/events_manager) → *Conectar orígenes de datos* → *Web* → *Meta Pixel*. Copiar el **ID** (15 o 16 dígitos) y pegarlo en `CONFIG.medicion.metaPixel`. La cuenta de anuncios `NandezCoffeeGang` no tiene ningún conjunto de datos hoy.

### Google Analytics 4
[analytics.google.com](https://analytics.google.com) → *Administrar* → *Crear propiedad* → *Flujo de datos web* → la dirección de la página → copiar el **ID de medición** (`G-XXXXXXXXXX`) en `CONFIG.medicion.ga4`.

### Banner de cookies
Ya está construido (`prototipo/js/medir.js`). Sale **solo cuando hay un ID en `CONFIG.medicion`**: pedir permiso para cookies que no existen sería ruido. Apenas se pegue el del píxel o el de Analytics, el banner aparece y nada se mide hasta que la persona acepte.

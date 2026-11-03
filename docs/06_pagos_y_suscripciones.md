# Pagos con Mercado Pago y suscripciones

**Fecha:** 28 de octubre de 2026
**Estado:** la pasarela elegida es **Wompi** y el pago dentro de la página está construido y probado; falta pegar las llaves. Todo el detalle, la comparación de tarifas y los pasos: [13_activar_pagos.md](13_activar_pagos.md). Lo de abajo sobre Mercado Pago queda como respaldo.

---

## 1. Tres formas de cobrar, de menos a más trabajo

| Camino | Qué es | Cuándo usarlo | Qué falta |
|---|---|---|---|
| **A. Link de pago** | Un link que se genera desde la cuenta de Mercado Pago y se comparte por WhatsApp o se pega en un botón | Para arrancar **hoy**, con pocos productos | Crear un link por presentación y pegarlos en `CONFIG.pagos.porProducto` |
| **B. Checkout Pro** *(ya programado)* | El cliente arma el pedido en la página, va a Mercado Pago, paga y vuelve | Cuando haya más de tres o cuatro productos | Solo poner `MP_ACCESS_TOKEN` en Vercel |
| **C. Checkout API** | El pago ocurre dentro de nuestra página, sin salir | Cuando el volumen lo justifique | Certificación PCI y bastante más desarrollo |

**Recomendación:** empezar con **A** esta semana y activar **B** apenas exista la cuenta de vendedor.

### Lo que hay hoy: link de cobro personal

`CONFIG.pagos.mercadoPago` apunta a `https://link.mercadopago.com.co/nandezcoffee`. Ese link **no lleva el monto**: abre la caja de Mercado Pago en cero y el cliente escribe cuánto paga.

Por eso el carrito, al oprimir *Pagar ahora*, no manda a Mercado Pago de una: primero guarda el pedido y muestra una ventana con el número (`NDZ-…`), el total exacto y un botón para copiarlo, y de ahí sí abre Mercado Pago. La descripción del pago lleva el número del pedido, que es con lo que se cruza el pago contra el pedido.

**Lo que hay que revisar a mano:** que el monto que entró coincida con el total del pedido. Apenas haya `MP_ACCESS_TOKEN`, cambiar `mercadoPago` a `"/api/checkout"` y el total viaja solo; esa ventana deja de aparecer sin tocar nada más.

## 2. Activar el Checkout Pro (camino B)

Ya está todo escrito en el repositorio:

- `api/checkout.js` — crea la preferencia de pago y devuelve el link.
- `api/webhook.js` — recibe el aviso de Mercado Pago cuando el pago cambia de estado.
- La página llama a `/api/checkout` si `CONFIG.pagos.mercadoPago` vale `"/api/checkout"`.

Pasos:

1. Crear cuenta de vendedor en Mercado Pago Colombia y, en *Tus integraciones*, una aplicación.
2. Copiar el **Access Token de producción**.
3. En Vercel: *Settings → Environment Variables* → `MP_ACCESS_TOKEN` = el token. **Nunca en el repositorio.**
4. En `prototipo/js/core.js`, poner `pagos: { mercadoPago: "/api/checkout", ... }` y correr `node tools/build.js`.
5. Probar primero con las credenciales de prueba y las tarjetas de test que da Mercado Pago.

En Vercel hay que dejar el *Root Directory* del proyecto en la raíz (no en `prototipo`) para que `api/` funcione; `vercel.json` ya indica que el sitio estático sale de `prototipo`.

## 2 bis. El IVA

**El café tostado paga IVA del 5 %**, no del 19 %: está en el artículo 468-1 del Estatuto Tributario, partida 09.01, que cubre el café tostado o descafeinado. El café verde sin tostar está excluido. Si ves una tienda cobrando el 19 % sobre café tostado, está usando la tarifa general; no es referencia.

**Quién tiene que cobrarlo.** Solo quien sea *responsable de IVA*. Una persona natural no lo es mientras cumpla las condiciones del parágrafo 3 del artículo 437: ingresos brutos bajo 3.500 UVT (con la UVT 2026 de $52.374 son $183.309.000), un solo establecimiento, no ser usuario aduanero, y sin contratos ni consignaciones gravadas por encima de ese tope. **Confirmar con el contador antes de facturar.**

**Cómo quedó en la página.** `CONFIG.iva` vale `5`. El precio que se muestra ya lo incluye, como manda el precio al consumidor: la bolsa de $40.000 lleva $1.905 de IVA adentro. Debajo del total del carrito aparece «Incluye $1.905 de IVA (5 %)», el envío no lo lleva, y el pedido guarda la cifra en su propia columna de la hoja para cuando haya que facturar. **Poniendo `iva: 0` desaparece todo**, que es como debe quedar si Nandez no es responsable.

| Sobre una bolsa de $40.000 | |
|---|---|
| IVA 5 % incluido | $1.905 |
| Comisión Mercado Pago (3,49 % + IVA) | $1.661 |
| **Se va antes de tocar la caja** | **$3.566 ≈ 9 %** |

Esos dos descuentos **ya están en el cotizador**, con sus casillas para cambiarlos. El margen dejó de medirse sobre lo que entra por caja y pasa a medirse sobre lo que queda, que es lo que importa al decidir cuánto pagarle a la finca. En el lote de ejemplo, el tope de compra bajó de $48.625 a $42.895 por kilo: antes el cotizador autorizaba pagar casi $6.000 de más por kilo.

## 3. Cuánto cobra Mercado Pago

Para Colombia, la comisión ronda **3,49 % + IVA** con acreditación al día siguiente, y sube si el dinero se quiere de inmediato; algunas fuentes mencionan además un fijo por transacción. **Hay que confirmarlo en la cuenta**, porque cambia por método de pago y volumen.

Qué significa en la práctica, sobre una bolsa de $68.000:

| Concepto | Valor |
|---|---|
| Precio de venta | $68.000 |
| Comisión ~3,49 % + IVA | ≈ $2.825 |
| **Queda** | **≈ $65.175** |

Es un 4 % del precio. **Hay que meterlo en el cotizador** como costo de venta, o el margen calculado queda inflado.

## 4. Suscripciones

Mercado Pago tiene **suscripciones (preapproval)**: se crea un plan con una frecuencia, el cliente autoriza una vez y los cobros siguientes salen automáticos.

Nuestra propuesta, ya en la página:

| Plan | Precio | Qué incluye |
|---|---|---|
| **Descubrir** | $68.000/mes | Una bolsa de 250 g del lote más reciente |
| **Dos fincas** | $120.000/mes | Dos bolsas de 250 g de fincas distintas + acceso anticipado a la subasta |
| **Cafetería** | $460.000/mes | 2 kg al mes, precio de mayorista, tostión al perfil del cliente |

Por qué estos tres: el primero es para probar, el segundo es el que queremos vender (comparar dos orígenes es nuestra historia) y el tercero convierte una cafetería en ingreso fijo.

**Antes de abrir la suscripción hay que poder cumplirla:** tostar y despachar el mismo día cada mes, tener café disponible todo el año (hoy la cosecha es estacional) y un costo de envío claro. Mientras tanto, la página **recoge correos** en vez de cobrar: el botón guarda el interesado y ya.

Para activarla: crear el plan en Mercado Pago, copiar el link de cada plan y ponerlo en `CONFIG.pagos.suscripcion`.

## 5. Antes de cobrar de verdad

- **Facturación:** hablar con el contador sobre facturación electrónica y sobre cómo se documentan las ventas al consumidor.
- **Datos personales:** aviso de privacidad y autorización (Ley 1581 de 2012), porque ya se guardan correos.
- **Términos y condiciones**: envíos, tiempos, devoluciones y qué pasa si el café llega mal.
- **Registro sanitario del INVIMA** para vender café tostado empacado (ver `03_compra_y_marca.md`).
- **Envíos:** definir transportadora y costo por ciudad, o incluirlo en el precio.

## Fuentes
[Checkout Pro](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/landing) · [Costos de recibir pagos](https://www.mercadopago.com.co/ayuda/costos-recibir-pagos-checkout_33399) · [Comisiones](https://www.mercadopago.com.co/ayuda/220) · [Suscripciones](https://www.mercadopago.com.co/developers/es/docs/subscriptions/overview) · [Crear suscripción (API)](https://www.mercadopago.com.co/developers/es/reference/subscriptions/_preapproval/post) · [Comparativa de pasarelas en Colombia 2026](https://btodigital.com/pasarelas-pago-colombia-comparativa-guia-negocio/)

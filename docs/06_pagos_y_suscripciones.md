# Pagos con Mercado Pago y suscripciones

**Fecha:** 26 de septiembre de 2026
**Estado:** la página ya tiene los botones y la función lista; falta la cuenta y las llaves.

---

## 1. Tres formas de cobrar, de menos a más trabajo

| Camino | Qué es | Cuándo usarlo | Qué falta |
|---|---|---|---|
| **A. Link de pago** | Un link que se genera desde la cuenta de Mercado Pago y se comparte por WhatsApp o se pega en un botón | Para arrancar **hoy**, con pocos productos | Crear un link por presentación y pegarlos en `CONFIG.pagos.porProducto` |
| **B. Checkout Pro** *(ya programado)* | El cliente arma el pedido en la página, va a Mercado Pago, paga y vuelve | Cuando haya más de tres o cuatro productos | Solo poner `MP_ACCESS_TOKEN` en Vercel |
| **C. Checkout API** | El pago ocurre dentro de nuestra página, sin salir | Cuando el volumen lo justifique | Certificación PCI y bastante más desarrollo |

**Recomendación:** empezar con **A** esta semana y activar **B** apenas exista la cuenta de vendedor.

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

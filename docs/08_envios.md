# Envíos: cómo lo hacen los demás y qué nos conviene

**Fecha:** 26 de septiembre de 2026

---

## 1. Lo que cobra el mercado

| Tienda | Qué cobra |
|---|---|
| **[La Tienda del Café](https://latiendadelcafe.co/pages/faq)** (café colombiano) | **$9.000 a $12.000** según la ciudad. **Gratis desde $150.000.** Entrega: 1 a 2 días en Medellín, 2 a 5 en ciudades principales, 6 a 10 en zonas rurales. Trabaja con Deprisa, Servientrega, Coordinadora, Interrapidísimo, Proships y Envíame |
| Promedio del comercio electrónico colombiano | El envío nacional va de **$8.000 a $35.000** según peso, volumen y destino, y pesa en promedio **12,6 %** del valor del producto ([Mooba](https://mooba.co/blog/logistica-envios-ecommerce-colombia)) |
| Tarifas base 2026 | Coordinadora desde **$15.330**, Servientrega desde **$20.600** sin convenio ([Andrey Business](https://www.andreybusiness.com/blog/servientrega-vs-coordinadora-vs-interrapidisimo-2026)) |

**Nuestro caso:** una bolsa de 250 g pesa unos 300 g con empaque. Es el envío más barato de cualquier tabla, así que estamos en el mejor escenario posible.

## 2. Las cuatro formas de cobrarlo

| Forma | Cómo se ve | Cuándo conviene |
|---|---|---|
| **Cobrarlo aparte** | "Envío $12.000" en el carrito | Honesto y no infla el precio de la bolsa, pero en el último paso aparece un costo y ahí se pierden ventas |
| **Incluirlo en el precio** | "Envío incluido" y la bolsa sube a $76.000 | El cliente no se sorprende, pero el café se ve más caro al lado de la competencia |
| **Umbral de envío gratis** | "Gratis desde $150.000" | **El más usado, y el que recomiendo.** Sube el valor del pedido: quien iba a llevar una bolsa lleva dos |
| **Contraentrega** | Paga al recibir | Da confianza a quien no compra en línea, pero cuesta **3,5 % a 4,5 % del pedido más $2.000 a $3.500 fijos** ([Enviame](https://enviame.io/contra-entrega-colombia/)) |

## 3. Lo que recomiendo

**Cobrar $12.000 y regalar el envío desde $150.000**, que es exactamente lo que ya quedó en la página. Tres razones:

1. Es lo mismo que hace la competencia directa, así que nadie se sorprende.
2. Dos bolsas de 250 g ($136.000) quedan a nada del umbral: el cliente sube a $150.000 solo. Ese es el punto, y por eso el umbral no debe bajar.
3. El costo real de un paquete de 300 g es menor a $12.000 en ciudades principales, así que el envío cobrado casi siempre cubre el despacho.

**Sobre el margen:** cuando el envío es gratis, esos $12.000 salen de la utilidad. En un pedido de $150.000 con 40 % de margen bruto, el envío se come 8 puntos. Hay que meterlo en el cotizador como costo de venta.

## 4. Con quién enviar

No hace falta un convenio para empezar. Tres caminos, de menos a más volumen:

1. **Ir al punto de la transportadora** con la guía pagada. Cero papeleo, tarifa de mostrador. Sirve para los primeros meses.
2. **Un agregador** (Envíame, DrEnvío, Aveonline, Mooba). Se conectan a varias transportadoras, comparan tarifa por destino y generan la guía desde una pantalla. Dan tarifas mejores que el mostrador sin exigir volumen, y algunos incluyen recaudo contraentrega. **Es lo que yo haría al arrancar.**
3. **Convenio directo** con Interrapidísimo, Servientrega o Coordinadora. Vale la pena cuando haya volumen constante; ahí se negocian tarifas corporativas.

**Interrapidísimo** fue la que más envíos individuales movió en Colombia en el primer trimestre de 2026 (12,8 millones) y suele ser la más competitiva en destinos rurales, que importa para Norte de Santander. Por eso quedó como transportadora por defecto en la página.

## 5. Lo que falta definir

- **Cotizar de verdad** el envío de un paquete de 300 g y de 1 kg desde Cúcuta a Bogotá, Medellín, Bucaramanga y Cali. Con esos cuatro números se ajusta el costo real.
- **Decidir sobre contraentrega.** Da confianza al cliente nuevo, pero el recaudo cuesta y el dinero llega días después. Yo la dejaría para una segunda etapa.
- **Empaque de envío**: caja o sobre acolchado, para que la bolsa con válvula no llegue reventada.
- **Escribir la política en la página**: costo, tiempos y qué pasa si el café llega mal. Hoy la información está en el carrito, pero falta la página de condiciones.

## Dónde se cambia

`prototipo/js/core.js`, en `CONFIG.envio`:

```js
envio: { costo: 12000, gratisDesde: 150000, dias: {...}, transportadora: "Interrapidísimo", contraentrega: false }
```

Después: `node tools/build.js`.

## Fuentes
[La Tienda del Café](https://latiendadelcafe.co/pages/faq) · [Mooba: logística para ecommerce en Colombia 2026](https://mooba.co/blog/logistica-envios-ecommerce-colombia) · [Enviame: contraentrega en Colombia](https://enviame.io/contra-entrega-colombia/) · [Comparativa de transportadoras 2026](https://www.andreybusiness.com/blog/servientrega-vs-coordinadora-vs-interrapidisimo-2026) · [Aveonline: envíos nacionales](https://aveonline.co/blog/envios-nacionales-colombia-ecommerce/) · [Tiendanube: empresas de envíos](https://www.tiendanube.com/blog/empresas-de-envios-en-colombia/)

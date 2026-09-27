# Modelo nuevo: comprar café, ponerle marca y venderlo

**Fecha:** 17 de septiembre de 2026
**Cambio:** el proyecto deja de ser un marketplace entre terceros. Nosotros compramos el café, es nuestro, y lo vendemos con nuestra marca.

---

## 1. Qué cambia

| | Antes (marketplace) | Ahora (marca propia) |
|---|---|---|
| Quién vende | El productor | Nosotros |
| De dónde sale la plata | Comisión por conectar | Margen entre lo que pagamos y lo que vendemos |
| Riesgo | Del productor | **Nuestro**: si el café no se vende, la plata está en la bodega |
| Liquidez | Necesitábamos dos lados | Solo necesitamos clientes |
| Qué hay que saber | Software | **Comprar bien**: factor, humedad, precio del día |

Esto simplifica mucho el proyecto: ya no hay que conseguir 20 productores y 20 compradores al tiempo. Pero aparece un riesgo nuevo: **el inventario**. Cada kilo comprado es plata quieta hasta que se venda.

---

## 2. Cómo se forma el precio que nos van a citar en la finca

La FNC publica cada día hábil un **precio interno de referencia** por **carga de 125 kg de café pergamino seco con factor 94**. Sale de tres cosas:

```
Cierre del contrato C en Nueva York  ×  TRM del día  +  diferencial del café colombiano
```

**Referencia del 16 de septiembre de 2026:** $2.005.000 por carga · contrato C ≈ 2,82 USD/lb · TRM ≈ $3.128.
Eso da **$16.040 por kg de pergamino** a factor 94.

### El factor de rendimiento lo es todo

El factor dice cuántos kilos de pergamino se necesitan para sacar **70 kg de café excelso** (el exportable).

| Factor | kg de excelso por carga | $ por kg de pergamino |
|---|---|---|
| 90 | 97,2 | ~$16.750 |
| 94 (base) | 93,1 | $16.040 |
| 98 | 89,3 | ~$15.385 |

Cada punto de factor son unos **$20.000 por carga**. Por eso hay que medirlo, no creerlo.

**Cómo se mide en campo:** se saca una muestra de 250 g de varios puntos del lote, se trilla, se pesa la almendra sana y se aplica:

```
Factor = 17.500 ÷ gramos de almendra sana
```

Ejemplo: 190 g de almendra sana → factor 92,1. Si la muestra da 175 g → factor 100. Mismo peso del bulto, **48 kg menos de café vendible**.

### La humedad

La base de negociación es **12 %**. Si el café viene al 15 %, estamos pagando agua: el peso equivalente se ajusta con `kg × (100 − humedad) ÷ 88`. Por debajo de 10 % el café ya perdió calidad en taza.

---

## 3. Cómo negociar en la finca (orden de los pasos)

1. **Antes de salir:** abrir el **Mercado** en el panel. El precio FNC, la bolsa de Nueva York y la TRM se actualizan solos (función `api/mercado.js`); revisar que la fecha sea la del último día hábil. Si dice "sin conexión con la FNC", escribirlos a mano.
2. **Pesar** y revisar el bulto (que no venga húmedo por debajo ni mezclado).
3. **Medir humedad** con el medidor. Anotar.
4. **Sacar muestra de 250 g** de varios puntos, trillarla y calcular el factor.
5. **Catar** si el lote promete (o llevar muestra para catación).
6. **Abrir el Cotizador**, meter kg, factor y humedad. Ahí salen tres números:
   - lo que le pagaría **el comité** hoy por ese café;
   - **nuestra oferta** sugerida (comité + prima);
   - **nuestro tope**: por encima de eso el negocio no da.
7. **Ofrecer** empezando por la oferta sugerida y explicando por qué es más que el comité.
8. **Registrar la compra** en la plataforma: queda el productor, el factor, el precio y el destino.

### Qué decirle al productor
- "Le pago **de contado** y por encima de lo que le dan en el comité."
- "Si el café cata bien, el nombre de su finca va en la bolsa."
- "Le digo el factor de una vez y le muestro la cuenta." — la transparencia es nuestra mejor herramienta de compra.

### Cuándo NO comprar
- Factor por encima de 96.
- Humedad por encima de 13 % (o descontar el peso y avisarlo).
- Lotes mezclados de varias fincas o varias pasadas de cosecha.
- Cuando el tope del cotizador queda por debajo de lo que pide el productor. Mejor perder la compra que perder la plata.

---

## 4. Ejemplo completo (una carga)

Con los valores por defecto del cotizador:

| Concepto | Valor |
|---|---|
| Compra: 125 kg de pergamino, factor 94, 11 % de humedad | |
| Precio del comité | $16.040/kg → **$2.005.000** |
| Nuestra oferta (+15 %) | $18.446/kg → **$2.305.750** |
| El productor gana de más | **+$300.750** |
| Rinde en verde (trilla) | 93,1 kg |
| Rinde tostado (merma 17 %) | 77,3 kg |
| Bolsas de 340 g | **227** |
| Venta a $32.000 la bolsa | $7.264.000 |
| Trilla, tueste, empaque, fletes e indirectos | −$1.441.646 |
| **Utilidad bruta** | **$3.516.604 (48 %)** |
| Costo por bolsa | $16.508 |

**Ojo:** los costos de trilla, tueste y empaque son supuestos. Hay que reemplazarlos por cotizaciones reales (trilladora, maquila de tueste, empaque con válvula) — ahí se puede ir un buen pedazo del margen. Tampoco están el salario de ustedes, el transporte de venta ni las mermas por café que no se venda.

---

## 5. Qué necesitamos para arrancar

| Cosa | Para qué | Nota |
|---|---|---|
| Báscula y **medidor de humedad** | No comprar agua | Es la inversión que más rápido se paga |
| Trilla de muestras (250 g) | Calcular el factor en finca | Se consigue pequeña |
| Aliado para **trilla** del lote | Pergamino → verde | Cotizar por kg |
| **Maquila de tueste** | Mientras no haya tostadora propia | Cotizar por kg de verde |
| Empaque con válvula y etiqueta | Frescura y marca | Cotizar por bolsa |
| Catación (Q-grader) | Puntaje verificado por lote | Define precio y si va a subasta |

---

## 6. Temas legales por confirmar

- **Registro sanitario o notificación ante el INVIMA** para vender café tostado empacado. Es obligatorio para alimentos procesados; confirmar la categoría exacta y el costo antes de imprimir etiquetas.
- **Etiquetado**: la norma exige contenido neto, lote, fecha, responsable y registro.
- **Facturación y retenciones** al comprarle a campesinos que no facturan: preguntarle al contador cómo se soporta la compra (documento equivalente) y qué retenciones aplican.
- **Datos personales (Ley 1581 de 2012)**: autorización escrita del productor para usar su nombre, su foto y el de la finca en la bolsa y en la web.
- **Comercio de café**: verificar con el Comité Departamental de Cafeteros si comprar para revender exige algún registro como comerciante de café.

---

## 7. Riesgos de este modelo

1. **Inventario parado.** Es el riesgo principal: comprar más de lo que se vende. Comprar contra pedidos al principio.
2. **Pagar de más por presión.** El cotizador existe para eso: el tope no se negocia.
3. **El café se degrada.** El pergamino aguanta, pero la catación baja con los meses. Recatar a los 6 meses.
4. **Precio volátil.** Si compramos caro y la bolsa cae, quedamos con café caro frente a la competencia.
5. **Concentración en un productor.** Si el lote estrella depende de una sola persona, el negocio depende de esa relación.
6. **Trilla y tueste de terceros.** Dependemos de su calidad y sus tiempos; conviene tener dos aliados.

---

## 8. Siguiente paso

1. Cotizar trilla, tueste y empaque reales, y meterlos en el cotizador.
2. Definir precio de venta por presentación y a quién le vamos a vender primero (cafeterías de Cúcuta y Bucaramanga, venta directa, feria).
3. Comprar el primer lote con el cotizador en la mano y comparar lo proyectado con lo real.
4. Con el lote del productor aliado reconocido: catarlo, y decidir si va a bolsa o a subasta.

**Fuentes de precio:** [FNC — precio del día](https://federaciondecafeteros.org/wp-content/uploads/2026/03/precio_cafe.pdf) · [Cómo se conforma el precio](https://federaciondecafeteros.org/aprenda-a-vender-su-cafe/) · [preciocafe.com](https://preciocafe.com/) · [Factor de rendimiento explicado](https://beanflux.co/blog/factor-rendimiento-cafe)

# Análisis del Documento Maestro v0.1 — Qué mejorar

**Fecha:** 14 de septiembre de 2026
**Documento analizado:** `00_documento_maestro_v0.1.md`

---

## Resumen

El documento está bien pensado: pone la validación antes que el código, evita inventar funciones de más y reconoce que el mayor riesgo es la liquidez. Sus problemas son otros:

1. **Casi no toma decisiones.** Repite "no asumir" más de 15 veces, pero no fija fechas, presupuesto, responsables, primer segmento ni criterios para abandonar la idea. Así es fácil investigar sin avanzar.
2. **Le falta el contexto real del café en Colombia**: la Federación (FNC) y su garantía de compra, el café pergamino vs. el verde, el factor de rendimiento, las muestras físicas y la trilla. Estos detalles definen el modelo de negocio.
3. **El orden del experimento está al revés.** Consigue productores primero y compradores después. En un marketplace agrícola lo que escasea son los compradores.
4. **Hay una fecha límite que no aparece:** la cosecha de diciembre, en unas 12 semanas. Es la mejor oportunidad para probar el sistema con un lote real.

A continuación va cada punto con una propuesta concreta.

---

## 1. Mejoras críticas (cambian el modelo)

### 1.1 Primero la demanda, después la oferta

La Sección 41 pide 10–20 productores y 20–50 lotes **antes** de tener compradores. Eso crea el riesgo 1 (liquidez) desde el primer día. Además, invitar a productores sin tener compradores gasta la confianza local, que en Chinácota es difícil de recuperar.

**Propuesta:** invertir las etapas.

| Etapa | Antes (v0.1) | Propuesta |
|---|---|---|
| 1 | 10–20 productores | **10–15 compradores entrevistados + 5 "pedidos de sourcing" concretos** (qué café buscan, cuánto, a qué precio) |
| 2 | 10–20 compradores | 5–10 productores **elegidos para responder a esos pedidos** |
| 3 | Catálogo | Catálogo pequeño (5–15 lotes) enviado a los compradores que ya pidieron algo |

Productores hay muchos. Compradores dispuestos a probar un canal nuevo, pocos.

### 1.2 Elegir un segmento de entrada

Las Secciones 8.2 y 37 mencionan 10 tipos de comprador sin priorizar ninguno. Hay que empezar por uno.

**Recomendación:** **tostadores y cafeterías de especialidad en Colombia** (Bogotá, Medellín, Bucaramanga y Cúcuta).

- Compran microlotes (5–70 kg), justo lo que la plataforma quiere facilitar.
- No hay exportación, divisas ni Incoterms: se quita el 80% de la complejidad.
- Se puede hablar con ellos esta semana, en español, por WhatsApp o en persona.
- Pueden probar muestras rápido.

Los importadores internacionales quedan para después, cuando ya haya historial de lotes, puntajes y transacciones.

### 1.3 Definir en qué estado se vende el café

El documento no dice **en qué estado se vende**, y eso lo cambia todo:

| Estado | Quién lo compra normalmente | Implicación |
|---|---|---|
| Cereza | Beneficiaderos, vecinos | No aplica a especialidad |
| **Pergamino seco** | FNC/cooperativas, compraventas, algunos exportadores | Lo que el productor tiene en la mano |
| **Verde (excelso)** | Tostadores, importadores | Lo que el comprador de especialidad quiere. **Necesita trilla** |
| Tostado | Consumidor final, cafeterías pequeñas | Es otro negocio (marca), no un marketplace |

**Pregunta que el MVP debe responder:** ¿quién trilla y dónde? Si el productor vende pergamino y el tostador quiere verde, alguien tiene que resolver esa diferencia. **Ese servicio podría ser el negocio**, más que la comisión.

Campos que faltan en la ficha del lote (Sección 11):
- `estado_cafe` (pergamino seco / verde / tostado)
- `factor_rendimiento` (kg de pergamino seco para obtener 70 kg de excelso; es la medida de calidad física que se usa en Colombia)
- `merma_estimada`
- `fecha_catacion` y `catador` (quién y cuándo)
- `precio_referencia` (precio FNC del día o diferencial sobre bolsa) para dar contexto al precio

### 1.4 Las muestras son la base de la confianza

Las Secciones 13 y 31 construyen la confianza con documentos y verificaciones. En café de especialidad **nadie compra sin catar una muestra**. Ese es el mecanismo real de confianza, y el documento no lo menciona.

**Propuesta:** poner el **flujo de muestras** en el centro del MVP:

```text
Comprador ve lote → Solicita muestra (100–300 g verde) → Envío → Catación del comprador
→ Retroalimentación (puntaje/notas) → Oferta → Acuerdo
```

Esto también arregla el KPI de la Sección 24. "Intención comercial real" hoy es ambiguo. Se puede definir así:

> **Intención comercial real = solicitud de muestra o oferta con cantidad y precio.**

El KPI principal pasa a ser: **% de lotes publicados que reciben ≥1 solicitud de muestra en 30 días**. Después: **% de muestras enviadas que terminan en compra**.

Además, las catas que hacen los compradores generan datos de calidad **independientes del productor**, que sirven como verificación gratis.

### 1.5 La alternativa real es la FNC, no "los intermediarios"

La Sección 5.1 habla de "dependencia de intermediarios", pero en Colombia la comparación más fuerte es la **garantía de compra de la FNC** (vía cooperativas y puntos de compra): el productor vende siempre, a un precio de referencia público y con pago rápido.

Consecuencias para el diseño:
- La plataforma solo tiene sentido para cafés que puedan ganar **un sobreprecio claro sobre el precio FNC**. Hay que medir ese diferencial en cada lote.
- El productor asume un riesgo si guarda su café esperando un comprador que no llega. **Tiempo hasta la venta** y **tiempo hasta el pago** deben ser métricas principales.
- Hay que investigar la **cédula cafetera / SICA** (sistema de información cafetera de la FNC). Si guarda variedad, área y ubicación de la finca, sirve para verificar datos sin construir un sistema propio. *(Confirmar con el Comité Departamental de Cafeteros de Norte de Santander qué datos entrega y con qué permiso del productor.)*

### 1.6 El desintermediación no tiene plan

El Riesgo 3 está identificado pero no mitigado. Un comprador que conoce al productor por la plataforma puede comprarle directo la próxima cosecha.

Un marketplace que solo cobra comisión y conecta partes es muy vulnerable. Formas de retener a los usuarios, de más débil a más fuerte:

1. Comodidad: catálogo, filtros, comparación (débil; se copia fácil)
2. **Gestión de muestras** (logística y seguimiento de catación)
3. **Garantía de calidad**: si el café no coincide con la muestra, la plataforma responde
4. **Consolidación**: trilla, empaque y envío de varios microlotes juntos
5. **Pago garantizado** al productor (el mayor valor frente a la FNC)
6. **Modelo de trader**: la plataforma compra y revende (margen en vez de comisión)

**Recomendación:** empezar como **broker o trader "concierge"**, operando a mano y cobrando un margen por lote. Así se gana más por kg que con una comisión, se controla la calidad, se aprende el proceso completo y el problema de desintermediación se retrasa. Solo se automatiza lo que se repita (ya lo dice la Sección 41, Etapa 5).

### 1.7 Números del negocio (faltan)

La Sección 22 lista modelos de ingreso sin cifras. Un cálculo **ilustrativo** (supuestos a validar):

| Supuesto | Valor |
|---|---|
| Lotes vendidos/año (piloto) | 20 |
| kg verde por lote | 150 |
| Precio promedio especialidad | COP 60.000/kg |
| **GMV anual** | **COP 180.000.000** |
| Comisión 8% | COP 14.400.000/año |
| Margen trader 25% | COP 45.000.000/año |

**Lectura:** a escala piloto, una comisión no paga ni el tiempo de una persona. Esto no descarta la idea, pero sí indica que:
- el piloto debe verse como **aprendizaje**, no como negocio;
- hay que decidir pronto si el modelo es comisión (necesita mucho volumen) o trader/servicios (necesita capital de trabajo);
- falta calcular **cuántos lotes/año hacen falta para cubrir costos**. Esa es la cifra que responde la Sección 9.

---

## 2. Mejoras importantes (estructura y rigor)

### 2.1 Hipótesis con umbrales

La Sección 40 pide hipótesis falsables, pero sin un umbral no hay forma de refutarlas. Propuesta:

| # | Hipótesis | Se considera **FALSA** si… |
|---|---|---|
| H1 | Productores quieren compradores especializados | <50% de 10 productores de especialidad aceptan publicar un lote con precio |
| H2 | Compradores tienen dificultad para descubrir cafés | <5 de 12 compradores ponen "encontrar proveedores/lotes" entre sus 3 problemas principales |
| H3 | Información estructurada aumenta intención | La tasa de solicitud de muestra no mejora con ficha completa vs. ficha básica (prueba A/B manual) |
| H4 | Verificación aumenta confianza | Los compradores no dan prioridad a lotes con catación independiente frente a lotes solo declarados |
| H5 | Disposición a comprar vía plataforma | <3 compras reales en los primeros 90 días con catálogo activo |
| H6 | Disposición a pagar comisión/margen | Ningún comprador acepta un precio que incluya ≥8% sobre el precio pactado con el productor |
| H7 | Microlotes se benefician de mecanismos distintos a precio fijo | <30% de compradores harían oferta o puja en un lote de alta puntuación |
| H8 | Liquidez sostenible | Los lotes necesarios para cubrir costos son >5× los alcanzables en 12 meses |

Hay que agregar un **criterio para detenerse**: si H2 y H5 resultan falsas, el proyecto se replantea (por ejemplo, como servicio de catación/verificación o como marca propia).

### 2.2 El MVP aparece definido tres veces

- Sección 26: registro, perfiles, administración, verificación (esto es una plataforma)
- Sección 41: "catálogo funcional simple"
- Sección 43, Fase 2: otra lista más

**Propuesta:** tres niveles explícitos:

| Nivel | Qué es | Herramientas | Cuándo |
|---|---|---|---|
| **MVP-0 Concierge** | Catálogo en una página + hoja de cálculo + WhatsApp. **Sin registro.** | HTML estático / Google Sheets / WhatsApp Business | Semanas 1–12 |
| **MVP-1 Catálogo** | Catálogo con base de datos, panel admin, registro de solicitudes de muestra | No-code (Airtable/Softr) o web simple | Tras ≥10 solicitudes de muestra reales |
| **MVP-2 Plataforma** | Cuentas de productor y comprador, ofertas, estados | Desarrollo propio | Tras ≥5 transacciones completadas a mano |

**Pedir registro al comprador en MVP-0 reduce conversiones.** Mejor pedir el contacto solo al solicitar una muestra.

### 2.3 Verificación con fuente y fecha, no solo niveles

Los cuatro niveles de la Sección 13 se superponen ("documentado" y "certificado" se parecen) y no tienen fecha. Un puntaje de catación **caduca**: el café verde pierde calidad en meses.

**Propuesta:** cada atributo guarda `valor + nivel + fuente + fecha + evidencia`:

```text
Puntaje: 86.5
  nivel:     VERIFICADO
  fuente:    Catador Q (nombre, licencia)
  fecha:     2027-01-20
  evidencia: formato de catación SCA (PDF)
  vigencia:  6 meses
```

Así el comprador sabe exactamente qué tan confiable y reciente es cada dato.

### 2.4 Modelo de datos: faltan entidades clave

Al esquema de la Sección 29 le faltan las entidades del flujo real:

```text
FARMS (con código SICA si existe)
 └── HARVESTS (cosecha principal / traviesa, año)
      └── LOTS
           ├── attributes (valor + nivel + fuente + fecha)   ← reemplaza "verification" genérico
           ├── samples            ← NUEVO: solicitudes, envíos, retroalimentación de catación
           ├── inquiries/offers   ← NUEVO: el evento principal del MVP
           ├── sub_lots           ← NUEVO: ventas parciales dividen el lote
           └── price_context      ← NUEVO: precio referencia FNC del día
```

- El lote pertenece a la **finca y la cosecha**, no solo al productor.
- **AUCTIONS** puede salir del modelo inicial: es Fase 4 y agrega complejidad sin validar.

### 2.5 Estados del lote

Al flujo de la Sección 30 le faltan los estados donde realmente pasan las cosas:

```text
BORRADOR → EN REVISIÓN → PUBLICADO → MUESTRA SOLICITADA → EN NEGOCIACIÓN
→ RESERVADO → VENDIDO (total|parcial) → ENTREGADO → CERRADO
```

Además: `PAUSADO`, `RECHAZADO`, `EXPIRADO` (por vigencia de catación), `CANCELADO`. Una venta parcial deja un sub-lote `PUBLICADO` con la cantidad restante.

### 2.6 Conflicto de interés de la familia fundadora

La familia será **productora y dueña de la plataforma a la vez**. Compradores y otros productores lo notarán:
- ¿Los lotes de la familia salen primero en el catálogo?
- ¿La familia ve los precios de los competidores?

**Propuesta:** escribir desde ahora una **política de neutralidad** (orden del catálogo por reglas públicas, marcar "lote de la finca fundadora", no usar datos de otros productores para fijar precios propios). Es barato y genera confianza.

### 2.7 Canal y contexto rural

La mayoría de productores de Norte de Santander usa **WhatsApp**, no formularios web, y la conexión en finca es irregular. El MVP debe asumir **captura asistida**: alguien visita la finca o hace una llamada, toma fotos y llena la ficha. Esa visita **es también verificación** (fotos geolocalizadas, altitud con GPS).

### 2.8 Temas legales y tributarios de Colombia

Faltan puntos concretos en el Riesgo 8. Validar con un contador o abogado:
- **Protección de datos personales** (Ley 1581 de 2012): autorización del productor para publicar su información.
- **Facturación electrónica (DIAN)**: quién factura cuando la plataforma intermedia o compra, y cómo se documenta la compra a productores que no facturan.
- **Contribución cafetera y requisitos de exportación** (registro de exportador, control de calidad de Almacafé): solo para la Fase 6, pero conviene conocer el costo desde ya.
- **Registro sanitario (INVIMA)**: aplica al café tostado para consumo, no al verde. Es otra razón para no vender tostado.

### 2.9 Sin plan de tiempo, presupuesto ni responsables

Faltan cronograma, presupuesto, responsables y un registro de decisiones. Ver la Sección 4 de este análisis.

---

## 3. Mejoras menores (coherencia del documento)

- **Sección 41, Etapa 4** mide "visitas", que la Sección 23 dice que no es una métrica importante. Cambiar por solicitudes de muestra y ofertas.
- **Sección 12 (Pasaporte)** y **Sección 13 (Verificación)** describen lo mismo desde dos ángulos. Se pueden unir: el pasaporte es la vista pública de los atributos verificados.
- **Sección 17 (Precios)**: falta la opción real más común en especialidad, **precio indicativo + negociación después de la muestra**.
- **Sección 33 (Competencia)**: agregar nombres para investigar: *Algrano* (marketplace de café verde directo), *Cropster Hub* (sourcing), *M-Cultivo* (subastas online), *Alliance for Coffee Excellence / Cup of Excellence* y *Best of Panama* (subastas de alta puntuación, Geisha), plataformas de trazabilidad como *iFinca* o *Farmer Connect*, y los canales locales: FNC, cooperativas, exportadores privados de especialidad y la venta directa por Instagram/WhatsApp. *(Verificar el estado actual de cada una.)*
- **Sección 35**: la Fase 1 (Chinácota) y la Fase 2 (Norte de Santander) casi no se diferencian. La expansión debería medirse por **segmento de comprador** más que por geografía de productores.
- Agregar al documento un **registro de decisiones** (fecha, decisión, razón, quién) y un **responsable** por sección.

---

## 4. La cosecha de diciembre como primer experimento

Hoy es 14/09/2026 y la cosecha esperada es en **diciembre**. Faltan unas **12 semanas**. El lote Geisha de la familia sirve para probar el ciclo completo antes de sumar a otros.

### Producción estimada (validar con agrónomo local)

| Supuesto | Rango |
|---|---|
| Plantas productivas | 1.000–1.500 |
| Cereza por planta (primera cosecha, plantas jóvenes) | 0,3–1 kg |
| Cereza total | 300–1.500 kg |
| Relación cereza → pergamino seco | ~5 : 1 |
| **Pergamino seco** | **~60–300 kg** |
| Pergamino → verde (~80%) | **~50–240 kg verde** |

Es un **microlote**, justo el caso que la plataforma quiere resolver. Si la Geisha cata alto (86+), el sobreprecio sobre la FNC puede ser grande. Pero **sin catación nada de eso se puede demostrar.**

### Plan de 12 semanas

| Semanas | Objetivo | Entregable | Umbral para seguir |
|---|---|---|---|
| **1–2** (15–28 sep) | Entrevistar compradores | 12 entrevistas con tostadores/cafeterías (guía en `validacion/`) | ≥5 muestran dolor real de sourcing |
| **3–4** (29 sep–12 oct) | Pedidos de sourcing | 5 compradores dicen qué, cuánto y a qué precio buscarían | ≥3 pedidos concretos |
| **3–6** | Entrevistar productores | 10 entrevistas; identificar 5 con lotes que respondan a los pedidos | ≥5 dispuestos a publicar con precio |
| **5–6** | Mapa de la alternativa FNC | Precio FNC vs. precio especialidad por lote; costos de trilla y envío de muestras | Diferencial > costos de la operación |
| **7–8** | Catálogo MVP-0 | 5–10 lotes reales en `prototipo/catalogo.html`, enviado **solo** a compradores con pedido | — |
| **9–10** | Muestras | Envío de muestras, registro en `validacion/registro_experimento.csv` | ≥5 solicitudes de muestra |
| **11–12** (dic) | Cosecha familiar | Beneficio documentado paso a paso (fotos, fechas, fermentación, secado) + catación por catador independiente | Lote listo para ofrecer con pasaporte completo |
| **Ene 2027** | Primera venta | Primer lote vendido de principio a fin (a mano) | ≥1 transacción cerrada |

### Presupuesto mínimo del piloto (estimar en COP)
- Catación independiente (Q-grader) por lote
- Envíos de muestras (servientrega/interrapidísimo)
- Trilla de muestras
- Viajes a fincas y a ciudades de compradores
- Dominio y hosting (casi $0 con página estática)

---

## 5. Qué se creó en este proyecto

```text
MarketPlace_Cafe/
├── README.md
├── docs/
│   ├── 00_documento_maestro_v0.1.md      (original)
│   ├── 01_analisis_y_mejoras.md          (este documento)
│   └── 02_competencia.md                 (competidores, huecos, qué copiar)
├── validacion/
│   ├── guia_entrevista_compradores.md
│   ├── guia_entrevista_productores.md
│   ├── plantilla_lotes.csv               (ficha de lote con verificación por atributo)
│   └── registro_experimento.csv          (seguimiento de solicitudes, muestras, ofertas)
└── prototipo/                            (demo interactiva: comprador, productor y subasta en vivo)
    ├── index.html · styles.css · auction.css
    └── js/ core.js · buyer.js · producer.js · auction.js · main.js
```

## 6. Decisiones que se deben tomar ya

1. ¿Primer segmento de comprador = tostadores/cafeterías de especialidad en Colombia? (recomendado: **sí**)
2. ¿Modelo inicial = broker/trader concierge en vez de marketplace con comisión? (recomendado: **sí, para el piloto**)
3. ¿Estado de venta = café verde, con la plataforma coordinando la trilla? (recomendado: **validar en entrevistas semanas 1–4**)
4. ¿Quién es responsable de las entrevistas, quién de la cosecha y quién del catálogo?
5. ¿Presupuesto máximo del piloto hasta enero de 2027?

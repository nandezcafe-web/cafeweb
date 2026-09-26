# PROYECTO — MARKETPLACE ESPECIALIZADO EN CAFÉ

**Documento maestro de definición empresarial y tecnológica**

**Versión:** 0.1  
**Estado:** Descubrimiento / Validación  
**País inicial:** Colombia  
**Origen del proyecto:** Chinácota, Norte de Santander

---

# 1. Propósito del documento

Este documento establece la base conceptual, empresarial y tecnológica para desarrollar un proyecto independiente orientado a la comercialización digital de café.

El proyecto busca investigar y eventualmente desarrollar una plataforma que conecte productores de café con compradores, permitiendo descubrir, comparar, negociar y eventualmente adquirir lotes de café mediante información estructurada, trazabilidad y mecanismos de confianza.

Este documento **no asume todavía** que la solución final será:

- una aplicación móvil;
- una aplicación web;
- un marketplace tradicional;
- una plataforma B2B;
- un sistema de subastas;
- un sistema de pagos propio;
- una infraestructura de exportación.

La arquitectura tecnológica deberá definirse después de validar el problema, los usuarios, el modelo de negocio y el comportamiento real del mercado.

---

# 2. Separación del proyecto

Este proyecto es independiente del proyecto familiar relacionado con:

- tecnificación del cultivo;
- monitoreo agrícola;
- aprovechamiento de residuos;
- transformación de subproductos;
- desarrollo industrial alrededor de los residuos del café.

No se deben mezclar objetivos, funcionalidades, bases de datos, modelos de negocio ni arquitecturas tecnológicas entre ambos proyectos.

Podrán existir conexiones futuras si generan valor, pero deben tratarse como integraciones independientes.

---

# 3. Contexto de origen

La familia fundadora participa actualmente en el cultivo de café en Chinácota, Norte de Santander, Colombia.

Actualmente existe principalmente capacidad productiva y tierra, con aproximadamente:

- 3.000 plantas sembradas;
- predominancia de variedad Geisha;
- aproximadamente 1.000–1.500 plantas con expectativa de producir frutos en diciembre.

La familia inicialmente contempló desarrollar una marca propia de café orientada a mercados internacionales.

Sin embargo, las limitaciones actuales de capital, infraestructura y maquinaria para controlar integralmente la cadena de beneficio, transformación, comercialización y exportación llevaron a explorar una oportunidad diferente:

> desarrollar una infraestructura digital para conectar productores y compradores de café.

La finca familiar constituye el origen y laboratorio inicial del proyecto, pero **no debe limitar la futura plataforma a los cafés de la familia**.

---

# 4. Hipótesis principal

Existe una oportunidad para mejorar la comercialización del café mediante una plataforma especializada que permita:

1. estructurar la información de cada lote;
2. mejorar el descubrimiento de cafés;
3. facilitar la comparación entre lotes;
4. aumentar la transparencia;
5. generar confianza;
6. conectar productores con compradores especializados;
7. facilitar posteriormente las transacciones;
8. construir trazabilidad comercial.

---

# 5. Problema que debemos validar

No debemos asumir que el problema es simplemente:

> "Los productores no tienen dónde vender café."

El problema debe investigarse desde ambos lados del mercado.

## 5.1 Problemas potenciales del productor

Investigar si los productores enfrentan:

- dificultad para encontrar compradores;
- dependencia de intermediarios;
- dificultad para presentar cafés especiales;
- poca visibilidad;
- dificultad para demostrar calidad;
- dificultad para comercializar microlotes;
- falta de información sobre precios;
- dificultad para llegar a compradores internacionales;
- poca capacidad de negociación;
- falta de herramientas digitales;
- dificultad para diferenciar su café.

## 5.2 Problemas potenciales del comprador

Investigar si los compradores enfrentan:

- dificultad para descubrir nuevos productores;
- información inconsistente;
- dificultad para comparar lotes;
- falta de trazabilidad;
- dificultad para verificar la información;
- dificultad para encontrar microlotes;
- dificultad para contactar productores;
- procesos lentos de negociación;
- falta de transparencia;
- dificultad para comprar pequeñas cantidades;
- dificultad para identificar cafés según características específicas.

---

# 6. Pregunta central del proyecto

> **¿Qué problema suficientemente importante de la comercialización del café puede resolver una plataforma digital mejor que los mecanismos existentes?**

Esta pregunta debe resolverse antes de invertir significativamente en desarrollo tecnológico.

---

# 7. Hipótesis de propuesta de valor

La plataforma podría convertirse en una infraestructura que permita:

> **Descubrir, comparar y comercializar lotes de café mediante información estructurada, verificable y trazable.**

La propuesta no debe limitarse a:

> "Comprar café en línea."

Debe investigar si existe valor suficiente en:

> **hacer más transparente, comparable y confiable la oferta de café.**

---

# 8. Usuarios del sistema

## 8.1 Productor

Persona, finca, asociación o empresa que produce café y desea comercializar uno o varios lotes.

## 8.2 Comprador

Debe dividirse posteriormente en segmentos.

Posibles segmentos:

- tostadores;
- cafeterías;
- tiendas especializadas;
- distribuidores;
- compradores institucionales;
- exportadores;
- importadores;
- marcas de café;
- compradores particulares;
- compradores internacionales.

No se debe asumir que todos tendrán las mismas necesidades.

---

# 9. Marketplace de dos lados

La plataforma tendrá potencialmente dos mercados principales:

```text
PRODUCTORES
      ↓
   OFERTA
      ↓
PLATAFORMA
      ↑
   DEMANDA
      ↑
COMPRADORES
```

El principal riesgo estratégico es el problema de liquidez del marketplace.

Debe validarse:

- cuántos productores necesitamos;
- cuántos lotes necesitamos;
- cuántos compradores necesitamos;
- qué frecuencia de compra existe;
- cuál es el valor promedio de una transacción;
- cuánto cuesta adquirir cada lado del mercado.

---

# 10. Concepto de lote

El lote será la unidad comercial fundamental de la plataforma.

Un productor puede tener:

```text
FINCA
 ├── Lote A
 ├── Lote B
 ├── Lote C
 └── Lote D
```

Cada lote debe tener identidad propia.

---

# 11. Información mínima del lote

La estructura deberá investigarse y validarse, pero inicialmente puede contemplar:

### Identificación

- ID del lote;
- productor;
- finca;
- ubicación;
- región;
- país.

### Producción

- variedad;
- altitud;
- área;
- cantidad;
- cosecha;
- fecha de recolección.

### Beneficio

- proceso;
- fermentación;
- secado;
- almacenamiento.

### Calidad

- puntaje;
- perfil sensorial;
- humedad;
- actividad de agua;
- densidad;
- defectos;
- análisis disponibles.

### Comercial

- cantidad disponible;
- unidad de venta;
- precio;
- moneda;
- precio por kg;
- precio por lote;
- cantidad mínima.

### Evidencia

- fotografías;
- documentos;
- análisis;
- certificados;
- información de catación.

---

# 12. Pasaporte del lote

Una posible funcionalidad diferencial será desarrollar un sistema de identidad digital para cada lote.

Concepto:

> **Cada lote tiene una historia comercial verificable.**

El pasaporte podría incluir:

```text
IDENTIDAD
↓
PRODUCTOR
↓
FINCA
↓
UBICACIÓN
↓
VARIEDAD
↓
COSECHA
↓
BENEFICIO
↓
CALIDAD
↓
CANTIDAD
↓
DOCUMENTACIÓN
↓
COMERCIALIZACIÓN
↓
TRANSACCIÓN
```

La implementación de blockchain **no debe asumirse**.

Primero debe demostrarse qué información necesita realmente trazabilidad y qué tecnología resulta adecuada.

---

# 13. Sistema de verificación

La plataforma deberá diferenciar claramente entre:

### Declarado

Información ingresada por el productor.

### Documentado

Información respaldada mediante documentos.

### Verificado

Información revisada por la plataforma o un tercero.

### Certificado

Información respaldada por una entidad competente.

Ejemplo:

```text
Variedad
DECLARADA

Altitud
VERIFICADA

Puntaje
DOCUMENTADO

Certificación
CERTIFICADA
```

Esto será parte fundamental del sistema de confianza.

---

# 14. Perfil del productor

Cada productor podrá tener una página/perfil con:

- nombre;
- finca;
- región;
- historia;
- ubicación;
- fotografías;
- variedades;
- prácticas de producción;
- procesos;
- certificaciones;
- lotes disponibles;
- historial comercial;
- nivel de verificación.

El perfil no debe convertirse en una red social.

Debe estar orientado a la confianza y comercialización.

---

# 15. Descubrimiento de café

El comprador deberá poder explorar los lotes.

Posibles filtros:

- país;
- departamento;
- municipio;
- altitud;
- variedad;
- proceso;
- puntaje;
- perfil sensorial;
- cosecha;
- cantidad;
- precio;
- certificación;
- disponibilidad;
- productor;
- tipo de lote.

Los filtros definitivos deben surgir de entrevistas con compradores.

---

# 16. Comparación

Una posible funcionalidad de alto valor:

> **Comparar cafés.**

Ejemplo:

| Característica | Café A | Café B | Café C |
|---|---|---|---|
| Variedad | Geisha | Caturra | Bourbon |
| Altitud | X | X | X |
| Proceso | Natural | Lavado | Honey |
| Puntaje | X | X | X |
| Cantidad | X | X | X |
| Precio | X | X | X |

Esta funcionalidad puede ser más importante para el comprador que una interfaz visual sofisticada.

---

# 17. Modelo de precios

No asumir un único modelo.

Investigar tres mecanismos:

## Precio fijo

```text
Lote
↓
Precio definido
↓
Compra
```

## Negociación

```text
Lote
↓
Oferta del comprador
↓
Negociación
↓
Acuerdo
```

## Subasta

```text
Lote
↓
Precio inicial
↓
Pujas
↓
Cierre
↓
Ganador
```

Los tres pueden coexistir posteriormente.

---

# 18. Subastas

La subasta debe considerarse inicialmente una funcionalidad experimental.

Podría utilizarse para:

- microlotes;
- Geisha;
- cafés de alta puntuación;
- lotes únicos;
- cantidades limitadas;
- cafés experimentales.

Antes de desarrollarla se debe validar:

- si los compradores realmente quieren pujar;
- qué frecuencia tendría;
- cuál sería el precio de entrada;
- si existirían pujas suficientes;
- cómo se manejaría el incumplimiento;
- cuándo se considera una subasta válida.

---

# 19. Transacción

La plataforma podría evolucionar hacia:

```text
DESCUBRIMIENTO
↓
INTERÉS
↓
NEGOCIACIÓN
↓
ORDEN
↓
PAGO
↓
LOGÍSTICA
↓
ENTREGA
↓
CIERRE
```

Sin embargo, el MVP no necesariamente debe implementar todo este flujo.

---

# 20. Pagos

Los pagos deben investigarse antes de construir una solución propia.

Preguntas:

- ¿Quién cobra?
- ¿Quién paga?
- ¿La plataforma recibe el dinero?
- ¿Se utiliza un tercero?
- ¿Cuándo recibe el productor?
- ¿Qué ocurre ante cancelaciones?
- ¿Qué ocurre ante incumplimientos?
- ¿Se requiere escrow?
- ¿Qué impuestos aplican?
- ¿Cómo funcionan las transacciones internacionales?

No construir infraestructura financiera propia en el MVP.

---

# 21. Logística

Inicialmente la plataforma puede limitarse a indicar:

> "El comprador y productor deben coordinar la entrega."

Posteriormente podría evolucionar hacia:

```text
VENTA
↓
RECOLECCIÓN
↓
TRANSPORTE
↓
ENTREGA
↓
CONFIRMACIÓN
```

Debe investigarse si la plataforma realmente necesita controlar la logística o simplemente integrarse con operadores existentes.

---

# 22. Modelo de negocio

No asumir una única fuente de ingresos.

Investigar:

### Comisión por transacción

La plataforma recibe un porcentaje.

### Comisión al productor

El comprador no paga comisión.

### Comisión al comprador

El productor recibe el precio completo.

### Comisión compartida

Ambas partes pagan.

### Suscripción

Productores profesionales pagan por funcionalidades adicionales.

### Servicios premium

Posibles servicios:

- verificación;
- análisis;
- fotografía;
- catación;
- posicionamiento;
- comercialización;
- herramientas B2B.

### Servicios para compradores

- búsqueda especializada;
- sourcing;
- inteligencia de mercado;
- compras recurrentes.

---

# 23. Métrica fundamental

No medir solamente:

- usuarios registrados;
- productores registrados;
- visitas;
- lotes publicados.

Las métricas importantes serán:

### Oferta

- productores activos;
- lotes activos;
- kg disponibles.

### Demanda

- compradores activos;
- búsquedas;
- solicitudes;
- ofertas.

### Liquidez

- lotes que reciben interés;
- lotes vendidos;
- tiempo promedio hasta venta.

### Economía

- GMV;
- valor promedio de transacción;
- comisión;
- margen;
- costo de adquisición.

### Confianza

- porcentaje de lotes verificados;
- disputas;
- cancelaciones;
- incumplimientos.

---

# 24. KPI principal inicial

Una métrica especialmente importante:

> **Porcentaje de lotes publicados que generan una transacción o intención comercial real.**

Porque demostraría que la plataforma está conectando oferta con demanda.

---

# 25. MVP

El MVP inicial deberá concentrarse en demostrar tres cosas:

### 1. Productores

¿Publican sus lotes?

### 2. Compradores

¿Encuentran cafés que realmente quieren?

### 3. Mercado

¿Se generan transacciones?

---

# 26. MVP recomendado

## Productor

- registro;
- perfil;
- creación de finca;
- creación de lote;
- fotografías;
- información técnica;
- disponibilidad;
- precio;
- estado del lote.

## Comprador

- registro;
- catálogo;
- filtros;
- búsqueda;
- ficha del lote;
- favoritos;
- solicitud de información;
- contacto/interés.

## Administración

- usuarios;
- productores;
- lotes;
- verificación;
- moderación;
- estados;
- métricas.

---

# 27. Funcionalidades que NO deberían estar en el primer MVP

No construir inicialmente:

- app iOS;
- app Android;
- blockchain;
- sistema avanzado de subastas;
- billetera propia;
- sistema financiero propio;
- logística propia;
- inteligencia artificial compleja;
- marketplace internacional completo;
- traducción automática avanzada;
- reputación sofisticada;
- sistema de recomendación complejo.

Estas funcionalidades pueden aparecer posteriormente si los datos demuestran que son necesarias.

---

# 28. Arquitectura conceptual

```text
                    PLATAFORMA
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    PRODUCTORES      LOTES          COMPRADORES
        │               │               │
        │          INFORMACIÓN          │
        │          VERIFICACIÓN         │
        │          TRAZABILIDAD         │
        │               │               │
        └───────────────┼───────────────┘
                        │
                  TRANSACCIONES
                        │
                ┌───────┴───────┐
                │               │
             PAGOS          LOGÍSTICA
```

---

# 29. Entidades principales de datos

La base de datos deberá partir conceptualmente de:

```text
USERS
├── producers
├── buyers
└── administrators

PRODUCERS
├── farms
├── certifications
└── verification

LOTS
├── characteristics
├── quality
├── inventory
├── pricing
├── media
├── documents
└── verification

TRANSACTIONS
├── orders
├── payments
├── delivery
└── status

AUCTIONS
├── lots
├── bids
├── participants
└── results
```

Esta estructura es conceptual y deberá refinarse después de validar los procesos.

---

# 30. Estados del lote

Un lote debe tener estados claramente definidos:

```text
BORRADOR
↓
EN REVISIÓN
↓
PUBLICADO
↓
RESERVADO
↓
VENDIDO
↓
CERRADO
```

También pueden existir:

```text
PAUSADO
RECHAZADO
EXPIRADO
CANCELADO
```

---

# 31. Confianza

La plataforma debe diseñarse alrededor de una pregunta:

> **¿Por qué debería confiar un comprador en la información que aparece aquí?**

La respuesta debe construirse mediante capas:

```text
IDENTIDAD
+
DOCUMENTACIÓN
+
VERIFICACIÓN
+
EVIDENCIA
+
HISTORIAL
+
REPUTACIÓN
```

---

# 32. Reputación

No implementar inmediatamente un sistema de estrellas tradicional.

Primero investigar qué comportamiento debería representar la reputación.

Posibles variables:

- cumplimiento;
- calidad;
- exactitud de información;
- tiempos;
- comunicación;
- transacciones completadas;
- disputas;
- recurrencia de compradores.

La reputación debe medir **confiabilidad comercial**, no popularidad.

---

# 33. Investigación competitiva

Se debe investigar al menos cinco categorías:

### A. Marketplaces de café

Plataformas que conectan productores y compradores.

### B. Plataformas de café especial

Especializadas en specialty coffee.

### C. Plataformas de subastas

Sistemas utilizados para cafés de alta calidad.

### D. Plataformas B2B agrícolas

Marketplaces de productos agrícolas.

### E. Sistemas de trazabilidad

Empresas que trabajan con trazabilidad agrícola o alimentaria.

Para cada competidor:

- qué problema resuelve;
- quién paga;
- cómo monetiza;
- qué usuarios tiene;
- cómo verifica;
- qué información exige;
- cómo transacciona;
- cómo maneja logística;
- qué funciona;
- qué falla;
- qué podemos hacer diferente.

---

# 34. Diferenciación

No asumir todavía el diferencial.

Debe descubrirse mediante investigación.

Hipótesis de diferenciación:

### 1. Información estructurada

Todos los lotes tienen información comparable.

### 2. Verificación

No toda la información tiene el mismo nivel de confianza.

### 3. Trazabilidad

Cada lote tiene una historia verificable.

### 4. Especialización

La plataforma está diseñada específicamente para café.

### 5. Descubrimiento

El comprador puede encontrar cafés según necesidades concretas.

### 6. Comercialización de microlotes

Puede existir una infraestructura especialmente adaptada a cafés pequeños y especiales.

---

# 35. Estrategia inicial de entrada

No comenzar intentando cubrir toda Colombia.

Propuesta:

```text
FASE 1
Chinácota / Norte de Santander
        ↓
FASE 2
Norte de Santander
        ↓
FASE 3
Colombia
        ↓
FASE 4
Latinoamérica
        ↓
FASE 5
Mercado internacional
```

Pero la expansión debe depender de la liquidez y demanda.

---

# 36. Chinácota como laboratorio

La finca familiar puede utilizarse como:

> **primer caso real del sistema.**

No como el único productor.

Esto permitiría probar:

- creación de finca;
- creación de lote;
- documentación;
- fotografías;
- información de calidad;
- publicación;
- búsqueda;
- interés;
- venta;
- trazabilidad.

Una vez probado, se incorporan productores externos.

---

# 37. Validación antes del desarrollo

Antes de desarrollar software completo se deben realizar entrevistas con:

## Productores

Mínimo recomendado:

- pequeños productores;
- productores de café especial;
- productores de microlotes;
- asociaciones;
- productores con experiencia exportadora.

## Compradores

Buscar:

- tostadores;
- cafeterías especializadas;
- compradores de specialty;
- exportadores;
- importadores.

---

# 38. Preguntas críticas para productores

Investigar:

1. ¿Cómo venden actualmente?
2. ¿A quién venden?
3. ¿Cómo encuentran compradores?
4. ¿Qué información les piden?
5. ¿Qué información les cuesta demostrar?
6. ¿Qué problemas tienen vendiendo microlotes?
7. ¿Aceptarían publicar sus lotes?
8. ¿Qué información estarían dispuestos a publicar?
9. ¿Qué información consideran privada?
10. ¿Pagarían comisión?
11. ¿Aceptarían que el comprador haga ofertas?
12. ¿Participarían en subastas?
13. ¿Qué necesitarían para confiar en la plataforma?

---

# 39. Preguntas críticas para compradores

Investigar:

1. ¿Cómo encuentran actualmente cafés?
2. ¿Cómo comparan proveedores?
3. ¿Qué información necesitan antes de comprar?
4. ¿Qué información no confían?
5. ¿Cómo verifican la calidad?
6. ¿Compran directamente al productor?
7. ¿Qué cantidades compran?
8. ¿Qué frecuencia tienen?
9. ¿Comprarían lotes pequeños?
10. ¿Harían ofertas?
11. ¿Participarían en subastas?
12. ¿Pagarían directamente a través de la plataforma?
13. ¿Qué les impediría comprar?

---

# 40. Hipótesis que deben ser falsables

El proyecto no debe buscar únicamente confirmar la idea.

Debe intentar demostrar que estas hipótesis pueden ser falsas.

### H1

Los productores quieren acceso a compradores especializados.

### H2

Los compradores tienen dificultades para descubrir nuevos cafés.

### H3

La información estructurada aumenta la intención de compra.

### H4

La verificación aumenta la confianza.

### H5

Existe disposición a comprar mediante una plataforma.

### H6

Existe disposición a pagar una comisión.

### H7

Los microlotes pueden beneficiarse de mecanismos diferentes al precio fijo.

### H8

La plataforma puede generar suficiente liquidez para ser sostenible.

---

# 41. Experimento inicial

Antes de programar una plataforma completa:

## Etapa 1

Conseguir:

- 10–20 productores;
- 20–50 lotes.

## Etapa 2

Conseguir:

- 10–20 compradores potenciales.

## Etapa 3

Construir un catálogo funcional simple.

Puede ser inicialmente:

- web;
- base de datos;
- formulario;
- dashboard;
- comunicación directa.

## Etapa 4

Medir:

- visitas;
- consultas;
- solicitudes;
- ofertas;
- ventas.

## Etapa 5

Determinar qué partes necesitan automatización.

---

# 42. Principio tecnológico

> **No construir primero la aplicación. Construir primero el sistema.**

El orden recomendado es:

```text
PROBLEMA
↓
USUARIOS
↓
VALIDACIÓN
↓
MODELO OPERATIVO
↓
MVP
↓
DATOS
↓
AUTOMATIZACIÓN
↓
PLATAFORMA
↓
ESCALA
```

---

# 43. Fases del proyecto

## FASE 0 — Investigación

Objetivo:

Definir el problema real.

Entregables:

- investigación de mercado;
- mapa de actores;
- entrevistas;
- competidores;
- hipótesis;
- oportunidades;
- riesgos.

---

## FASE 1 — Validación

Objetivo:

Demostrar que existe oferta y demanda.

Entregables:

- primeros productores;
- primeros compradores;
- primeros lotes;
- primeras solicitudes;
- primeras operaciones.

---

## FASE 2 — MVP

Objetivo:

Digitalizar el flujo validado.

Incluye:

- usuarios;
- productores;
- fincas;
- lotes;
- búsqueda;
- filtros;
- verificación;
- contacto;
- administración.

---

## FASE 3 — Transacciones

Agregar:

- órdenes;
- ofertas;
- pagos;
- estados;
- historial;
- reputación;
- logística integrada.

---

## FASE 4 — Subastas

Agregar:

- creación de subasta;
- reglas;
- pujas;
- temporizador;
- ganador;
- cierre;
- pago;
- historial.

---

## FASE 5 — Inteligencia

Posibles funcionalidades:

- recomendaciones;
- matching comprador/lote;
- análisis de precios;
- predicción de demanda;
- análisis de mercado;
- búsqueda inteligente.

---

## FASE 6 — Internacionalización

Investigar:

- compradores internacionales;
- exportadores;
- importadores;
- pagos internacionales;
- documentación;
- logística;
- regulación.

---

# 44. Riesgos principales

## Riesgo 1 — Falta de liquidez

Muchos productores y pocos compradores.

## Riesgo 2 — Falta de oferta diferenciada

Muchos cafés similares.

## Riesgo 3 — Desintermediación

Productor y comprador pueden conocerse y luego operar fuera de la plataforma.

## Riesgo 4 — Verificación costosa

Verificar cada lote puede ser demasiado caro.

## Riesgo 5 — Logística

La plataforma puede terminar intentando resolver problemas que no corresponden a su negocio principal.

## Riesgo 6 — Baja frecuencia de compra

Los compradores profesionales pueden tener relaciones comerciales establecidas.

## Riesgo 7 — Complejidad tecnológica

Intentar construir demasiadas funcionalidades antes de demostrar demanda.

## Riesgo 8 — Regulación

Pagos, comercio electrónico, datos personales, alimentos y eventualmente comercio exterior.

---

# 45. Principio contra el "feature creep"

Cada nueva funcionalidad debe responder:

> ¿Esto aumenta la probabilidad de que un productor publique?

o:

> ¿Esto aumenta la probabilidad de que un comprador compre?

o:

> ¿Esto aumenta la confianza necesaria para que ocurra una transacción?

Si la respuesta es no:

**probablemente no pertenece al MVP.**

---

# 46. Pregunta sobre la aplicación móvil

La plataforma no debe definirse inicialmente como app móvil.

La decisión deberá depender del comportamiento de los usuarios.

Posibles resultados:

```text
WEB
WEB + PWA
WEB + APP
APP
MARKETPLACE HÍBRIDO
PLATAFORMA B2B
```

La tecnología es una consecuencia del modelo, no el punto de partida.

---

# 47. Visión de largo plazo

La visión potencial del proyecto podría ser:

> **Convertirse en una infraestructura digital especializada para la comercialización transparente y trazable del café.**

No necesariamente ser solamente una tienda.

La plataforma podría evolucionar hacia:

```text
DESCUBRIMIENTO
+
INFORMACIÓN
+
VERIFICACIÓN
+
TRAZABILIDAD
+
NEGOCIACIÓN
+
TRANSACCIÓN
+
DATOS
```

---

# 48. Definición provisional del producto

### Nombre conceptual

**Marketplace especializado en café**

### Categoría

**Coffee B2B Marketplace / Coffee Trade Platform**

### Producto

Plataforma digital para descubrir, comparar y comercializar lotes de café.

### Usuarios

Productores + compradores.

### Unidad comercial

Lote.

### Activo diferencial potencial

Información + verificación + trazabilidad.

### Modelo de negocio

Por validar.

### Tecnología

Por definir después de validar el modelo.

---

# 49. Regla fundamental del proyecto

> **No construir una aplicación porque podemos construirla.**
>
> **Construir únicamente aquello que demuestre resolver una fricción real del mercado.**

---

# 50. Próximo paso

Antes de diseñar pantallas, base de datos definitiva o arquitectura tecnológica, debemos completar cinco investigaciones:

1. **Problema real del productor.**
2. **Problema real del comprador.**
3. **Competidores y alternativas existentes.**
4. **Modelo de transacción actual del café.**
5. **Validación de disposición a utilizar y pagar por la plataforma.**

Solo después de esas cinco investigaciones se deberá definir el MVP definitivo.

---

# 51. Estado del proyecto

**Estado actual:** Idea / descubrimiento.

**No aprobado todavía:**

- modelo de negocio;
- sistema de pagos;
- sistema logístico;
- subastas;
- exportación;
- tecnología;
- aplicación móvil;
- estructura definitiva de comisiones.

**Sí definido provisionalmente:**

- enfoque marketplace;
- productores como oferta;
- compradores como demanda;
- lote como unidad comercial;
- información estructurada como componente central;
- verificación y trazabilidad como posibles diferenciadores;
- desarrollo progresivo;
- validación antes de inversión tecnológica significativa.

---

# 52. Criterio de éxito del proyecto

El proyecto no será considerado validado porque exista una aplicación funcionando.

Será considerado validado cuando podamos demostrar:

> **Productores reales están dispuestos a publicar sus lotes + compradores reales están dispuestos a buscar/comprar esos lotes + las transacciones pueden ejecutarse de forma económicamente sostenible.**

La tecnología deberá facilitar ese comportamiento, no sustituirlo.

---

# 53. Próximo documento

El siguiente documento de trabajo deberá ser:

**"Investigación y validación del Marketplace de Café"**

y deberá responder:

1. ¿Cómo funciona actualmente la comercialización?
2. ¿Quiénes son los actores?
3. ¿Dónde están las fricciones?
4. ¿Qué plataformas ya existen?
5. ¿Qué modelos funcionan?
6. ¿Qué modelos no funcionan?
7. ¿Qué están haciendo los competidores?
8. ¿Dónde existe un espacio diferencial?
9. ¿Quién sería nuestro primer comprador?
10. ¿Quién sería nuestro primer productor externo?
11. ¿Cuál sería el primer caso de uso?
12. ¿Cuál sería la primera transacción?
13. ¿Qué debemos probar antes de programar?

**El proyecto debe avanzar desde la evidencia hacia el producto, y no desde la tecnología hacia la búsqueda de un problema.**
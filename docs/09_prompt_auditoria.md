# Prompt para auditar la página

Pégalo en una sesión nueva de Claude Code (o de cualquier agente con acceso al repositorio) cada vez que quieras una revisión fresca. Está escrito para que funcione sin haber visto esta conversación.

---

```
Eres un auditor de experiencia de compra. Tu trabajo es encontrar todo lo que
hace que un visitante NO compre, y proponer arreglos concretos.

## El negocio

Nandez Café: una familia de Chinácota, Norte de Santander (Colombia) que
siembra café y además le compra lotes a fincas vecinas, los tuesta y los vende
con su marca. Los lotes excepcionales se rematan en una subasta en vivo dentro
de la misma página. Venden a dos públicos: personas que compran una bolsa y
cafeterías o tostadores que compran kilos.

La página está en línea: https://cafeweb-five.vercel.app (español) y /en/ (inglés).
El código está en este repositorio:
- prototipo/js/     código fuente (core, shop, pages, auction, main)
- prototipo/*.html  páginas generadas, no se editan a mano
- tools/build.js    genera las 20 páginas, el sitemap y el panel interno
- admin/            panel privado con login (cotizador, inventario, clientes, mercado)
- docs/             decisiones ya tomadas: referentes, SEO, pagos, envíos, compra en finca

Lee docs/ antes de opinar: varias cosas que parecen errores son decisiones
tomadas a propósito y explicadas ahí.

## Lo que NO debes reportar

Ya lo sabemos y está en camino:
- Faltan las fotos reales y los textos marcados como PENDIENTE.
- Mercado Pago aún no tiene la cuenta conectada (el botón está desactivado).
- El nombre de un productor y sus premios están "por confirmar" a propósito.
- Los datos de cafés, precios y pujas son de ejemplo.
No gastes hallazgos en eso. Asume que ese contenido llegará y audita el resto.

## Qué auditar

Recorre la página como cliente, no como programador, y hazlo dos veces:
una en computador y otra en celular (emula 390 px de ancho).

Recorre estos cinco caminos completos y anota dónde dudarías, dónde te
detendrías y dónde te irías:
1. Llego desde Google buscando "café especial colombiano", no conozco la marca.
   ¿Entiendo en diez segundos qué venden y por qué cuesta lo que cuesta?
2. Quiero comprar una bolsa: catálogo, ficha del café, carrito, pago.
3. Soy una cafetería y quiero un kilo o precio por volumen.
4. Entro a la subasta sin saber qué es una subasta de café.
5. Me interesa la suscripción: ¿entiendo qué recibo, cuándo y cómo cancelo?

En cada camino revisa:
- **Claridad**: qué es, cuánto cuesta, cuándo llega, quién lo vende.
- **Confianza**: qué pruebas hay de que el café es bueno y el negocio es real.
  Faltan página de contacto, condiciones, devoluciones, política de datos.
- **Fricción**: pasos de más, campos innecesarios, decisiones que se le piden
  al cliente antes de tiempo, callejones sin salida.
- **Costos sorpresa**: el envío y el total deben verse antes del último paso.
- **Después de comprar**: qué ve la persona al terminar, cómo sabe que su
  pedido existe, cómo hace seguimiento, qué pasa si algo sale mal.
- **Celular**: tocar, escribir, leer y pagar con una sola mano.
- **Accesibilidad**: contraste, tamaño de texto, foco visible, teclado, lectores
  de pantalla, textos alternativos.
- **Escritura**: frases que suenan a plantilla, promesas vagas, palabras que un
  cliente no usa, o datos que contradicen otra parte de la página.
- **Coherencia**: precios, cantidades y nombres iguales en catálogo, ficha,
  carrito, correo y panel.
- **Los dos idiomas**: que el inglés no tenga frases sin traducir ni errores.

## Cómo trabajar

1. Empieza por el sitio en vivo, no por el código. Si puedes, ábrelo en un
   navegador; si no, lee el HTML generado, que ya trae el contenido.
2. Verifica cada hallazgo antes de reportarlo: di en qué página y en qué punto
   del recorrido ocurre. Nada de suposiciones.
3. No cambies código todavía. Primero el informe.

## Qué entregar

Primero, una tabla ordenada por impacto sobre la venta:

| # | Gravedad | Camino | Dónde | Qué pasa | Qué haría |

Gravedad: ALTA = impide o frena una compra. MEDIA = genera duda o esfuerzo.
BAJA = pulido.

Después:
- **Los tres arreglos** que más ventas recuperarían, con el porqué.
- **Lo que falta y no existe**: páginas, textos o funciones que un cliente
  espera encontrar y no están.
- **Lo que ya está bien**: dilo también, para no romperlo por accidente.

Escribe en español claro, sin jerga. Cada hallazgo con una frase de evidencia
concreta ("en la ficha del café, el precio por kilo aparece dos veces y no
coinciden"). Si algo no se puede juzgar sin verlo en un teléfono real, dilo.

Al final pregúntame cuáles arreglos aplico, y solo entonces toca el código.
Cuando lo hagas: edita prototipo/js/, corre `node tools/build.js`, verifica en
el navegador y haz un commit por tema.
```

---

## Cómo usarlo

- **Cada vez que cambie algo grande** (contenido nuevo, pagos conectados, fotos).
- En una **sesión limpia**, para que el auditor no herede lo que ya asumimos aquí.
- Si quieres una revisión más corta, agrégale al final: *"Solo los hallazgos de gravedad ALTA, máximo cinco."*
- Para una segunda opinión, el mismo prompt sirve en otro modelo o herramienta.

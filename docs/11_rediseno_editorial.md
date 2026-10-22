# Rediseño editorial: Nandez Coffee Gang

**Fecha:** 22 de octubre de 2026
**Para qué:** dejar por escrito la crítica a [coff.com.co](https://www.coff.com.co/), los referentes que miramos y las decisiones de la nueva línea gráfica, para que el siguiente que toque la página sepa por qué es como es.

---

## 1. Crítica de diseño: coff.com.co

**Impresión general.** Una tienda Shopify correcta, con una sola idea fuerte: la bolsa con la ilustración azul. Todo lo demás es plantilla. Lo que más se puede ganar está en la jerarquía: la página no decide qué quiere que hagas primero.

### Usabilidad

| Hallazgo | Gravedad | Recomendación |
|---|---|---|
| Dos llamados a la acción en la portada con el mismo peso ("Elegir mi café" y "Ver merch") | 🟡 Moderada | Un solo botón principal; el merch va en el menú. |
| El catálogo son dos bloques largos de texto con un botón "Comprar" sin precio ni tamaño | 🔴 Crítica | Nombre, notas, tamaño y precio a la vista antes de hacer clic. |
| La cinta de confianza repite cuatro frases en bucle ("+500 amantes del café satisfechos") | 🟢 Menor | Una cinta sirve si lleva datos que cambian (precio del día, tueste de la semana). |
| Playlist de Spotify embebida ocupa media pantalla antes del pie | 🟡 Moderada | Es un buen gesto de marca, pero no justifica el espacio: una tarjeta pequeña o un enlace. |
| No hay suscripción, ni ficha del origen más allá de un párrafo | 🔴 Crítica | Es justo lo que diferencia a una marca de especialidad de una de supermercado. |

### Jerarquía visual

- **Lo primero que se ve:** la foto de la taza y el titular "Specialty Coffee Colombiano Recién Tostado". Correcto, pero el titular es genérico y en inglés mezclado.
- **Recorrido:** foto grande → cinta → bloque de texto → bloque de texto → playlist → pie. Todas las secciones miden lo mismo y pesan lo mismo: el ojo no tiene dónde descansar.
- **Énfasis:** el verde oliva de los botones casi no contrasta con el crema del fondo; lo más visible termina siendo la barra negra de la cinta.

### Consistencia

| Elemento | Problema | Recomendación |
|---|---|---|
| Tipografía | Un solo sans para todo, sin escala: el titular de portada y el párrafo del producto se diferencian solo por tamaño | Dos voces (una de titulares, una de lectura) y una escala clara. |
| Color | Azul de la bolsa, verde oliva de los botones, crema, negro: cuatro colores sin jerarquía | Un color de marca que manda y uno por café. |
| Espaciado | Secciones pegadas, sin aire entre bloques | Ritmo editorial: más aire entre secciones, menos dentro. |

### Accesibilidad

- **Contraste:** el texto blanco sobre la foto de portada pasa; el verde oliva sobre crema de los botones no llega a 4.5:1.
- **Objetivos táctiles:** botones grandes, bien.
- **Legibilidad:** párrafos de producto muy largos para el ancho; falta un ancho de lectura.

### Lo que sí funciona

- La bolsa ilustrada como protagonista: la marca entera cabe en ese objeto.
- "Culture. Music. Wellness." y la playlist: una personalidad clara, que apunta a un público joven.
- Pagos locales visibles (PSE, Nequi) y envío gratis con umbral claro.

### Prioridades

1. **Mostrar el café como producto, no como párrafo:** nombre, notas, tamaño, precio y botón en una sola tarjeta.
2. **Decidir un solo color de marca y una escala tipográfica** que le dé peso a los titulares.
3. **Darle contenido al origen:** finca, altura, proceso y quién lo comprobó. Es lo que vende a precio alto.

---

## 2. Referentes

| Referente | Qué tomamos |
|---|---|
| [Onyx Coffee Lab](https://onyxcoffeelab.com/) | Un color por café, notas de cata como titular, la marca construida sobre la transparencia del sourcing ([su rebranding de 2020](https://dailycoffeenews.com/2020/08/25/onyx-coffee-lab-rebrands-to-make-coffee-discovery-more-colorful/) pasó de tres a diez colores "según la taza"). |
| [Sey Coffee](https://www.seycoffee.com/) | Productor, finca y proceso con el mismo peso que el nombre del café. Casi sin adornos. |
| [Escape Coffee](https://www.awwwards.com/sites/escape-coffee) y la colección [Editorial Layout de Awwwards](https://www.awwwards.com/inspiration/editorial-layout) | Secciones numeradas, titulares a todo el ancho, líneas de 1 px en vez de cajas, mezcla de una grotesca pesada con una serif en cursiva. |
| [WatchHouse](https://ecomm.design/site/watchhouse/) | Tipografía elegante, animaciones sutiles, filtros claros: el tono "premium sin gritar". |
| [Ceremony Coffee Roasters](https://www.awwwards.com/sites/ceremony-coffee-roasters) | Tienda y marca en la misma página, con la foto del producto grande. |
| Dak, Friedhats, Blank Street (de memoria) | Bloques de color plano, marcas con humor y una voz joven; evitan el "kraft y marrón" que ya es cliché en café. |

Tendencia de fondo, ya documentada en [05_referentes_web.md](05_referentes_web.md): la transparencia es requisito, el café se compra como vino (por cosecha) y la suscripción tiene que traer contexto.

---

## 3. La línea gráfica Coffee Gang

Parte del logo que entregó el cliente ([fuentes/marca/logo-nandez-v1.png](../fuentes/marca/logo-nandez-v1.png)): NANDEZ en una display pesada y "COFFEE GANG" debajo, en naranja. El PNG se recortó y se le quitó el fondo blanco: [prototipo/img/marca/logo.png](../prototipo/img/marca/logo.png).

**Color.** Naranja del logo `#EF4724` (muestreado del archivo), crema de papel `#F5F0E6`, negro carbón `#141210`. Cada café lleva además su propia tinta: Castillo verde `#2F5A3C`, Tibo B azul `#2C4FA3`, el tercero ocre `#C98A1E`. El naranja manda; las tintas de café solo aparecen detrás de su bolsa.

**Letra.** Bricolage Grotesque 800 para titulares (en mayúscula, apretada), Instrument Serif cursiva para el acento en naranja (`<em>`), Instrument Sans para leer, IBM Plex Mono para datos y etiquetas. Las cuatro vienen de Google Fonts.

**Material.** Se fue el vidrio y se fueron las esquinas redondas. Todo es papel, líneas de 1 px y bloques de color plano. Las rejillas de cafés, fincas, planes y diario comparten el mismo borde.

**Movimiento.** El titular entra palabra por palabra; la cinta del mercado corre y se detiene al pasar el cursor; el sello circular de la portada gira; las secciones entran al llegar a la vista; la bolsa se levanta al pasar el cursor; la cereza sigue interactiva. Todo se apaga con "reducir movimiento".

**Dónde vive.** [prototipo/gang.css](../prototipo/gang.css) es una capa encima de `styles.css` y `auction.css`; las piezas nuevas del inicio llevan prefijo `g-`. El panel interno sigue con la base. La portada está en [prototipo/js/fases.js](../prototipo/js/fases.js) y el inicio en [prototipo/js/main.js](../prototipo/js/main.js).

### El inicio, sección por sección

| # | Sección | Qué hace |
|---|---|---|
| — | Portada | "Café en grano *con nombre propio.*", la bolsa del café que se está tostando sobre naranja, tres hechos (altura, en grano, tostado semanal). |
| — | Cinta | Precio FNC del día, bolsa de Nueva York y TRM (los mismos datos del panel), envío gratis, "en grano". |
| 01 | Los cafés | Tres tarjetas: Castillo a la venta; Tibo B y el tercero como "Próximamente" con lista de espera. Debajo, la franja de la subasta en vivo. |
| 02 | Cómo trabajamos | Página negra: tres principios numerados y, en cifras grandes, lo que le pagamos a la finca frente a la referencia del día. |
| — | Por dentro | La cereza interactiva, que ya existía. |
| 03 | Los vecinos | Las cuatro fincas en una rejilla. |
| 04 | Suscripción | Bloque naranja con los tres planes y su precio al mes. |
| 05 | Diario | Las tres entradas como sumario. |
| 06 | Preguntas | Las preguntas frecuentes de siempre. |
| — | Pie | NANDEZ a todo lo ancho, contacto y enlaces legales. |

---

## 4. Los productos

Tres cafés, todos **en grano**:

| Id | Café | Estado |
|---|---|---|
| P-CAS | Castillo de Arboledas | A la venta: 250 g a $38.000 y kilo a $132.000, 84 SCA. |
| P-TIB | Tibo B | **Por confirmar**: nombre, finca, altura, ficha y precio. Se muestra como "Próximamente" y recoge correos. |
| P-003 | Tercer café | **Por confirmar** todo. Igual que el anterior. |

El Bourbon rosado salió del catálogo. El plan Cafetería pasó a 2 kg de Castillo por $240.000 al mes ($120.000 el kilo). Los datos guardados en el navegador cambiaron de versión (`nandez-v8`), así que ningún visitante verá el catálogo viejo.

---

## 5. Lo que falta decidir

1. **Tibo B:** confirmar si es finca, lote o variedad, quién lo cultiva y a qué precio sale.
2. **El tercer café:** nombre y todo lo demás.
3. **El empaque:** las fotos de las bolsas siguen siendo las del diseño anterior ("Nandez Cafe · café de origen", kraft). Cuando el empaque se rediseñe con el logo nuevo, se reemplazan las fotos con el mismo nombre de archivo y nada más cambia.
4. **La suscripción en grano:** los planes Semilla y Cosecha todavía dicen "molienda a tu gusto". Si todo va en grano, hay que decidir si esos planes llevan molino o si se mantiene la molienda solo para suscriptores.
5. **El nombre:** decidido el 22 de octubre de 2026. La empresa se llama **Nandez Coffee** en títulos, textos legales, Google y correos; **Coffee Gang** queda para la comunidad (Nandez Coffee Gang) y el merch. La cuenta de correo, el Instagram (@nandezcafe) y el YouTube (@NándezCafé) conservan el nombre anterior.
6. **El logo en vectores:** hoy es un PNG recortado. Pedirle al diseñador el SVG para que se vea nítido en cualquier tamaño.

---

## 6. Ajustes del 22 de octubre: tienda, comunidad y secciones apagadas

- **Menú:** Inicio · Tienda · Suscripción. Tienda abre dos categorías: Cafés de especialidad y Accesorios y merch. Hay una página de Tienda que lleva a las dos.
- **Apagadas:** la subasta y el diario no salen en el menú, el inicio, el pie ni el sitemap, y su dirección da 404. Se vuelven a prender quitándolas de `CONFIG.ocultas` en `prototipo/js/core.js`.
- **Cómo trabajamos:** ya no muestra lo pagado a la finca ni la referencia del día. Ese dato sigue en el panel interno.
- **Fuera del inicio:** la cereza por dentro y las preguntas frecuentes.
- **Nuevo en el inicio:** una lista de Spotify para tomar café, con botón para compartirla.
- **Nuevo en todas las páginas:** la franja para unirse a la comunidad Nandez Coffee Gang, los íconos de Instagram, Facebook y YouTube, y las cuatro políticas en el pie (privacidad, reembolso, contacto y términos).

Pendiente de completar:

1. **La lista de Spotify:** ya es la de Nandez, Coffee & chill (`CONFIG.spotify`). Al 22 de octubre tiene una sola canción; conviene llenarla.
2. **Las redes:** ya están Instagram, Facebook y YouTube (`CONFIG.redes`).
3. **Accesorios y merch:** las diez piezas están como próximamente, sin precio ni foto. Se completan en `ACCESORIOS`, en `core.js`.
4. **Los correos de la comunidad:** sin formulario externo (`CONFIG.formulario`), cada registro solo llega si la persona envía el correo que se le abre. Conviene conectar Formspree o una herramienta de correo masivo.

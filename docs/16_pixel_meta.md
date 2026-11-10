# Instalar el píxel de Meta

**Fecha:** 10 de noviembre de 2026
**Para qué:** que Meta sepa quién vio un café, quién dejó el carrito y quién compró, para mostrarle el anuncio a esa gente (remarketing) y medir cuántas ventas trae cada anuncio.

---

## 1. Dónde estamos

> **Actualización, 10 de noviembre de 2026:** el píxel ya existe y está puesto en la página. Se llama **Nandez Coffee Gang**, su número es `1805850087187226` y está conectado a la cuenta **NandezCoffeeGang**. Quedó a nombre del portafolio **Bushido Agencia**, no de Nandez Café: funciona igual, pero si algún día la marca se separa de la agencia conviene compartirlo o moverlo al portafolio de Nandez Café (paso 2.7).
>
> Los pasos 2 y 3 están hechos y el 4 se probó en local: los cinco eventos salen con su valor y su moneda. Lo que falta no es código, es panel de Meta: verificar el dominio, poner `Purchase` de primero y armar los públicos (paso 5).
>
> **Cuidado al revisar si el píxel está puesto.** Abrir la página y mirar si existe `fbq` **no** sirve: hasta que alguien oprima *Aceptar* en el aviso de cookies, el píxel no se carga, no aparece `fbevents.js` y no hay nada de `connect.facebook.net`. Eso es a propósito (Ley 1581), no un píxel faltante. Para comprobarlo de verdad: aceptar primero, o mirar `CONFIG.medicion.metaPixel` en `/js/core.js` —el número no va suelto en el HTML, va ahí.

Antes de esa fecha:

- **Todavía no había píxel.** Se revisó por la conexión con Meta el 10 de noviembre de 2026: ni la cuenta publicitaria **NandezCoffeeGang** (en el portafolio Bushido Agencia) ni el portafolio **Nandez Café** tienen un píxel (Meta ahora lo llama *conjunto de datos*).
- **La página ya está lista para recibirlo.** [prototipo/js/medir.js](../prototipo/js/medir.js) carga el píxel, pide permiso con el aviso de cookies y manda los eventos. Lo único que falta es el número del píxel en `CONFIG.medicion.metaPixel` ([prototipo/js/core.js](../prototipo/js/core.js)).
- La cuenta **Nandez** del portafolio Nandez Café está cerrada; la que está activa y con medio de pago es **NandezCoffeeGang**.

## 2. Crear el píxel (en Meta, unos 5 minutos)

Esto lo hace quien administra el portafolio; Claude no puede crear el píxel por ti.

1. Entra a [business.facebook.com/events_manager](https://business.facebook.com/events_manager) con la cuenta que administra **Nandez Café**.
2. Arriba a la izquierda escoge el portafolio **Nandez Café**. Así el píxel queda a nombre de la marca y no de la agencia: si un día cambias de agencia, el píxel y todo lo que aprendió se quedan contigo.
3. **Conectar orígenes de datos → Web → Conectar.** Nombre: `Nandez Coffee · web`.
4. Cuando pregunte la dirección, pon `https://www.nandezcoffee.com`.
5. Cuando ofrezca cómo instalarlo, escoge **instalar el código manualmente** (o cierra el asistente). **No** uses la opción de socios ni la de pegar el código: la página ya tiene el código, solo le falta el número.
6. Copia el **identificador del conjunto de datos**: un número de 15 o 16 dígitos.
7. En *Configuración del portafolio → Orígenes de datos → Conjuntos de datos*, abre el píxel y en **Asignar activos** agrégale la cuenta publicitaria **NandezCoffeeGang**, para que los anuncios de esa cuenta puedan usarlo. Si la cuenta no aparece, primero comparte el píxel con el portafolio **Bushido Agencia** (*Asignar socios*).

## 3. Ponerlo en la página

Con el número, en este mismo chat o en uno nuevo de este proyecto, basta con decir: *"pon el píxel 1234567890123456"*. Lo que se hace:

1. En [prototipo/js/core.js](../prototipo/js/core.js): `medicion: { metaPixel: "1234567890123456", ga4: "", propia: true }`.
2. `node tools/build.js`, commit y push. Vercel publica solo.

A mano es exactamente eso mismo.

## 4. Probar que funciona

Son dos recorridos distintos y conviene no mezclarlos: los tres primeros eventos se prueban en la página publicada, y `Purchase` en la tienda de prueba. Ninguno de los dos necesita una compra real.

### Antes de empezar, lo que más confunde

**Oprime `Aceptar` en el aviso de cookies.** Hasta ese clic el píxel no se carga: no existe `fbq`, no se descarga `fbevents.js` y no sale nada hacia `connect.facebook.net`. Es a propósito (Ley 1581, autorización previa y expresa para publicidad). Si abres la página, no aceptas y revisas si el píxel está, vas a concluir que no está puesto. Ya pasó una vez.

El número tampoco está suelto en el HTML: vive en `CONFIG.medicion.metaPixel`, dentro de `/js/core.js`.

### A. Los tres primeros, en nandezcoffee.com

Instala antes la extensión de Chrome **Meta Pixel Helper**: muestra en cada página qué eventos salieron y con qué datos, y sirve de segunda opinión cuando Events Manager tarde.

1. [Events Manager](https://business.facebook.com/events_manager) → el conjunto de datos **Nandez Coffee Gang** → **Probar eventos**. Escribe `https://www.nandezcoffee.com` y ábrela desde ahí.
2. **Aceptar** en el aviso de cookies → debe aparecer `PageView`.
3. Abre la ficha del Castillo → `ViewContent`.
4. Oprime *Reservar la mía* → `AddToCart`.
5. Llena los datos del pedido y oprime *Pagar ahora* → `InitiateCheckout`. **Ahí párate**: no hace falta pagar.
6. Aparte, únete a la comunidad desde el pie o el pop-up → `Lead`.

Lo que hagas aquí entra al conjunto de datos de verdad, así que recorre y sal; no te quedes dando vueltas.

### B. `Purchase`, en la tienda de prueba

`Purchase` solo sale cuando la pasarela confirma el pago, y **no hay que hacer una compra real para verlo**. La tienda de prueba corre el código de verdad —`api/pago.js`, `api/wompi.js`, la factura— contra una pasarela y una hoja simuladas: no se mueve un peso y la Hoja de Google real no se entera.

```bash
node tools/pruebas/servidor.mjs
```

Queda en `http://localhost:5190`. Ahí: aceptar cookies, abrir un café, reservar, llenar los datos y pagar. Los campos de tarjeta son simulados y el **titular decide el resultado**: `APRO` aprueba, `FUND` simula que no hay fondos.

Con el Pixel Helper abierto, al aprobarse el pago debe salir `Purchase` así (probado el 10 de noviembre de 2026):

```
Purchase
  content_ids  ["P-CAS"]
  content_type "product"
  value        52000          ← los $40.000 del café más los $12.000 de envío
  currency     "COP"
  num_items    1
  order_id     "NDZ-1110-YJ6JF3"
```

El `order_id` tiene que ser **el mismo número del pedido** que muestra la página al terminar, y el mismo que aparece en `http://localhost:5190/estado-prueba`. Si coinciden, el día que entre la API de conversiones Meta va a poder juntar las dos señales de la misma compra en vez de contarla dos veces.

> Lo que no puedo prometerte: si los eventos de `localhost` llegan o no al panel *Probar eventos* de Meta. Por eso este recorrido se revisa con el Pixel Helper, que lee lo que el navegador manda sin depender de eso. Lo que comprueba es que el evento sale completo y correcto; que el dataset lo reciba desde la página publicada ya lo comprobó el recorrido A.

### Qué revisar en cada evento

| Qué | Por qué importa |
|---|---|
| `value` y `currency: "COP"` en todos | Sin eso Meta cuenta compras pero no calcula cuánto devolvió cada peso de pauta |
| `content_ids` en `ViewContent`, `AddToCart`, `InitiateCheckout` y `Purchase` | Es lo que arma los públicos de remarketing por café |
| `order_id` en `Purchase` | Evita contar dos veces la misma compra cuando entre la API de conversiones |
| `ViewContent` una sola vez por café | La ficha se repinta con cada clic; si sale repetido, se rompió la protección de `medir.js` |

### Si algo no aparece

| Síntoma | Qué mirar primero |
|---|---|
| No sale ningún evento | ¿Oprimiste *Aceptar*? Sin eso no existe `fbq` |
| Salen todos menos `Purchase` | La pasarela no aprobó: míralo en `/estado-prueba` |
| `Purchase` sin `content_ids` | El carrito se vació antes de tiempo: revisa `UI.comprado` en `shop.js` |
| `ViewContent` repetido | La protección de `M.visto` en `medir.js` |
| Los eventos salen pero no llegan a Meta | Un bloqueador de rastreo en el navegador; prueba en una ventana limpia |

## 5. Después de instalarlo

- **Verificar el dominio** (*Configuración del portafolio → Seguridad de la marca → Dominios*): agrega `nandezcoffee.com`. Meta ofrece tres formas y con una basta:
  - **Etiqueta en el `<head>`** — copia la cadena que Meta da (solo la de `content="…"`) y ponla en `CONFIG.medicion.metaDominio` ([prototipo/js/core.js](../prototipo/js/core.js)); `node tools/build.js`, commit y push. Sale en el `<head>` de las 30 páginas. Vacía, no sale nada.
  - **Registro TXT en el DNS** — donde esté el DNS de `nandezcoffee.com`.
  - Archivo HTML en la raíz.

  Sin verificar, iOS recorta las conversiones y Meta puede limitar los eventos de compra.
- **Poner `Purchase` de primero** (*Administrador de eventos → el conjunto de datos → Medición agregada de eventos*): de los ocho puestos que deja iOS, el primero manda. Es lo que deja optimizar una campaña a ventas.
- **Públicos para remarketing** (en el Administrador de anuncios → Públicos → Crear público personalizado → Sitio web):
  - *Vieron un café y no compraron, 30 días:* `ViewContent` sin `Purchase`.
  - *Dejaron el carrito, 14 días:* `AddToCart` sin `Purchase`.
  - *Fueron a pagar y no pagaron, 7 días:* `InitiateCheckout` sin `Purchase`. Es el público más caliente.
- **Cambiar el conjunto de anuncios de `LINK_CLICKS` a `LANDING_PAGE_VIEWS`:** ese sí es un evento del píxel y filtra a quien de verdad carga la página. Se puede apenas el píxel tenga volumen.
- **Lo que el píxel no hace solo:** en celulares con bloqueo de rastreo se pierden algunas compras. Lo que las recupera es la **API de conversiones**, que manda la compra desde el servidor cuando la pasarela confirma el pago. No está hecha todavía: es el siguiente paso cuando haya anuncios andando. La página ya manda `order_id` en `Purchase`, que es lo que ese día evita contar la misma compra dos veces.

## 6. Cómo se relaciona con el panel

- El **píxel** alimenta a Meta: sus datos se ven en Events Manager y en los anuncios, no en el panel.
- La pestaña **Actividad** del panel sale de la bitácora propia de la página, en la Hoja de Google. Las dos cosas usan el mismo permiso de cookies y los mismos eventos, así que las cifras deberían parecerse.
- El texto del aviso de cookies cambia solo: con el píxel puesto dice que se usan cookies propias **y** de Meta y Google.

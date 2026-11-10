# Instalar el píxel de Meta

**Fecha:** 10 de noviembre de 2026
**Para qué:** que Meta sepa quién vio un café, quién dejó el carrito y quién compró, para mostrarle el anuncio a esa gente (remarketing) y medir cuántas ventas trae cada anuncio.

---

## 1. Dónde estamos

- **Todavía no hay píxel.** Se revisó por la conexión con Meta el 10 de noviembre de 2026: ni la cuenta publicitaria **NandezCoffeeGang** (en el portafolio Bushido Agencia) ni el portafolio **Nandez Café** tienen un píxel (Meta ahora lo llama *conjunto de datos*).
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

1. Abre [Events Manager](https://business.facebook.com/events_manager) → el píxel → **Probar eventos**, escribe `https://www.nandezcoffee.com` y ábrela desde ahí.
2. En la página, oprime **Aceptar** en el aviso de cookies. Sin ese «Aceptar» no se manda nada: es a propósito (Ley 1581).
3. Recorre la compra: abre un café, agrégalo al carrito, ve a pagar. En *Probar eventos* deben aparecer, en este orden:

| Lo que haces en la página | Evento que llega a Meta |
|---|---|
| Entras y aceptas | `PageView` |
| Abres la ficha de un café | `ViewContent` |
| Lo agregas al carrito | `AddToCart` |
| Vas a pagar (Wompi o Mercado Pago) | `InitiateCheckout` |
| Te unes a la comunidad (pie o pop-up) | `Lead` |
| El pago queda aprobado | `Purchase` |

**No hagas una compra real para probar `Purchase`:** usa la tienda de prueba (`node tools/pruebas/servidor.mjs`) o déjala para la primera venta de verdad.

También sirve la extensión de Chrome **Meta Pixel Helper**: muestra en cada página qué eventos salieron.

## 5. Después de instalarlo

- **Verificar el dominio** (*Configuración del portafolio → Seguridad de la marca → Dominios*): agrega `nandezcoffee.com` y verifícalo con el registro TXT en el DNS. Sin esto, Meta puede limitar los eventos de compra.
- **Públicos para remarketing** (en el Administrador de anuncios → Públicos → Crear público personalizado → Sitio web):
  - *Vieron un café y no compraron, 30 días:* `ViewContent` sin `Purchase`.
  - *Dejaron el carrito, 14 días:* `AddToCart` sin `Purchase`.
  - *Fueron a pagar y no pagaron, 7 días:* `InitiateCheckout` sin `Purchase`. Es el público más caliente.
- **Lo que el píxel no hace solo:** en celulares con bloqueo de rastreo se pierden algunas compras. Lo que las recupera es la **API de conversiones**, que manda la compra desde el servidor cuando la pasarela confirma el pago. No está hecha todavía: es el siguiente paso cuando haya anuncios andando.

## 6. Cómo se relaciona con el panel

- El **píxel** alimenta a Meta: sus datos se ven en Events Manager y en los anuncios, no en el panel.
- La pestaña **Actividad** del panel sale de la bitácora propia de la página, en la Hoja de Google. Las dos cosas usan el mismo permiso de cookies y los mismos eventos, así que las cifras deberían parecerse.
- El texto del aviso de cookies cambia solo: con el píxel puesto dice que se usan cookies propias **y** de Meta y Google.

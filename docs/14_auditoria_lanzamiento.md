# 14 · Auditoría de la página antes del lanzamiento (20 de noviembre de 2026)

Revisión del 3 de noviembre de 2026, sobre `main` (commit e24721e), recorriendo el sitio en
computador y en celular (375 px).

> **Corregido el 3-11-2026:** "Tú escoges" del inicio, "en grano" de la tienda y de la ficha del blend,
> el plan "Cafetería" → Barista, el rótulo "Foto de la finca y del productor", la foto de la bolsa en
> las fichas de El Paraíso y el Blend, el "desde $68.000" de la suscripción (ahora sale del plan más
> barato) y los términos de pago (cambian solos a Wompi cuando se pegue la llave). Sigue pendiente lo
> que necesita una decisión o un dato: molienda del blend, productores, tabla de kilos, imagen para compartir. Prioridades: 🔴 bloquea vender o pautar · 🟠 se nota y confunde · 🟢 mejora.

---

## 0. Lo urgente: los empaques

Las fotos de las tres bolsas (`img/productos/p-*.jpg`) muestran la misma etiqueta copiada en las tres.
**Si ese es el arte que se mandó a imprimir, hay que pararlo hoy.**

| Bolsa | Lo que dice la bolsa | Lo que dice la página | Problema |
|---|---|---|---|
| Castillo | Altura **1550 msnm** · Finca Roble Ragonvalia | 1.870 msnm · Finca El Roble | 🔴 la altura no cuadra |
| El Paraíso | Título **"CENICAFE"** · Variedad **Castillo** · 1550 msnm · **Finca Roble Ragonvalia** | El Paraíso · Cenicafé 1 · 1.300 msnm · Palocolorado, Chinácota | 🔴 variedad, altura y finca equivocadas; el café no se llama así |
| Blend | Variedad **Castillo** · 1550 msnm · Finca Roble Ragonvalia | Castillo + Cenicafé 1 · 1.300–1.870 · dos fincas | 🔴 no dice que es mezcla ni que va molido |
| Las tres | "despues de abrir" | — | 🟠 falta la tilde: "después" |

La marca vende "cada bolsa tiene remitente" y "cada dato dice quién lo comprobó": una bolsa con la
finca equivocada tumba ese mensaje en la primera foto que alguien suba. Antes de seguir, confirmar
cuál de las dos alturas del Castillo es la buena (1.550 o 1.870).

Faltan también en la bolsa los datos que el brief llama "el reporte del plug": **proceso** y
**fecha de tostión** (puede ir en un sticker o un sello aparte).

---

## 1. Sección por sección

### Inicio
| Sección | Qué hay | Qué cambiar |
|---|---|---|
| Portada | "Tu plug de café de finca." + $40.000 · Tostión media · "En grano o molido / Tú escoges" | 🟠 "Tú escoges" promete algo que no existe: cada café viene en un solo formato. Cambiar por "Dos en grano, uno molido". 🟠 En celular la foto de la bolsa no aparece en la primera pantalla: quien llega de un anuncio ve solo texto. Subir la bolsa o ponerla de fondo. 🔴 No hay nada del 20 de noviembre: falta la cuenta regresiva y la preventa (punto 4). |
| Cinta que corre | Tostión, precio, envío gratis desde $120.000, Geisha 2027 | 🟢 Agregar "Lanzamiento 20 de noviembre". |
| 01 Esta cosecha | Las tres bolsas, una a la venta y dos "próximamente / Avísame" | 🔴 Si el 20 salen los tres, El Paraíso y el Blend no pueden seguir como "próximamente": falta su proceso (y confirmar que cuestan $40.000). |
| 02 Cómo trabajamos | Manifiesto de cuatro puntos | Bien escrito. 🟢 "Tres cafés, no treinta" y "Preferimos que se agote" funcionan como texto de anuncio. |
| 03 Suscripción | Tres planes con precio | 🟠 La suscripción todavía no cobra; en el inicio se ve como si se pudiera comprar ya. Agregar "Abre pronto". |
| 04 Música | Lista de Spotify | Bien. Va al final, no estorba. |
| Comunidad | Correo + "10 % menos en tu primer pedido" | Funciona (el bono se valida contra la hoja). 🟠 Para el lanzamiento conviene cambiar la promesa a "Entérate primero del 20 de noviembre". |

### Tienda
- 🟠 Dice "3 cafés **en grano**" y "Una finca cada uno, **siempre en grano**": falso, el blend es molido y trae dos fincas. Cambiar por "Dos en grano y un blend molido".
- 🟠 "Café en grano de fincas vecinas" → "Café de fincas vecinas".
- Merch "Próximamente": está bien que no se venda, pero sin una sola foto la tarjeta se ve vacía. 🟢 Con un boceto o render de la camiseta ya junta correos.

### Cafés de especialidad
- 🟠 "Suministro de 2 kg al mes: mira el plan **Cafetería**". Ese plan ahora se llama **Barista**.
- 🟠 La tabla por kilos muestra "1 KG —" (vacío) y dice "Desde 5 kg te cotizamos", mientras Barista vende 2 kg. Quitar la columna de 1 kg o ponerle precio.
- 🟠 **Los vecinos**: aparece Domingo Torres (Geisha, Toledo, "Finca por confirmar"), que no tiene ningún café a la venta, y El Paraíso y El Roble sin productor. Para el lanzamiento: o se pone el nombre de quien cultiva cada finca, o se esconde la tarjeta de don Domingo hasta que haya lote.

### Fichas de cada café
| Café | Qué cambiar |
|---|---|
| Las tres | 🔴 Se ve el texto de relleno **"FOTO DE LA FINCA Y DEL PRODUCTOR"**. Cualquier visitante lo ve. Falta la foto o se quita ese bloque. |
| Castillo | Bien: precio, ficha, receta, stock (90). 🟠 La altura choca con la bolsa (ver punto 0). 🟢 "$160.000 por kg" confunde en una bolsa de 250 g: dejarlo solo en la tabla de kilos. |
| El Paraíso | 🔴 En la ficha **no aparece la foto** de la bolsa (en la tienda sí). Proceso, puntaje y factor en "—". |
| Blend | 🔴 Dice "Café **en grano** de Ragonvalia y Chinácota": es molido. 🔴 Sin foto en la ficha. 🟠 "Molienda **fina**: lista para el gotero o la cafetera de goteo". En la propia lista de moliendas de la página, fina es espresso; para gotero es media. Confirmar con el tostador qué molienda lleva y corregir. |

### Suscripción
- 🟠 La descripción para Google dice "**desde $68.000**"; el plan más barato es **$48.000**.
- 🟠 El título "Para tu barra, y para tu casa" empieza por las cafeterías, pero la mayoría del público de los anuncios es de casa. Al revés: "Para tu casa, y para tu barra".
- 🟠 "Cada mes o cada dos" se promete, pero no hay forma de escoger la frecuencia en la página.
- 🟠 Comunidad de WhatsApp, clase en vivo y pasaporte de métodos: confirmar que se van a cumplir antes de pautar con eso.
- Está claro que "todavía no cobramos": bien.

### Contacto
- 🔴 No hay WhatsApp (`CONFIG.whatsapp` vacío). En Colombia es por donde pregunta la gente que llega de un anuncio; sin él se pierden ventas.
- 🟠 El correo es nandezcafe@gmail.com, con el nombre viejo. Con dominio propio: hola@nandezcoffee.com.

### Términos, envíos, privacidad
- 🔴 **Términos** dice "pagas por transferencia bancaria o Nequi" y "queda confirmado cuando te respondemos". Cuando prenda Wompi, eso es falso: pagas con tarjeta, PSE o Nequi en la página y el pedido queda confirmado al aprobarse el pago.
- Falta una sección de **preventa**: cuándo se despacha, qué pasa si se retrasa, cómo se devuelve la plata (punto 4).
- Envíos y privacidad: claros y completos (Ley 1581 citada).

### Menú y pie
- Bien en celular: barra de abajo visible, sin desbordes horizontales.
- 🟢 El pie no dice el Instagram en texto (solo íconos). Poner "@nandezcoffee".

---

## 2. Imágenes

| Imagen | Estado |
|---|---|
| Bolsas (p-cas, p-par, p-ble) | Se ven bien, pero son **renders**. Para los anuncios hacen falta fotos reales de las bolsas impresas (llegan con los empaques) y corregir las etiquetas (punto 0). |
| **compartir.jpg** (la que sale al pegar el link en WhatsApp, Facebook o un anuncio) | 🔴 Está desactualizada: muestra la bolsa vieja "NANDEZ CAFE", "Arboledas 1.550 m" y dice "una finca por bolsa y siempre en grano". Rehacer con las tres bolsas nuevas y la fecha del 20. |
| Foto de finca y productor | 🔴 No hay ninguna. Es lo que más vende la idea de "café de alguien". |
| Fotos del grano (`img/grano/`) y de la finca | Están, se usan en la portada. Bien. |
| p-gei (Geisha) | Sobra mientras no haya Geisha a la venta. |

---

## 3. Lo que hace falta para mover la página y pagar pauta

### Bloqueantes (sin esto no conviene gastar un peso)
1. 🔴 **Cobrar en línea.** Falta pegar la llave pública de Wompi (`node tools/estado.mjs` lo confirma). Hoy un pedido termina en un link de Mercado Pago donde el cliente escribe el monto a mano: con tráfico pagado eso pierde la mayoría de las ventas. Pasos: docs/13_activar_pagos.md.
2. 🔴 **Medir.** La página no tiene **ningún** píxel ni analítica: ni Meta Pixel, ni la API de conversiones, ni Google Analytics, ni TikTok. Sin eso Meta no sabe a quién mostrarle el anuncio ni cuántas ventas trajo, y la pauta se optimiza a ciegas. Montar:
   - **Meta Pixel** con los eventos `ViewContent` (ficha), `AddToCart`, `InitiateCheckout`, `Purchase` (con valor) y `Lead` (registro en la comunidad o la preventa). Gratis.
   - **API de conversiones** desde `api/webhook.js` cuando Wompi confirme el pago: con iOS el píxel solo pierde muchas compras. Gratis.
   - **Google Analytics 4** para ver de dónde llega la gente. Gratis.
   - Banner de cookies: con píxel de publicidad hay que pedir permiso (Ley 1581).
3. 🔴 **Dominio propio** (nandezcoffee.com estaba libre el 22-10). `cafeweb-five.vercel.app` se ve poco confiable en un anuncio, y Meta pide verificar el dominio para medir compras. Cuesta unos USD 10–15 al año.
4. 🔴 **WhatsApp** de la marca en la página.
5. 🔴 Las correcciones de texto marcadas arriba (sobre todo el relleno de las fotos y "en grano" en el blend).

### Lo que necesita la cuenta de pauta (fuera de la página)
- Business Manager de Meta con la página de Facebook e Instagram @nandezcoffee conectadas, y un método de pago.
- **Catálogo** de Meta con los tres cafés (sirve para anuncios de catálogo y para etiquetar productos en Instagram).
- Creativos: 3 o 4 videos verticales cortos (abrir la bolsa, moler, la finca, la persona que lo cultiva) y fotos reales de las bolsas. Los renders no bastan para anuncios.
- Revisar que el Instagram tenga publicaciones antes de pautar: quien ve un anuncio entra al perfil.

### Cómo repartir la plata (sugerencia para empezar)
- **Antes del 20:** campaña de **registros y preventa** (objetivo "clientes potenciales" o "ventas"), público frío amplio en Cúcuta, Bucaramanga, Bogotá y Medellín, 25–40 años. Prueba con poco: $20.000–30.000 al día durante 5 días, y se le sube al anuncio que mejor funcione.
- **Del 20 en adelante:** **remarketing** a quien vio la página o se registró y no compró. Es la plata que más rinde y solo funciona si el píxel está puesto desde antes.

---

## 4. El 20 de noviembre: expectativa y preventa

### Lo que ya existe
La página ya tiene armado un sistema de **drops** (`CONFIG.drop`): estados "expectativa / abierto / agotado",
bolsas numeradas, la comunidad compra horas antes y datos para Google. Está apagado (`CONFIG.ocultas`)
y con la fecha vacía. No hay cuenta regresiva visible ni preventa.

### Lo que propongo
**Hasta el 19 de noviembre — expectativa y preventa**
- Franja arriba en todo el sitio: "Lanzamiento · 20 de noviembre · faltan 16 días" con cuenta regresiva.
- En la portada, la bolsa con "**Reserva la tuya**" en vez de "Agregar al pedido".
- **Preventa pagada:** se paga hoy con Wompi y se despacha el 20, en el orden en que se reservó. A cambio, algo que no se consigue después:
  - bolsa **numerada** (las primeras 50, por ejemplo) y/o
  - precio de preventa (por ejemplo $36.000 en vez de $40.000) y/o
  - envío gratis en la preventa.
- Tope de bolsas en preventa, con "quedan N". Solo se dice "agotado" si se agotó de verdad.
- La comunidad Nandez Coffee Gang recibe el link de preventa un día antes que el resto.

**El 20 de noviembre — se abre**
- La página cambia sola a "Ya salió": se compra normal, la cuenta regresiva desaparece.
- Correo a la comunidad y a quien dio "Avísame".

**Después del 20**
- Preventa cerrada; quien compró recibe la guía de envío.

### Lo legal de la preventa
En términos y en el carrito: la fecha de despacho prometida, qué pasa si se atrasa (aviso por correo
y opción de devolución completa) y que se puede cancelar antes del despacho. El Estatuto del Consumidor
obliga a cumplir lo que se anuncia, así que la fecha tiene que ser segura.

### Lo que tienes que decidir para que lo monte
1. ¿Salen los **tres** cafés el 20 o solo el Castillo? Si salen los tres: proceso y precio de El Paraíso y del Blend.
2. ¿Qué gana quien compra en preventa: precio, número, envío gratis?
3. ¿Cuántas bolsas por café en preventa?
4. ¿Desde qué día se abre la preventa y a qué hora sale el 20?
5. ¿Desde qué fecha puedes despachar con certeza? (con los empaques en la mano)

---

## 5. Calendario hasta el 20 (17 días)

| Fecha | Qué |
|---|---|
| 3–4 nov | Corregir etiquetas de las bolsas si no se han impreso. Decidir la preventa. |
| 4–6 nov | Llave de Wompi en prueba, compras de prueba (`tools/pruebas/compras.mjs`). Comprar dominio. Correcciones de texto. |
| 6–7 nov | Píxel de Meta, API de conversiones, GA4, banner de cookies. Cuenta regresiva y preventa en la página. WhatsApp. |
| 7–8 nov | Llave de Wompi de producción. Abre la preventa para la comunidad. Arranca la pauta de expectativa. |
| 8–19 nov | Contenido en Instagram, fotos reales de las bolsas, subir el anuncio que mejor funcione. |
| 20 nov | Abre la venta. Correo a la comunidad. Remarketing. |

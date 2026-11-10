# Nandez Coffee — café de origen de Norte de Santander

Le compramos café a fincas de Norte de Santander —cada una con su variedad— y lo vendemos con nuestra marca. Los lotes excepcionales van a subasta. Desde 2027 entra también el café de nuestra propia tierra.

## La página (`prototipo/`)

**Pública** — español e inglés (botón ES/EN, se recuerda en el navegador)
1. **Inicio** — los cafés a la venta, por qué cuestan lo que cuestan, las fincas aliadas y el recorrido de la finca a la bolsa.
2. **Cafés** — un café por finca, con las fincas aliadas y la nuestra (primera cosecha 2027).
3. **Ficha del café** — presentaciones, ficha con el nivel de verificación de cada dato, lo que le pagamos al productor frente a la referencia del día, receta y lista de espera.
4. **Drops** — cómo funciona un drop, el drop que viene y las preguntas de los drops. Cada drop tiene además su propia página (`/drop-001`), que no cambia de dirección ni cuando se agota: es la que va en la bolsa y en la bio.
5. **La gang** — el registro: te avisamos cada drop y compras antes que todos. Los datos del drop se cambian en un solo sitio, `CONFIG.drop` (`prototipo/js/core.js`); lo que esté vacío la página lo muestra como "por confirmar".
6. **Subasta** — el lote de Domingo Torres: reserva, pujas en vivo y extensión en los últimos 20 s.
7. **Suscripción** — tres planes; mientras no haya cobro automático, recoge correos.
8. **Diario** — blog, listo para los textos reales.

**Interna — otra página, en `admin/`, con correo y contraseña. No se enlaza desde el sitio público.** Es solo el seguimiento de la página y del stock; el inventario por lote, los costos, el cotizador y el mercado van en otro panel (sus módulos, `quote.js`, `inventory.js`, `clients.js` y `market.js`, siguen en el repositorio pero este panel no los carga).
9. **Pedidos** — lo que hay que confirmar y despachar, la guía de cada envío y cuándo toca cada suscripción.
10. **Actividad** — el embudo de la página (entraron, vieron un café, agregaron al carrito, fueron a pagar, compraron), los carritos abandonados con su recordatorio, quién llegó a pagar y no pagó, y cuántos se inscribieron por el pop-up, el pie y la página de la gang.
11. **Stock** — lo que queda de cada presentación y el cupo de la preventa, como lo ve la tienda, con el botón para corregirlo.
12. **Correos** — quién dejó su correo, con qué etiqueta, y campañas de remarketing desde Gmail.

## Documentos

| Archivo | Contenido |
|---|---|
| [docs/16_pixel_meta.md](docs/16_pixel_meta.md) | Cómo crear e instalar el píxel de Meta, probarlo y armar los públicos de remarketing |
| [docs/12_correos_y_remarketing.md](docs/12_correos_y_remarketing.md) | Correos, bono de bienvenida, pedidos y suscripciones gratis: Hoja de Google, Gmail y las pestañas Pedidos, Actividad, Stock y Correos del panel |
| [docs/11_rediseno_editorial.md](docs/11_rediseno_editorial.md) | Rediseño Coffee Gang: crítica a coff.com.co, referentes, la línea gráfica y lo que falta decidir |
| [docs/10_propuesta_suscripciones.md](docs/10_propuesta_suscripciones.md) | Suscripción con kit de bienvenida, dos formas de pagar y la Ruta Nandez |
| [docs/09_prompt_auditoria.md](docs/09_prompt_auditoria.md) | Prompt listo para auditar la página con ojos frescos |
| [docs/08_envios.md](docs/08_envios.md) | Envíos: qué cobra el mercado, con quién enviar y qué nos conviene |
| [docs/07_seo.md](docs/07_seo.md) | Cómo está armada la página para Google y para los asistentes de IA |
| [docs/06_pagos_y_suscripciones.md](docs/06_pagos_y_suscripciones.md) | Mercado Pago: link de pago, Checkout Pro, comisiones y planes de suscripción |
| [docs/05_referentes_web.md](docs/05_referentes_web.md) | Cómo venden las páginas mejor posicionadas, tendencias 2026 y decisiones de diseño |
| [docs/03_compra_y_marca.md](docs/03_compra_y_marca.md) | Cómo comprar en finca: precio FNC, factor, humedad, ejemplo y temas legales |
| [docs/04_capsulas.md](docs/04_capsulas.md) | Café en cápsulas: proceso, cuentas y maquiladores para cotizar |
| [docs/02_competencia.md](docs/02_competencia.md) | Competidores del modelo marketplace y qué copiar |
| [docs/01_analisis_y_mejoras.md](docs/01_analisis_y_mejoras.md) · [docs/00_documento_maestro_v0.1.md](docs/00_documento_maestro_v0.1.md) | Documentos de la etapa anterior |

## Correr en local

```bash
node tools/serve.js prototipo 5174
```

```bash
node tools/serve.js admin 5175
```

La tienda queda en `http://localhost:5174` y el panel en `http://localhost:5175`.

## Armar el sitio

El código vive en `prototipo/js/` y la línea gráfica en `prototipo/styles.css` (base), `prototipo/auction.css` (subasta) y `prototipo/gang.css` (la capa editorial Coffee Gang, solo para la tienda). Después de cualquier cambio:

```bash
node tools/build.js
```

Eso genera **30 páginas HTML reales** (15 en español y 15 en inglés), la página `404.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, la tienda en un solo archivo (`prototipo/nandez.html`) y el panel (`admin/index.html`). Vercel también lo corre en cada publicación (`buildCommand` en `vercel.json`), así que una página nunca queda desactualizada frente al código.

### Lo que corre solo

| Qué | Cuándo | Dónde |
|---|---|---|
| Precio FNC, bolsa de NY y TRM (para el panel de inventario y costos) | Al abrirlo y cada 30 min | `api/mercado.js` + `prototipo/js/market.js` |
| Historial del precio, igual en todos los equipos | Días hábiles, 10 a. m. y 3 p. m. | `.github/workflows/precio-fnc.yml` → `prototipo/data/mercado.json` |
| Aviso por correo cuando la FNC cambia el precio | Con la tarea anterior: abre un *issue* en GitHub | Llega al correo de quien administra el repositorio |
| Equivalente en pesos de la subasta en dólares | Al abrir la subasta en español | TRM de `api/mercado.js` |

Para correr la revisión a mano: `node tools/precio-fnc.mjs`, o en GitHub → *Actions* → *Precio FNC* → *Run workflow*.

Las páginas traen el contenido ya escrito en el HTML —porque los crawlers de IA no ejecutan JavaScript— y encima el mismo JavaScript toma el control en el navegador. Detalles en [docs/07_seo.md](docs/07_seo.md).

## Quién entra al panel

Cada persona tiene su propio correo y su propia contraseña. Un comando para las tres cosas:

```bash
node tools/clave.js "la contraseña" correo@dominio.com
```

```bash
node tools/clave.js --lista
```

```bash
node tools/clave.js --quitar <etiqueta>
```

**Agregar y cambiar son lo mismo:** si ese correo ya tenía cuenta se le pone la contraseña nueva, y si no, se crea. La contraseña debe tener al menos 10 caracteres.

La **etiqueta** es el nombre corto con que se lista y se quita una cuenta (por defecto, lo que va antes del `@`). Se puede escoger como tercer argumento: `node tools/clave.js "la contraseña" ana@dominio.com contadora`. Con la etiqueta no se entra, solo sirve para administrar.

El comando escribe en `AUTH`, dentro de `prototipo/js/admin.js`, y vuelve a armar el sitio; después falta hacer commit y subir para que aplique en el panel publicado.

En el repositorio **no queda ni la contraseña ni el correo**: solo la huella del correo (sha256) y un verificador PBKDF2 de 310.000 vueltas, cada cuenta con su propia sal. Por eso `--lista` muestra etiquetas y no correos: una vez guardado, el correo ya no se puede leer de vuelta. Tampoco se puede quitar la última cuenta, porque entonces no entraría nadie.

**Lo que este login no hace:** corre en el navegador, así que protege lo que el panel *muestra*, no el archivo en sí; quien conozca la dirección puede descargar su HTML. Lo que de verdad guarda los datos es la clave del script de Google, que se pega en la pestaña Correos y vive solo en el navegador de quien la pegó: sin ella el panel no lee pedidos, correos ni actividad. Para una puerta de verdad, ver *Deployment Protection* más abajo.

## Publicar en Vercel

1. Crear el repositorio en GitHub y subirlo:

```bash
git remote add origin https://github.com/USUARIO/altura-cafe.git
git branch -M main
git push -u origin main
```

2. En Vercel: **Add New → Project**, importar el repositorio y desplegar. No hay build: `vercel.json` ya indica que el sitio está en `prototipo/`. Si Vercel pide un *Root Directory*, poner `prototipo`.
3. Cada `git push` vuelve a desplegar solo.

### El panel, en un proyecto aparte

El panel sale del mismo repositorio que la tienda, pero se publica como **otro proyecto**, en su propia dirección y sin ningún enlace desde la página pública. Así comparte la marca y el dominio, pero quien entra a la tienda nunca lo ve.

1. En Vercel, *Add New → Project* y vuelve a importar **el mismo repositorio**.
2. En **Root Directory** pon `admin` (no `prototipo`). Llámalo, por ejemplo, `nandez-panel`.
3. Deploy. Queda en `nandez-panel.vercel.app`.
4. *Settings → Domains → Add*: escribe `panel.nandezcoffee.com`. Vercel te da un registro **CNAME** que apunta a `cname.vercel-dns.com`; agrégalo donde tengas el DNS del dominio. En unos minutos el panel responde ahí.

Queda `www.nandezcoffee.com` para la tienda y `panel.nandezcoffee.com` para el panel: mismo dominio, dos sitios distintos.

**No se enlaza desde la tienda** y `admin/robots.txt` le dice a los buscadores que no lo indexen (`Disallow: /`), así que no aparece en Google. Aun así, una dirección sin enlaces no es un secreto: quien la adivine llega al login.

**Deployment Protection.** Si el plan de Vercel lo permite (*Settings → Deployment Protection → Password Protection*), ponle una contraseña ahí también. Esa sí la revisa el servidor antes de entregar nada, así que es la única que impide descargar el panel; el login de adentro solo protege lo que el panel muestra.

**Cada `git push` vuelve a desplegar los dos proyectos**, porque leen el mismo repositorio. Si cambias quién entra al panel (`node tools/clave.js`), eso aplica cuando subas el commit.

## Configurar antes de publicar de verdad

En `prototipo/js/core.js`:
- `CONFIG.whatsapp` — número que recibe los pedidos, formato `573001234567`.
- `CONFIG.envio` — costo, umbral de envío gratis, días y transportadora (ver `docs/08_envios.md`).
- `CONFIG.pagos` — `mercadoPago: "/api/checkout"` para Checkout Pro, o links de pago en `porProducto` y `suscripcion`. El token va en Vercel como `MP_ACCESS_TOKEN`, nunca en el repositorio (ver `docs/06_pagos_y_suscripciones.md`).
- `S.fincas` y `S.productos` — las fincas aliadas y el café de cada una.
- `S.entradas` — las entradas del diario.
- `CONFIG.marca` y `CONFIG.lugar`.
- `S.productos` en `seed()` — el Geisha: precios, presentaciones, stock, ficha y lo pagado al productor.
- `COSTOS` — trilla, tueste, empaque y mermas reales.

En `prototipo/js/auction.js`: `AU_LOTE`, el lote que se subasta y lo que nos costó.

Los datos de ejemplo se guardan en el navegador de cada visitante; el botón "Reiniciar datos de la demo" los borra.

# Nandez Café — café de origen de Norte de Santander

Le compramos café a fincas de Norte de Santander —cada una con su variedad— y lo vendemos con nuestra marca. Los lotes excepcionales van a subasta. Desde 2027 entra también el café de nuestra propia tierra.

## La página (`prototipo/`)

**Pública** — español e inglés (botón ES/EN, se recuerda en el navegador)
1. **Inicio** — los cafés a la venta, por qué cuestan lo que cuestan, las fincas aliadas y el recorrido de la finca a la bolsa.
2. **Cafés** — un café por finca, con las fincas aliadas y la nuestra (primera cosecha 2027).
3. **Ficha del café** — presentaciones, ficha con el nivel de verificación de cada dato, lo que le pagamos al productor frente a la referencia del día, receta y lista de espera.
4. **Subasta** — el lote de Domingo Torres: reserva, pujas en vivo y extensión en los últimos 20 s.
5. **Suscripción** — tres planes; mientras no haya cobro automático, recoge correos.
6. **Diario** — blog, listo para los textos reales.

**Interna — otra página, en `admin/`, con correo y contraseña. No se enlaza desde el sitio público.**
7. **Cotizador** — cuánto paga el comité hoy, cuánto podemos pagar y con qué margen.
8. **Inventario** — cada lote de la compra a la bolsa vendida, con costos reales y plata quieta.
9. **Clientes** — quién compra, cada cuánto, qué prefiere y a quién llamar.
10. **Mercado** — precio FNC, bolsa de Nueva York, TRM, tabla por factor y cuándo vender.

## Documentos

| Archivo | Contenido |
|---|---|
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

El código vive en `prototipo/js/`. Después de cualquier cambio:

```bash
node tools/build.js
```

Eso genera **20 páginas HTML reales** (10 en español y 10 en inglés), `sitemap.xml`, `robots.txt`, `llms.txt`, la tienda en un solo archivo (`prototipo/nandez.html`) y el panel (`admin/index.html`).

Las páginas traen el contenido ya escrito en el HTML —porque los crawlers de IA no ejecutan JavaScript— y encima el mismo JavaScript toma el control en el navegador. Detalles en [docs/07_seo.md](docs/07_seo.md).

## Cambiar la contraseña del panel

```bash
node tools/clave.js "una clave larga y aleatoria"
```

Pega las tres líneas que imprime en `AUTH`, dentro de `prototipo/js/admin.js`, y vuelve a correr `node tools/build.js`. En el repositorio nunca queda la contraseña: solo un verificador PBKDF2 con sal.

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

Repite *Add New → Project* con el mismo repositorio, pero en **Root Directory** pon `admin`. Así el panel queda en otro dominio, no enlazado desde la tienda. Si el plan de Vercel lo permite, actívale además *Deployment Protection* con contraseña: el login del panel corre en el navegador y **no reemplaza una protección de servidor**.

## Configurar antes de publicar de verdad

En `prototipo/js/core.js`:
- `CONFIG.whatsapp` — número que recibe los pedidos, formato `573001234567`.
- `CONFIG.pagos` — `mercadoPago: "/api/checkout"` para Checkout Pro, o links de pago en `porProducto` y `suscripcion`. El token va en Vercel como `MP_ACCESS_TOKEN`, nunca en el repositorio (ver `docs/06_pagos_y_suscripciones.md`).
- `S.fincas` y `S.productos` — las fincas aliadas y el café de cada una.
- `S.entradas` — las entradas del diario.
- `CONFIG.marca` y `CONFIG.lugar`.
- `S.productos` en `seed()` — el Geisha: precios, presentaciones, stock, ficha y lo pagado al productor.
- `COSTOS` — trilla, tueste, empaque y mermas reales.

En `prototipo/js/auction.js`: `AU_LOTE`, el lote que se subasta y lo que nos costó.

Los datos de ejemplo se guardan en el navegador de cada visitante; el botón "Reiniciar datos de la demo" los borra.

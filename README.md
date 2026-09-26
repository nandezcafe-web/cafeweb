# Altura — café de Norte de Santander

Compramos café a pequeños productores, le ponemos marca y lo vendemos. Al inicio, **dos productos**: un Geisha de Chinácota y un lote en subasta.

## La página (`prototipo/`)

**Pública**
1. **Inicio** — los dos cafés, por qué cuesta lo que cuesta y el recorrido de la finca a la bolsa.
2. **El Geisha** — ficha completa: presentaciones (100 g, 250 g, 1 kg), ficha de transparencia con el nivel de verificación de cada dato, lo que le pagamos al productor frente a la referencia del día, receta y lista de espera.
3. **Subasta** — reserva, pujas en vivo, extensión en los últimos 20 s y vista interna con costo y utilidad.

**Interna — es otra página, en `admin/`, con correo y contraseña. No se enlaza desde el sitio público.**
4. **Cotizador** — cuánto paga el comité hoy, cuánto podemos pagar y con qué margen.
5. **Inventario** — cada lote de la compra a la bolsa vendida, con costos reales y plata quieta.
6. **Clientes** — quién compra, cada cuánto, qué prefiere y a quién llamar.
7. **Mercado** — precio FNC, bolsa de Nueva York, TRM, tabla por factor y cuándo vender.

## Documentos

| Archivo | Contenido |
|---|---|
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

## Armar los archivos

El código vive en `prototipo/js/`. Después de cualquier cambio:

```bash
node tools/build.js
```

Eso genera `prototipo/altura.html` (la tienda en un solo archivo, para enviar por WhatsApp) y `admin/index.html` (el panel con login).

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
- `CONFIG.marca` y `CONFIG.lugar`.
- `S.productos` en `seed()` — el Geisha: precios, presentaciones, stock, ficha y lo pagado al productor.
- `COSTOS` — trilla, tueste, empaque y mermas reales.

En `prototipo/js/auction.js`: `AU_LOTE`, el lote que se subasta y lo que nos costó.

Los datos de ejemplo se guardan en el navegador de cada visitante; el botón "Reiniciar datos de la demo" los borra.

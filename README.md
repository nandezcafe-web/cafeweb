# Altura — café de Norte de Santander

Compramos café a pequeños productores, le ponemos marca y lo vendemos. Este repositorio tiene la plataforma (prototipo) y los documentos de trabajo.

## Documentos

| Archivo | Contenido |
|---|---|
| [docs/03_compra_y_marca.md](docs/03_compra_y_marca.md) | **Cómo comprar en finca:** precio FNC, factor de rendimiento, humedad, ejemplo de una carga, temas legales y riesgos |
| [docs/04_capsulas.md](docs/04_capsulas.md) | **Café en cápsulas:** proceso, formatos, cuentas, maquiladores para cotizar y recomendación |
| [docs/02_competencia.md](docs/02_competencia.md) | Competidores y qué copiar (escrito para el modelo anterior, sigue siendo útil) |
| [docs/01_analisis_y_mejoras.md](docs/01_analisis_y_mejoras.md) | Análisis del documento maestro |
| [docs/00_documento_maestro_v0.1.md](docs/00_documento_maestro_v0.1.md) | Documento maestro original (modelo marketplace, ya superado) |
| [validacion/](validacion/) | Guías de entrevista y plantillas de la etapa de validación |

## La plataforma (`prototipo/`)

Seis partes, dos públicas y cuatro internas:

1. **Tienda** — catálogo de nuestros cafés con origen, altura, puntaje y notas; pedido por WhatsApp.
2. **Subasta** — para microlotes excepcionales: reserva, pujas en vivo, extensión en los últimos 20 s y vista interna con nuestro costo y utilidad.
3. **Cotizador** *(interno)* — lo que paga el comité hoy, lo máximo que podemos ofrecer y el margen, con toda la cadena: pergamino → verde → tostado → bolsas.
4. **Inventario** *(interno)* — cada lote de la compra a la bolsa vendida: trilla, tueste, empaque, costo real por bolsa y cuánta plata está quieta en bodega.
5. **Clientes** *(interno)* — quién compra, cada cuánto, qué café prefiere, quién se atrasó y mensaje de WhatsApp sugerido.
6. **Mercado** *(interno)* — precio FNC, bolsa de Nueva York, TRM, tabla por factor, equivalencias y cuándo conviene vender.

### Abrirlo

`prototipo/altura.html` es todo en un archivo: se abre con doble clic. Para trabajar sobre el código:

```bash
npx --yes serve prototipo
```

### Dónde cambiar los datos
- `prototipo/js/core.js` → `CONFIG` (precio FNC, WhatsApp, marca), `COSTOS` (trilla, tueste, empaque, mermas) y `seed()` (productos y compras).
- `prototipo/js/auction.js` → `AU_LOTE`: el lote que se subasta, incluido lo que nos costó.
- La vista **Mercado** guarda el precio del día en el navegador y el cotizador lo usa de inmediato.

Los costos que trae por defecto son **supuestos**: reemplazarlos por las cotizaciones reales de trilla, tueste y empaque.

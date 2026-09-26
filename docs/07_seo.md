# SEO 2026: cómo está armada la página para que la encuentren

**Fecha:** 26 de septiembre de 2026

---

## 1. El hallazgo que cambió la arquitectura

**Google ejecuta JavaScript; los crawlers de IA no.** Un análisis de más de 500 millones de descargas de GPTBot no encontró **ni una** ejecución de JavaScript: el bot baja el HTML inicial y sigue de largo. Si la página se dibuja en el navegador, ChatGPT, Claude o Perplexity ven una cáscara vacía.

Por eso la página ahora hace las dos cosas:

- **HTML ya escrito**, una página real por sección y por idioma, generada con `node tools/build.js`.
- **JavaScript encima**, que toma el control al cargar: subasta en vivo, carrito, cambio de idioma, sin recargar.

Es el mismo patrón de Next.js o Nuxt, pero sin framework ni servidor: archivos estáticos que Vercel sirve rapidísimo.

## 2. Lo que se generó

| Elemento | Detalle |
|---|---|
| **20 páginas** | 10 en español y 10 en inglés: inicio, cafés, una por café, subasta, suscripción, diario y una por entrada |
| **URLs limpias** | `/cafe-bourbon-rosado`, `/subasta`, `/en/coffee-pink-bourbon`, `/en/auction`. Sin `#`, que los buscadores ignoran |
| **Título y descripción por página** | Escritos con las palabras que la gente busca, no con relleno |
| **`hreflang`** | Cada página apunta a su versión en el otro idioma, y al revés |
| **Datos estructurados** | `Organization`, `WebSite`, `Product` (con precio, stock, variedad, altura y puntaje), `Article`, `Event` para la subasta y `FAQPage` |
| **`sitemap.xml`** | Las 20 URLs con fecha |
| **`robots.txt`** | Permite explícitamente GPTBot, ClaudeBot, PerplexityBot y Google-Extended |
| **`llms.txt`** | Resumen del negocio en texto plano, pensado para que los asistentes de IA citen bien |
| **Preguntas frecuentes** | Seis preguntas reales en el inicio, con su marcado `FAQPage` |

## 3. Qué se busca posicionar

| Búsqueda | Página |
|---|---|
| café de origen Norte de Santander · café especial Cúcuta | Inicio |
| comprar café especial colombiano · café de finca | Cafés |
| café Bourbon rosado / Castillo + municipio + puntaje SCA | Ficha de cada café |
| subasta de café Geisha Colombia | Subasta |
| suscripción de café colombiano | Suscripción |
| qué es el factor de rendimiento · qué significa el puntaje SCA | Diario y preguntas frecuentes |

Las preguntas frecuentes no son decoración: son las consultas que la gente escribe y las que los asistentes de IA responden citando fuentes. Cada respuesta es un hecho corto y autosuficiente, que es lo que esos sistemas prefieren citar.

## 4. Lo que falta, y pesa

1. **Fotos reales** con `alt` descriptivo: del productor, la finca y el café. Es lo que más falta.
2. **Contenido del diario.** Las páginas no actualizadas cada trimestre tienen **tres veces más** probabilidad de perder sus citas en IA. Una entrada al mes basta.
3. **Dominio propio.** Hoy el sitio apunta a `cafeweb.vercel.app`; hay que comprar el dominio y cambiar `CONFIG.sitio` antes de que los buscadores indexen la dirección provisional.
4. **Ficha de Google Business** para "café especial en Cúcuta" y búsquedas locales.
5. **Menciones en otros sitios.** Para los sistemas de IA pesa más que te nombren en artículos y directorios del sector que la cantidad de enlaces.
6. **Fecha visible de actualización** en cada café y entrada.

## 5. Cómo mantenerlo

Cada vez que se cambie contenido: `node tools/build.js` y `git push`. El generador rehace las 20 páginas, el sitemap y el `llms.txt` con la fecha del día.

## Fuentes
[JavaScript y crawlers de IA](https://www.getpassionfruit.com/blog/javascript-rendering-and-ai-crawlers-can-llms-read-your-spa) · [SEO para SPA 2026](https://www.weweb.io/blog/seo-single-page-application-ultimate-guide) · [GEO/AEO 2026](https://www.lumar.io/blog/best-practice/geo-aeo-seo-experts-weigh-in-on-ai-search/) · [Guía SEO y GEO](https://www.progress.com/blogs/seo-and-geo-guide) · [SEO en 2026 (Adobe)](https://business.adobe.com/blog/seo-in-2026-fundamentals) · [Tendencias café 2026](https://specialitycoffee.ca/blogs/all-about-speciality-coffee/2026-specialty-coffee-trends)

---
name: verify
description: How to run and drive the Nandez Café site (public SPA, single-file build, admin panel) to verify a change.
---

# Verificar un cambio en Nandez Café

## Levantar
- Producción: `https://cafeweb-five.vercel.app` (Vercel despliega `main` solo; el push lo hace el usuario).
- Local: `.claude/launch.json` → `prototipo` (puerto 5174, sitio público) y `panel` (5175, admin). Usar preview_start con el nombre.
- Build: `node tools/build.js` genera el HTML estático por ruta y el archivo único `prototipo/nandez.html`.

## Recorrer
- El sitio es una SPA: `go('suscripcion')` desde la consola navega sin recargar. En `nandez.html` el hash (`#/ruta`) NO enruta; usar `go()`.
- Los crawlers no ejecutan JS: para textos SEO/llms.txt basta `curl -s <url> | grep`.
- Inglés: rutas bajo `/en/` (p. ej. `/en/subscription`).
- Estado del visitante: `localStorage['nandez-v7']`. Para probar estado viejo, inyectar claves ahí y recargar; limpiar al terminar.
- Formularios que "envían" abren el correo con `abrirContacto(texto, asunto)`: reemplazarla por una función que capture, para no abrir el cliente de correo.
- Móvil: resize_window preset mobile; revisar `scrollWidth - innerWidth === 0` y que el `.dock` esté visible.

## Trampas
- Con el panel del navegador oculto, `requestAnimationFrame` se pausa y los eventos de foco no llegan: simular rAF con setTimeout.
- El panel admin tiene su propia copia de `PLANES` en `admin/index.html`; no entrar con credenciales reales, basta con que cargue sin errores.
- Las imágenes llevan `?v=IMG_V`; si en producción se ve una imagen vieja, revisar ese hash antes de sospechar del código.

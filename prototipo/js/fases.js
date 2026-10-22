/* ============================================================
   LA PORTADA Y LA CEREZA POR DENTRO.
   La portada muestra el producto donde nace: la bolsa de Nandez sobre una
   piedra del cafetal. La cereza pasó a su propia sección: ahí hay espacio
   para mirarla por dentro y nombrar sus seis capas.
   ============================================================ */

/* Una foto del sitio con su huella de versión. En el archivo de un solo HTML
   las fotos viajan dentro, así que ahí no hay dirección que pedir. */
function foto(ruta) {
  const k = ruta.replace(/^.*\//, "").replace(/\.webp$/, "");
  const dentro = typeof GRANO_EMBEBIDO !== "undefined" && (GRANO_EMBEBIDO[k] || GRANO_EMBEBIDO[k.replace(/@0\.5x$/, "") + "@0.5x"]);
  if (dentro) return dentro;
  return typeof IMG_V !== "undefined" && IMG_V ? `${ruta}?v=${IMG_V}` : ruta;
}

/* ---------- la portada ---------- */
const ICONOS = {
  montana: '<path d="M3 20 9.5 8l4 7 2.5-4L21 20Z"/><path d="m8 11.2 1.5 1.3 1.6-1.4"/>',
  hoja: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z"/><path d="M5 19 13 11"/>',
  ficha: '<path d="M7 3h7l4 4v14H7Z"/><path d="M14 3v4h4"/><path d="m9.5 14 2 2 3.5-4"/>',
  flecha: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  brote: '<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 15.5c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5Z"/>',
  lupa: '<circle cx="11" cy="11" r="6.2"/><path d="m20 20-4.6-4.6"/><path d="m8.6 11 1.7 1.7 3.1-3.3"/>',
  sello: '<circle cx="12" cy="9" r="5.6"/><path d="m8.6 13.6-1.6 7.2 5-2.6 5 2.6-1.6-7.2"/>',
};
const icono = (k, clase = "") => `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[k]}</svg>`;

function portada(en) {
  const p = S.productos.find((x) => !x.proximamente) || S.productos[0];
  const hechos = en
    ? [["1,500 to 1,950 m", "above sea level"], ["Whole bean, always", "you grind it at home"], ["One farm", "per bag"]]
    : [["1.500 a 1.950 msnm", "fincas vecinas"], ["En grano, siempre", "lo mueles en casa"], ["Una finca", "por bolsa"]];
  const sello = en ? "2026 HARVEST · WHOLE BEAN · NORTE DE SANTANDER · " : "COSECHA 2026 · EN GRANO · NORTE DE SANTANDER · ";
  return `<section class="g-hero hero" aria-labelledby="portada-titulo">
    <div class="g-hero-txt">
      <p class="g-kicker reveal"><em>${esc(CONFIG.marca)}</em> · Chinácota, Norte de Santander</p>
      <h1 id="portada-titulo">${pal(en ? "Whole bean coffee" : "Café en grano")}<em>${pal(en ? "with a first name." : "con nombre propio.", 3)}</em></h1>
      <p class="g-lede reveal" style="--i:3">${en
        ? "Three coffees from neighbouring farms in Norte de Santander. One farm per bag, always whole bean, so you grind it at home and every cup tastes of the place it came from."
        : "Tres cafés de fincas vecinas de Norte de Santander. Una finca por bolsa y siempre en grano, para que lo muelas en casa y cada taza sepa al lugar de donde salió."}</p>
      <div class="g-cta reveal" style="--i:4">
        <button class="btn primary lg" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}${icono("flecha", "ico")}</button>
        <a class="g-link" href="${ruta("suscripcion")}" data-act="go" data-to="suscripcion">${en ? "The subscription" : "La suscripción"}</a>
      </div>
      <ul class="g-hechos reveal" style="--i:5">${hechos.map(([a, b]) => `<li><b>${a}</b><small>${b}</small></li>`).join("")}</ul>
    </div>
    <div class="g-hero-art reveal" style="--i:2" data-act="cafe" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(tx(p.nombre))}">
      <p class="g-hero-tag">${en ? "Available now" : "Disponible ahora"}<b>${esc(tx(p.nombre))}</b></p>
      ${fotoProducto(p, { sizes: "(min-width:900px) 480px, 80vw", clase: "g-hero-foto", prioridad: true })}
      <svg class="g-sello" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="g-arco" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"/></defs>
        <circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="4" style="fill:currentColor"/><text><textPath href="#g-arco">${sello}</textPath></text></svg>
    </div>
  </section>`;
}

/* La cinta: lo que hace distinto a Nandez, dicho en corto. Sin precios del
   mercado: la carga, la bolsa y el dólar son datos internos y viven en el panel.
   Corre despacio y se detiene al pasar el cursor. */
function cinta(en) {
  const items = en
    ? [`<em>One farm</em> per bag`, `Grown at <em>1,500 to 1,950</em> metres`, `<em>Whole bean</em>, ground at home`, `<em>2026</em> harvest`,
       `Chinácota · Toledo · Ragonvalia`, `Free shipping from <em>${cop(CONFIG.envio.gratisDesde)}</em>`,
       `Our own farm: <em>5,000</em> Geisha plants, first harvest 2027`, `Norte de Santander · <em>${CONFIG.gang}</em>`]
    : [`<em>Una finca</em> por bolsa`, `Cultivado entre <em>1.500 y 1.950</em> metros`, `<em>En grano</em>, para moler en casa`, `Cosecha <em>2026</em>`,
       `Chinácota · Toledo · Ragonvalia`, `Envío gratis desde <em>${cop(CONFIG.envio.gratisDesde)}</em>`,
       `Nuestra finca: <em>5.000</em> plantas de Geisha, primera cosecha en 2027`, `Norte de Santander · <em>${CONFIG.gang}</em>`];
  const fila = items.map((x) => `<span>${x}</span>`).join("");
  return `<div class="g-ticker" aria-label="${en ? "At a glance" : "En corto"}"><div class="g-ticker-track">${fila}${fila}</div></div>`;
}

/* ---------- la cereza por dentro ---------- */
function capasCereza(en) {
  return en
    ? [["Skin", "exocarp", "Protects the fruit from the sun, the rain and insects."],
       ["Pulp", "mesocarp", "Fleshy and sweet. This is what comes off when we pulp it."],
       ["Mucilage", "", "The gel stuck to the parchment. This is the layer that ferments."],
       ["Parchment", "endocarp", "A papery shell around the seed. It comes off at the mill."],
       ["Silver skin", "tegument", "A thin membrane that stays on the bean until it is roasted."],
       ["Green bean", "seed", "Two per fruit. Only one when it comes out a peaberry."]]
    : [["Piel", "exocarpio", "Protege el fruto del sol, la lluvia y los insectos."],
       ["Pulpa", "mesocarpio", "Carnosa y dulce. Es lo que sale al despulpar."],
       ["Mucílago", "", "La capa gelatinosa pegada al pergamino. Es la que fermenta."],
       ["Pergamino", "endocarpio", "Cáscara de papel que envuelve la semilla. Se quita en la trilla."],
       ["Película plateada", "tegumento", "Membrana fina, pegada al grano hasta el tueste."],
       ["Grano verde", "semilla", "Dos por fruto. Uno solo cuando sale caracolillo."]];
}

function imgCapa(k, clase, alt, en, primera) {
  const base = `/img/grano/${k}`;
  const dentro = typeof GRANO_EMBEBIDO !== "undefined" && GRANO_EMBEBIDO[k];
  const fuente = dentro
    ? `src="${dentro}"`
    : `src="${foto(base + ".webp")}" srcset="${foto(base + "@0.5x.webp")} 320w, ${foto(base + ".webp")} 640w" sizes="(min-width:900px) 34vw, 62vw"`;
  return `<img class="${clase}" ${fuente} width="640" height="640" alt="${esc(alt[en ? 1 : 0])}"
    ${primera ? "" : 'aria-hidden="true" '}loading="lazy" decoding="async">`;
}

function seccionCereza(en) {
  const capas = capasCereza(en).map(([nombre, tec, texto]) =>
    `<li><b>${esc(nombre)}</b>${tec ? `<i>${esc(tec)}</i>` : ""}<span>${esc(texto)}</span></li>`).join("");
  return `<section class="section por-dentro">
    <figure class="cereza" data-cereza>
      <div class="cereza-lente">
        <span class="cereza-halo" aria-hidden="true"></span>
        <span class="cereza-vidrio" aria-hidden="true"></span>
        ${imgCapa("cereza", "cereza-piel", ["Cereza de café madura, roja y brillante",
                                            "Ripe coffee cherry, glossy red"], en, true)}
        ${imgCapa("capa-corte", "cereza-corte", ["Corte de la cereza: piel, pulpa, pergamino y los dos granos verdes",
                                                 "Cherry in section: skin, pulp, parchment and the two green beans"], en, false)}
      </div>
      <figcaption>
        <p class="cereza-pista"><span class="con-mouse">${en ? "Move the cursor over the cherry." : "Pasa el cursor por la cereza."}</span><span
          class="con-dedo">${en ? "Drag your finger over the cherry." : "Arrastra el dedo sobre la cereza."}</span></p>
        <button class="cereza-btn" type="button" aria-pressed="false">${en ? "Open it whole" : "Abrirla entera"}</button>
      </figcaption>
    </figure>
    <div class="por-dentro-texto">
      <div class="section-head"><p class="eyebrow">${en ? "Inside the fruit" : "Por dentro"}</p>
        <h2>${en ? "One cherry, <em>six layers</em>" : "Una cereza, <em>seis capas</em>"}</h2>
        <p>${en ? "From the outside in, this is everything that has to come off before the bean reaches the roaster."
                : "De afuera hacia adentro, todo lo que hay que quitarle antes de que el grano llegue al tostador."}</p></div>
      <ol class="cereza-capas">${capas}</ol>
    </div>
  </section>`;
}

/* ------------------------------------------------------------
   La lente sigue al puntero y no se interpola: tiene que pegarse al dedo.
   Lo único que abre y cierra con suavidad es el radio. El botón la abre
   entera sin puntero, para teclado y lectores de pantalla.
   ------------------------------------------------------------ */
function montarCereza() {
  const fig = document.querySelector("[data-cereza]");
  if (!fig || fig.dataset.montada) return;
  fig.dataset.montada = "1";
  const lente = fig.querySelector(".cereza-lente");
  let pedido = null, x = 50, y = 50, r = 0, abierta = false;

  function pintar() {
    pedido = null;
    lente.style.setProperty("--x", x.toFixed(1) + "%");
    lente.style.setProperty("--y", y.toFixed(1) + "%");
    lente.style.setProperty("--r", r.toFixed(1) + "%");
  }
  const pedir = () => { if (!pedido) pedido = requestAnimationFrame(pintar); };

  function seguir(e) {
    if (abierta) return;
    const c = lente.getBoundingClientRect();
    if (!c.width) return;
    x = ((e.clientX - c.left) / c.width) * 100;
    y = ((e.clientY - c.top) / c.height) * 100;
    r = 46;
    pedir();
  }
  lente.addEventListener("pointermove", seguir);
  lente.addEventListener("pointerdown", seguir);
  lente.addEventListener("pointerleave", () => { if (!abierta) { r = 0; pedir(); } });

  fig.querySelector(".cereza-btn").addEventListener("click", (e) => {
    abierta = !abierta;
    e.currentTarget.setAttribute("aria-pressed", String(abierta));
    e.currentTarget.textContent = abierta ? (UI.lang === "en" ? "Close it" : "Cerrarla")
                                          : (UI.lang === "en" ? "Open it whole" : "Abrirla entera");
    x = y = 50; r = abierta ? 130 : 0;
    pedir();
  });
}

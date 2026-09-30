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
};
const icono = (k, clase = "") => `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[k]}</svg>`;

function portada(en) {
  const sellos = en
    ? [["montana", "1,500 to 1,950", "metres up"], ["hoja", "One farm", "per bag"], ["ficha", "Checked", "data sheet"]]
    : [["montana", "1.500 a 1.950", "metros de altura"], ["hoja", "Una finca", "por bolsa"], ["ficha", "Ficha", "verificada"]];
  return `<section class="portada" aria-labelledby="portada-titulo">
    <picture class="portada-foto">
      <source media="(max-width:760px)" srcset="${foto("/img/portada/portada-alto@0.5x.webp")} 500w, ${foto("/img/portada/portada-alto.webp")} 1000w" sizes="100vw">
      <img src="${foto("/img/portada/portada-ancho.webp")}" srcset="${foto("/img/portada/portada-ancho@0.5x.webp")} 1200w, ${foto("/img/portada/portada-ancho.webp")} 2400w"
        sizes="(min-width:1240px) 1200px, 100vw" width="2400" height="1340" fetchpriority="high" decoding="async"
        alt="${en ? "A bag of Nandez Café on a mossy stone in a coffee farm in Norte de Santander, with coffee leaves and a ripe cherry at its foot"
                  : "Bolsa de Nandez Café sobre una piedra con musgo en un cafetal de Norte de Santander, con hojas de café y una cereza madura al pie"}">
    </picture>
    <div class="portada-texto">
      <p class="portada-sobre reveal">${en ? "Single-origin coffee from Norte de Santander" : "Café de origen de Norte de Santander"}</p>
      <h1 id="portada-titulo">${pal(en ? "Coffee with" : "Café con")}<br><em>${pal(en ? "a first name." : "nombre propio.", 2)}</em></h1>
      <p class="portada-lede reveal" style="--i:3">${en
        ? "Farm by farm, we choose the best lots in Norte de Santander and roast them under our name. Every bag says who grew it."
        : "Escogemos, finca por finca, los mejores lotes de Norte de Santander y los tostamos con nuestra marca. Cada bolsa dice quién lo cultivó."}</p>
      <div class="portada-cta reveal" style="--i:4">
        <button class="btn claro lg" data-act="go" data-to="cafes">${en ? "See the coffees" : "Ver los cafés"}${icono("flecha", "ico")}</button>
        <a class="portada-link" href="${ruta("cafes")}#cafeterias" data-act="go" data-to="cafes">${en ? "Prices for cafés" : "Precios para cafeterías"}</a>
      </div>
      <ul class="portada-sellos reveal" style="--i:5">${sellos.map(([k, a, b]) => `<li>${icono(k)}<span>${a}<br>${b}</span></li>`).join("")}</ul>
    </div>
    <p class="portada-firma" aria-hidden="true">${en ? "Grown by neighbours" : "Cosechado por vecinos"}</p>
  </section>`;
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

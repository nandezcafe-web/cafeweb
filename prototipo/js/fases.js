/* ============================================================
   LA CEREZA DEL HERO.
   Un solo objeto sobre un disco de vidrio. Donde la persona pasa el cursor
   —o el dedo— la fruta se vuelve transparente por capas: primero la pulpa
   con sus dos granos, y en el centro el grano ya tostado.
   Es el negocio entero en un gesto: lo que compramos en la finca y lo que
   termina en la taza son la misma cosa.
   ============================================================ */

const CAPAS = [
  ["cereza",      "cereza-piel",  ["Cereza de café madura, roja y brillante",
                                   "Ripe coffee cherry, glossy red"]],
  ["capa-pulpa",  "cereza-pulpa", ["La pulpa por dentro, con los dos granos en su pergamino",
                                   "The flesh inside, with the two beans in their parchment"]],
  ["capa-grano",  "cereza-grano", ["El mismo grano, ya tostado",
                                   "The same bean, roasted"]],
];

function imgCapa(k, clase, alt, en, primera) {
  const base = `/img/grano/${k}`;
  const dentro = typeof GRANO_EMBEBIDO !== "undefined" && GRANO_EMBEBIDO[k];
  const fuente = dentro
    ? `src="${dentro}"`
    : `src="${base}.webp" srcset="${base}@0.5x.webp 320w, ${base}.webp 640w" sizes="(min-width:900px) 34vw, 62vw"`;
  return `<img class="${clase}" ${fuente} width="640" height="640" alt="${esc(alt[en ? 1 : 0])}"
    ${primera ? 'fetchpriority="high"' : 'aria-hidden="true"'} decoding="async">`;
}

function heroCereza(en) {
  const capas = CAPAS.map(([k, clase, alt], i) => imgCapa(k, clase, alt, en, i === 0)).join("\n      ");
  return `<figure class="cereza" data-cereza>
    <div class="cereza-lente">
      <span class="cereza-halo" aria-hidden="true"></span>
      <span class="cereza-vidrio" aria-hidden="true"></span>
      ${capas}
      <span class="cereza-aro" aria-hidden="true"></span>
    </div>
    <figcaption>
      <button class="cereza-btn" type="button" aria-pressed="false"><span
        class="con-mouse">${en ? "Move over the cherry" : "Pasa el cursor por la cereza"}</span><span
        class="con-dedo">${en ? "Tap the cherry" : "Toca la cereza"}</span></button>
      <span>${en ? "The coffee you are going to drink is already inside."
                 : "El café que te vas a tomar ya está adentro."}</span>
    </figcaption>
  </figure>`;
}

/* ------------------------------------------------------------
   La lente sigue al puntero y no se interpola: tiene que pegarse al dedo.
   Lo único que abre y cierra con suavidad es el radio.
   El botón hace lo mismo sin puntero, para teclado y lectores de pantalla.
   ------------------------------------------------------------ */
function montarCereza() {
  const fig = document.querySelector("[data-cereza]");
  if (!fig || fig.dataset.montada) return;
  fig.dataset.montada = "1";
  const lente = fig.querySelector(".cereza-lente");
  let pedido = null, x = 50, y = 50, r = 0, fija = false;

  function pintar() {
    pedido = null;
    lente.style.setProperty("--x", x.toFixed(1) + "%");
    lente.style.setProperty("--y", y.toFixed(1) + "%");
    lente.style.setProperty("--r", r.toFixed(1) + "%");
  }
  const pedir = () => { if (!pedido) pedido = requestAnimationFrame(pintar); };

  function seguir(e) {
    if (fija) return;
    const c = lente.getBoundingClientRect();
    if (!c.width) return;
    x = ((e.clientX - c.left) / c.width) * 100;
    y = ((e.clientY - c.top) / c.height) * 100;
    r = 34;
    lente.classList.add("abierta");
    pedir();
  }
  lente.addEventListener("pointermove", seguir);
  lente.addEventListener("pointerdown", seguir);
  lente.addEventListener("pointerleave", () => {
    if (fija) return;
    r = 0; lente.classList.remove("abierta"); pedir();
  });

  fig.querySelector(".cereza-btn").addEventListener("click", (e) => {
    fija = !fija;
    e.currentTarget.setAttribute("aria-pressed", String(fija));
    x = y = 50; r = fija ? 130 : 0;
    lente.classList.toggle("abierta", fija);
    lente.classList.toggle("entera", fija);
    pedir();
  });
}

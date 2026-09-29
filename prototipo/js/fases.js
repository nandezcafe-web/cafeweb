/* ============================================================
   EL GRANO, HACIA ATRÁS.
   Empieza por lo que la persona se toma —el grano tostado, grande y en el
   centro— y al bajar le va devolviendo cada etapa hacia la izquierda, hasta
   la flor. Siete piezas recortadas, misma luz, flotando sobre el papel.
   ============================================================ */

const PIEZAS = ["flor", "cereza-verde", "cereza", "abierta", "pergamino", "verde", "tostado"];

/* escala propia de cada pieza: una flor y una cereza no miden lo que un grano */
const ESCALA = { flor: 1, "cereza-verde": .98, cereza: .98, abierta: 1.04, pergamino: .82, verde: .74, tostado: .74 };

const ALT = {
  flor:           ["Flor blanca del cafeto, cinco pétalos abiertos en estrella",
                   "White coffee blossom, five petals open in a star"],
  "cereza-verde": ["Fruto verde del café, todavía sin madurar",
                   "Unripe green coffee cherry"],
  cereza:         ["Cereza de café madura, roja y brillante",
                   "Ripe coffee cherry, glossy red"],
  abierta:        ["Cereza partida: las dos mitades dejan ver los granos con mucílago",
                   "Cherry split open: the two halves reveal the beans in mucilage"],
  pergamino:      ["Grano seco dentro de su cáscara de pergamino",
                   "Dry bean inside its parchment husk"],
  verde:          ["Grano de café verde ya trillado, con el surco central",
                   "Milled green coffee bean, centre crease visible"],
  tostado:        ["Grano de café tostado, café oscuro con brillo de aceite",
                   "Roasted coffee bean, dark brown with an oily sheen"],
  corte:          ["La cereza por dentro: cáscara, pulpa, mucílago, pergamino y los dos granos",
                   "The cherry inside: skin, pulp, mucilage, parchment and the two beans"],
};

function imgPieza(k, en, primera, clase) {
  const base = `/img/grano/${k}`;
  const dentro = typeof GRANO_EMBEBIDO !== "undefined" && GRANO_EMBEBIDO[k];
  const fuente = dentro
    ? `src="${dentro}"`
    : `src="${base}.webp" srcset="${base}@0.5x.webp 320w, ${base}.webp 640w" sizes="(min-width:900px) 14vw, 30vw"`;
  return `<img${clase ? ` class="${clase}"` : ""} ${fuente} width="640" height="640" alt="${esc(ALT[k][en ? 1 : 0])}"
    ${primera ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function fasesSeccion(en) {
  const T = en
    ? [["Flower", "Eight months before the cup, the tree blossoms white for three days."],
       ["Green fruit", "The bean forms inside. Seven months still to go."],
       ["Ripe cherry", "Picked by hand, one by one. Five kilos of cherry make one of parchment."],
       ["Pulping", "36 hours of fermentation, then 18 days drying on the marquee."],
       ["Dry parchment", "This is what we buy at the farm. This is where the yield factor is measured."],
       ["Green coffee", "Sixty kilos of parchment leave forty six. The rest is husk."],
       ["Roast", "It loses 17 % of its weight. What is left fills 153 bags."]]
    : [["Flor", "Ocho meses antes de la taza, el cafeto florece blanco durante tres días."],
       ["Fruto verde", "El grano se forma adentro. Todavía faltan siete meses."],
       ["Cereza madura", "Se recoge a mano, una por una. Cinco kilos de cereza hacen uno de pergamino."],
       ["Despulpado", "36 horas de fermentación y 18 días de secado en marquesina."],
       ["Pergamino seco", "Así lo compramos en la finca. Aquí se mide el factor de rendimiento."],
       ["Café verde", "Sesenta kilos de pergamino dejan cuarenta y seis. Lo demás es cáscara."],
       ["Tueste", "Pierde 17 % de su peso. Lo que queda llena 153 bolsas."]];

  /* solo la cereza se abre bajo el cursor: es la única que esconde algo */
  const pista = en ? "Move the cursor over it: the bean is already inside."
                   : "Pásale el cursor: el grano ya está adentro.";
  const piezas = PIEZAS.map((k, i) => `<figure class="pieza p${i + 1}" style="--esc:${ESCALA[k]}">
      <div class="pieza-art">${imgPieza(k, en, k === "tostado")}${k === "cereza" ? imgPieza("corte", en, false, "pieza-dentro") : ""}</div>
      <figcaption><span class="pieza-n">${i + 1} / ${PIEZAS.length}</span><b>${esc(T[i][0])}</b><span>${esc(T[i][1])}${k === "cereza" ? ` <i class="pista">${esc(pista)}</i>` : ""}</span></figcaption>
    </figure>`).join("");

  return `<section class="grano" aria-label="${en ? "Backwards from the bean to the flower" : "Del grano tostado hasta la flor"}">
    <div class="grano-marco">
      <div class="grano-cabeza">
        <p class="eyebrow">${en ? "The journey, backwards" : "El recorrido, al revés"}</p>
        <h2>${en ? "It starts with <em>the bean</em>" : "Empieza por <em>el grano</em>"}</h2>
        <p>${en ? "You begin with what you drink. Scroll, and the coffee takes back everything it had to lose."
                : "Empiezas por lo que te tomas. Al bajar, el café recupera todo lo que tuvo que perder."}</p>
      </div>
      <div class="grano-linea">${piezas}</div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------
   Dos cosas en el navegador, ninguna imprescindible:
   1. la luz del cursor, que deja ver la cereza por dentro;
   2. la inclinación, que hace que las piezas se lean con volumen.
   Ambas solo con mouse: en pantalla táctil no hay a dónde apuntar.
   ------------------------------------------------------------ */
function montarFases() {
  const linea = document.querySelector(".grano-linea");
  if (!linea || linea.dataset.montada) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  linea.dataset.montada = "1";

  const GIRO = 7;                       // grados; más que esto y parece un juguete
  let pedido = null, rx = 0, ry = 0, mx = 50, my = 50, radio = 0;

  function pintar() {
    pedido = null;
    linea.style.setProperty("--rx", rx.toFixed(2) + "deg");
    linea.style.setProperty("--ry", ry.toFixed(2) + "deg");
    linea.style.setProperty("--mx", mx.toFixed(1) + "%");
    linea.style.setProperty("--my", my.toFixed(1) + "%");
    linea.style.setProperty("--mr", radio.toFixed(0) + "px");
  }
  function pedir() { if (!pedido) pedido = requestAnimationFrame(pintar); }

  linea.addEventListener("pointermove", (e) => {
    const r = linea.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    rx = -(y - .5) * GIRO; ry = (x - .5) * GIRO;
    /* la luz se mide sobre la cereza, que es la que se abre por dentro */
    const c = linea.querySelector(".p3");
    if (c) {
      const rc = c.getBoundingClientRect();
      mx = ((e.clientX - rc.left) / rc.width) * 100;
      my = ((e.clientY - rc.top) / rc.height) * 100;
      radio = Math.round(Math.min(140, Math.max(44, rc.width * .5)));
    }
    linea.classList.add("sigue");
    pedir();
  });
  linea.addEventListener("pointerleave", () => {
    rx = ry = 0; radio = 0;
    linea.classList.remove("sigue");
    pedir();
  });
}

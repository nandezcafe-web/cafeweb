/* ============================================================
   DE LA CEREZA AL GRANO: la transformación, ligada al scroll.
   Cinco macros reales del mismo grano, con el mismo fondo y la misma luz,
   para que al encadenarlas se lea como una sola cosa que cambia.
   ============================================================ */

/* nombre del archivo, alto/ancho reales, y qué se ve (para lector de pantalla) */
const FOTOS = {
  cereza:    { alt_es: "Cereza de café madura, roja y brillante, con su rama y dos hojas",
               alt_en: "Ripe coffee cherry, glossy red, on its branch with two leaves" },
  abierta:   { alt_es: "Cereza abierta: la pulpa roja retirada deja ver los dos granos con mucílago",
               alt_en: "Cherry pulped open: the red skin peeled back over two beans in mucilage" },
  pergamino: { alt_es: "Granos secos dentro de su cáscara de pergamino, con hojuelas sueltas al lado",
               alt_en: "Dry beans inside their parchment husk, with loose flakes beside them" },
  verde:     { alt_es: "Dos granos de café verde ya trillados, con el surco y la película plateada",
               alt_en: "Two milled green coffee beans, centre crease and silverskin visible" },
  tostado:   { alt_es: "Dos granos tostados, café oscuro con brillo de aceite y el surco abierto",
               alt_en: "Two roasted beans, dark brown with an oily sheen and an open crease" },
};

function fotoFase(k, en, primera) {
  const f = FOTOS[k], base = `/img/fases/${k}`;
  /* la primera entra con la página; las demás esperan a que la persona baje */
  const carga = primera ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  /* en el archivo de un solo HTML las fotos viajan dentro, no hay de dónde pedirlas */
  const dentro = typeof FASES_EMBEBIDAS !== "undefined" && FASES_EMBEBIDAS[k];
  const fuente = dentro
    ? `src="${dentro}"`
    : `src="${base}.webp" srcset="${base}@0.5x.webp 600w, ${base}.webp 1200w" sizes="(min-width:900px) 340px, 44vw"`;
  return `<img ${fuente} width="1200" height="1200"
    alt="${esc(en ? f.alt_en : f.alt_es)}" ${carga} decoding="async">`;
}

/* La transformación contada con nuestros propios números */
function fasesSeccion(en) {
  const F = en
    ? [["cereza", "Cherry", "Picked ripe, one by one. Five kilos of cherry become one kilo of parchment."],
       ["abierta", "Pulping and fermentation", "36 hours of fermentation, then 18 days drying on the marquee."],
       ["pergamino", "Dry parchment", "This is what we buy at the farm, and what the yield factor measures."],
       ["verde", "Milled: green coffee", "Sixty kilos of parchment leave forty six of green coffee. The rest is husk."],
       ["tostado", "Roast", "It loses 17 % of its weight in the roaster. What is left fills 153 bags."]]
    : [["cereza", "Cereza", "Se recoge madura, una por una. Cinco kilos de cereza dan un kilo de pergamino."],
       ["abierta", "Despulpado y fermentación", "36 horas de fermentación y 18 días de secado en marquesina."],
       ["pergamino", "Pergamino seco", "Así lo compramos en la finca, y así se mide el factor de rendimiento."],
       ["verde", "Trilla: café verde", "Sesenta kilos de pergamino dejan cuarenta y seis de café verde. Lo demás es cáscara."],
       ["tostado", "Tueste", "Pierde 17 % de su peso en el tostador. Lo que queda llena 153 bolsas."]];
  return `<section class="fases" aria-label="${en ? "From cherry to roasted bean" : "De la cereza al grano tostado"}">
    <div class="fases-marco">
    <div class="fases-cabeza">
      <p class="eyebrow">${en ? "The journey" : "El recorrido"}</p>
      <h2>${en ? "One cherry, <em>four changes</em>" : "Una cereza, <em>cuatro cambios</em>"}</h2>
      <p>${en ? "Everything that happens between the branch and your cup, and what is lost on the way."
              : "Todo lo que pasa entre la rama y tu taza, y lo que se pierde por el camino."}</p>
    </div>
    <div class="fases-escena">
      ${F.map(([k, titulo, texto], i) => `<figure class="fase f${i + 1}">
        <div class="fase-art">${fotoFase(k, en, i === 0)}</div>
        <figcaption><span class="fase-n">${i + 1} / ${F.length}</span><b>${esc(titulo)}</b><span>${esc(texto)}</span></figcaption>
      </figure>`).join("")}
    </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------
   Profundidad: el grano se inclina hacia donde está el cursor y la foto
   se mueve un poco menos que su marco. Esa diferencia es la que hace que
   el ojo lea volumen en lugar de una lámina.
   Solo con mouse: en pantalla táctil no hay hacia dónde inclinarse.
   ------------------------------------------------------------ */
function montarFases() {
  const escena = document.querySelector(".fases-escena");
  if (!escena || escena.dataset.montada) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  escena.dataset.montada = "1";

  const GIRO = 8, DESLIZ = 14;            // grados de inclinación y px de parallax
  let pedido = null, rx = 0, ry = 0, px = 0, py = 0;

  function pintar() {
    pedido = null;
    escena.querySelectorAll(".fase-art").forEach((a) => {
      a.style.setProperty("--rx", rx.toFixed(2) + "deg");
      a.style.setProperty("--ry", ry.toFixed(2) + "deg");
      a.style.setProperty("--px", px.toFixed(1) + "px");
      a.style.setProperty("--py", py.toFixed(1) + "px");
    });
  }
  function mover(e) {
    const r = escena.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    rx = -y * GIRO; ry = x * GIRO; px = -x * DESLIZ; py = -y * DESLIZ;
    escena.classList.add("sigue");
    if (!pedido) pedido = requestAnimationFrame(pintar);
  }
  function soltar() {
    rx = ry = px = py = 0;
    escena.classList.remove("sigue");
    if (!pedido) pedido = requestAnimationFrame(pintar);
  }
  escena.addEventListener("pointermove", mover);
  escena.addEventListener("pointerleave", soltar);
}

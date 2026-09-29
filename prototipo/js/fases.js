/* ============================================================
   LA CEREZA DEL HERO.
   Un fruto sobre un disco de vidrio. Donde la persona pasa el cursor
   —o el dedo— la piel se vuelve transparente y aparece el corte real:
   pulpa, pergamino y los DOS granos verdes que trae cada cereza.
   El grano tostado no va aquí: el tueste pasa meses después, en la ciudad.
   ============================================================ */

function imgCapa(k, clase, alt, en, primera) {
  const base = `/img/grano/${k}`;
  const dentro = typeof GRANO_EMBEBIDO !== "undefined" && GRANO_EMBEBIDO[k];
  const fuente = dentro
    ? `src="${dentro}"`
    : `src="${base}.webp" srcset="${base}@0.5x.webp 320w, ${base}.webp 640w" sizes="(min-width:900px) 34vw, 62vw"`;
  return `<img class="${clase}" ${fuente} width="640" height="640" alt="${esc(alt[en ? 1 : 0])}"
    ${primera ? 'fetchpriority="high"' : 'aria-hidden="true"'} decoding="async">`;
}

/* De afuera hacia adentro. Los nombres técnicos son los que usa la Federación,
   y sirven para que esto se pueda citar. */
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

function heroCereza(en) {
  const capas = capasCereza(en).map(([nombre, tec, texto]) =>
    `<li><b>${esc(nombre)}</b>${tec ? `<i>${esc(tec)}</i>` : ""}<span>${esc(texto)}</span></li>`).join("");
  return `<figure class="cereza" data-cereza>
    <div class="cereza-lente">
      <span class="cereza-halo" aria-hidden="true"></span>
      <span class="cereza-vidrio" aria-hidden="true"></span>
      ${imgCapa("cereza", "cereza-piel", ["Cereza de café madura, roja y brillante",
                                          "Ripe coffee cherry, glossy red"], en, true)}
      ${imgCapa("capa-corte", "cereza-corte", ["Corte de la cereza: piel, pulpa, pergamino y los dos granos verdes",
                                               "Cherry in section: skin, pulp, parchment and the two green beans"], en, false)}
      <span class="cereza-aro" aria-hidden="true"></span>
    </div>
    <figcaption>
      <p class="cereza-pista"><span class="con-mouse">${en ? "Move the cursor over the cherry." : "Pasa el cursor por la cereza."}</span><span
        class="con-dedo">${en ? "Drag your finger over the cherry." : "Arrastra el dedo sobre la cereza."}</span>
        ${en ? "Every fruit carries two beans." : "Cada fruto trae dos granos."}</p>
      <button class="cereza-btn" type="button" aria-expanded="false" aria-controls="capas-cereza">${
        en ? "See the six layers" : "Ver las seis capas"}</button>
      <ol class="cereza-capas" id="capas-cereza" hidden>${capas}</ol>
    </figcaption>
  </figure>`;
}

/* ------------------------------------------------------------
   La lente sigue al puntero y no se interpola: tiene que pegarse al dedo.
   Lo único que abre y cierra con suavidad es el radio. El botón hace lo
   mismo sin puntero y además nombra las capas, para teclado y lectores.
   ------------------------------------------------------------ */
function montarCereza() {
  const fig = document.querySelector("[data-cereza]");
  if (!fig || fig.dataset.montada) return;
  fig.dataset.montada = "1";
  const lente = fig.querySelector(".cereza-lente");
  const lista = fig.querySelector(".cereza-capas");
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
    lente.classList.add("mirando");
    pedir();
  }
  lente.addEventListener("pointermove", seguir);
  lente.addEventListener("pointerdown", seguir);
  lente.addEventListener("pointerleave", () => {
    if (abierta) return;
    r = 0; lente.classList.remove("mirando"); pedir();
  });

  fig.querySelector(".cereza-btn").addEventListener("click", (e) => {
    abierta = !abierta;
    e.currentTarget.setAttribute("aria-expanded", String(abierta));
    lista.hidden = !abierta;
    x = y = 50; r = abierta ? 130 : 0;
    lente.classList.toggle("abierta", abierta);
    lente.classList.remove("mirando");
    pedir();
  });
}

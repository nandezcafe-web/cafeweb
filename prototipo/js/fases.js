/* ============================================================
   DE LA CEREZA AL GRANO: la transformación, ligada al scroll.
   Cada fase es un dibujo propio, así el respaldo puede ponerlas en fila
   cuando el navegador no sabe ligar animación y scroll.
   ============================================================ */
const GRANO = {
  cereza: `<svg viewBox="0 0 220 260" aria-hidden="true">
    <defs><radialGradient id="gCereza" cx=".35" cy=".3" r=".8">
      <stop offset="0" stop-color="#e2674a" stop-opacity=".9"/><stop offset="1" stop-color="#7d1f10" stop-opacity=".55"/></radialGradient></defs>
    <path d="M110 62c0-16 8-30 24-36" stroke="#5c7a4a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M134 26c14-8 30-4 36 6-10 13-28 16-40 7z" fill="#5c7a4a"/>
    <ellipse cx="110" cy="156" rx="80" ry="90" fill="#a8321f"/>
    <ellipse cx="110" cy="156" rx="80" ry="90" fill="url(#gCereza)"/>
    <ellipse cx="82" cy="120" rx="17" ry="25" fill="#fff" opacity=".2" transform="rotate(-18 82 120)"/></svg>`,

  abierta: `<svg viewBox="0 0 220 260" aria-hidden="true">
    <path d="M26 152c0-50 27-92 60-92v184c-33 0-60-42-60-92z" fill="#8f2a19"/>
    <path d="M194 152c0-50-27-92-60-92v184c33 0 60-42 60-92z" fill="#a8321f"/>
    <ellipse cx="110" cy="152" rx="45" ry="64" fill="#e7d7a8"/>
    <ellipse cx="110" cy="152" rx="45" ry="64" fill="#c9b27c" opacity=".3"/>
    <path d="M110 90c-14 26-14 98 0 124" stroke="#8a7550" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="88" cy="150" rx="9" ry="15" fill="#fff" opacity=".18"/></svg>`,

  pergamino: `<svg viewBox="0 0 220 260" aria-hidden="true">
    <defs><radialGradient id="gPerg" cx=".35" cy=".28" r=".85">
      <stop offset="0" stop-color="#f0e4bf" stop-opacity=".85"/><stop offset="1" stop-color="#b9a472" stop-opacity=".5"/></radialGradient></defs>
    <ellipse cx="110" cy="152" rx="65" ry="88" fill="#d8c79a"/>
    <ellipse cx="110" cy="152" rx="65" ry="88" fill="url(#gPerg)"/>
    <path d="M110 70c-16 30-16 134 0 164" stroke="#a8925f" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M64 100c8 34 8 72 0 104M156 100c-8 34-8 72 0 104" stroke="#c0ab78" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,

  verde: `<svg viewBox="0 0 220 260" aria-hidden="true">
    <defs><radialGradient id="gVerde" cx=".34" cy=".28" r=".85">
      <stop offset="0" stop-color="#a9b78c" stop-opacity=".9"/><stop offset="1" stop-color="#5f6c48" stop-opacity=".55"/></radialGradient></defs>
    <ellipse cx="110" cy="152" rx="59" ry="82" fill="#7f8f63"/>
    <ellipse cx="110" cy="152" rx="59" ry="82" fill="url(#gVerde)"/>
    <path d="M110 76c-18 28-18 124 0 152" stroke="#4f5c3c" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M94 100c-10 32-10 72 0 104" stroke="#9aa87e" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></svg>`,

  tostado: `<svg viewBox="0 0 220 260" aria-hidden="true">
    <defs><radialGradient id="gTos" cx=".34" cy=".26" r=".85">
      <stop offset="0" stop-color="#7c4a2e" stop-opacity=".95"/><stop offset="1" stop-color="#2a1610" stop-opacity=".7"/></radialGradient></defs>
    <path d="M150 54c10-10 2-20 10-30M170 60c8-8 2-16 8-24" stroke="#c9b27c" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>
    <ellipse cx="110" cy="154" rx="57" ry="79" fill="#3f2216"/>
    <ellipse cx="110" cy="154" rx="57" ry="79" fill="url(#gTos)"/>
    <path d="M110 82c-20 26-20 118 0 144" stroke="#1d0f09" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M92 106c-10 30-10 64 0 94" stroke="#7a4a30" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></svg>`,
};

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
    <div class="fases-cabeza">
      <p class="eyebrow">${en ? "The journey" : "El recorrido"}</p>
      <h2>${en ? "One cherry, <em>four changes</em>" : "Una cereza, <em>cuatro cambios</em>"}</h2>
      <p>${en ? "Everything that happens between the branch and your cup, and what is lost on the way."
              : "Todo lo que pasa entre la rama y tu taza, y lo que se pierde por el camino."}</p>
    </div>
    <div class="fases-escena">
      ${F.map(([k, titulo, texto], i) => `<figure class="fase f${i + 1}">
        <div class="fase-art">${GRANO[k]}</div>
        <figcaption><span class="fase-n">${i + 1} / ${F.length}</span><b>${esc(titulo)}</b><span>${esc(texto)}</span></figcaption>
      </figure>`).join("")}
    </div>
  </section>`;
}

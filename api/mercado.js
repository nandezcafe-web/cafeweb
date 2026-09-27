/* Referencias del día para el panel: precio interno de la FNC, bolsa de Nueva York,
   tasa de cambio que usó la FNC y TRM oficial del Banco de la República.
   - FNC: se lee de su página de inicio (no publica un servicio de datos). Si cambian
     el diseño de la página, esta lectura falla y el panel sigue con la carga manual.
   - TRM: servicio abierto de datos.gov.co (Superfinanciera).
   La respuesta se guarda 30 minutos en el borde de Vercel para no consultar a cada rato. */
const FNC_URL = "https://federaciondecafeteros.org/";
const TRM_URL = "https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC";

/* "2.105.000" → 2105000 · "278,60" → 278.6 · "3.312" → 3312 */
const numeroCO = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", "."));

function leerFNC(html) {
  const texto = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const carga = texto.match(/Precio interno de referencia:\s*\$\s*([\d.]+)/i);
  const fecha = texto.match(/Fecha:\s*(\d{4}-\d{2}-\d{2})\s*Precio interno/i);
  const ny = texto.match(/Bolsa de NY:\s*\$?\s*([\d.,]+)/i);
  const tasa = texto.match(/Tasa de cambio:\s*\$?\s*([\d.,]+)/i);
  const r = {
    precioCarga: carga ? numeroCO(carga[1]) : null,
    fecha: fecha ? fecha[1] : null,
    ny: ny ? numeroCO(ny[1]) : null,
    tasaFnc: tasa ? numeroCO(tasa[1]) : null,
  };
  /* números fuera de rango = la página cambió: mejor no dar un dato malo */
  if (!(r.precioCarga > 500000 && r.precioCarga < 10000000)) r.precioCarga = null;
  if (!(r.ny > 50 && r.ny < 1500)) r.ny = null;
  if (!(r.tasaFnc > 1500 && r.tasaFnc < 10000)) r.tasaFnc = null;
  return r;
}

async function conTiempo(url, ms = 8000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { signal: c.signal, headers: { "User-Agent": "Mozilla/5.0 (NandezCafe panel)" } }); }
  finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");          // el panel vive en otro dominio
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  const [fnc, trm] = await Promise.allSettled([
    conTiempo(FNC_URL).then((r) => (r.ok ? r.text() : Promise.reject(new Error("FNC " + r.status)))).then(leerFNC),
    conTiempo(TRM_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error("TRM " + r.status)))),
  ]);

  const f = fnc.status === "fulfilled" ? fnc.value : {};
  const t = trm.status === "fulfilled" && trm.value[0] ? trm.value[0] : null;
  const datos = {
    precioCarga: f.precioCarga ?? null, fecha: f.fecha ?? null, ny: f.ny ?? null, tasaFnc: f.tasaFnc ?? null,
    trm: t ? Math.round(parseFloat(t.valor) * 100) / 100 : null, trmFecha: t ? String(t.vigenciadesde).slice(0, 10) : null,
    leido: new Date().toISOString(),
    fuentes: { fnc: FNC_URL, trm: "datos.gov.co · Superintendencia Financiera" },
    errores: [fnc, trm].filter((x) => x.status === "rejected").map((x) => String(x.reason?.message || x.reason)),
  };
  if (datos.precioCarga == null && datos.trm == null) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ ...datos, error: "No se pudo leer ninguna fuente" });
  }
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
  res.status(200).json(datos);
}

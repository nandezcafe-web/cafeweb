/* Quién entra al panel interno.

     node tools/clave.js "la contraseña" correo@dominio.com [etiqueta]
     node tools/clave.js --quitar <etiqueta>
     node tools/clave.js --lista

   Agregar y cambiar son lo mismo: si ese correo ya tenía cuenta, se le pone la
   contraseña nueva; si no, se crea. Cada cuenta lleva su propia sal.

   En el repositorio nunca queda ni la contraseña ni el correo: solo la huella
   del correo (sha256, primeros 32) y el verificador PBKDF2 de la contraseña.
   Por eso --lista muestra etiquetas, no correos: una vez guardado, el correo
   ya no se puede leer de vuelta.

   Escribe en prototipo/js/admin.js (AUTH) y vuelve a armar el sitio; después
   falta hacer commit y subir para que aplique en el panel publicado. */
const c = require("crypto"), fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const VUELTAS = 310000, MIN = 10;
const ARCHIVO = path.join(__dirname, "..", "prototipo", "js", "admin.js");
const BLOQUE = /(\n  cuentas: \[\n)([\s\S]*?)(  \],\n)/;

const salir = (msg) => { console.error(msg); process.exit(1); };
const leer = () => {
  const js = fs.readFileSync(ARCHIVO, "utf8"), m = js.match(BLOQUE);
  if (!m) salir(`No encontré "cuentas" dentro de AUTH en ${ARCHIVO}.`);
  const cuentas = [...m[2].matchAll(/\{ etiqueta: "([^"]*)", correo: "([0-9a-f]+)", sal: "([0-9a-f]+)", clave: "([0-9a-f]+)" \}/g)]
    .map(([, etiqueta, correo, sal, clave]) => ({ etiqueta, correo, sal, clave }));
  return { js, cuentas };
};
const guardar = (js, cuentas) => {
  const filas = cuentas.map((x) => `    { etiqueta: "${x.etiqueta}", correo: "${x.correo}", sal: "${x.sal}", clave: "${x.clave}" },\n`).join("");
  fs.writeFileSync(ARCHIVO, js.replace(BLOQUE, `$1${filas}$3`));
  execFileSync(process.execPath, [path.join(__dirname, "build.js")], { stdio: "inherit" });
};
const huella = (correo) => c.createHash("sha256").update(correo).digest("hex").slice(0, 32);

const [arg1, arg2, arg3] = process.argv.slice(2);

if (arg1 === "--lista") {
  const { cuentas } = leer();
  console.log(cuentas.length ? `Entran al panel ${cuentas.length} ${cuentas.length === 1 ? "cuenta" : "cuentas"}:` : "No hay ninguna cuenta: nadie puede entrar al panel.");
  cuentas.forEach((x) => console.log("  · " + x.etiqueta));
  process.exit(0);
}

if (arg1 === "--quitar") {
  if (!arg2) salir('Uso: node tools/clave.js --quitar <etiqueta>   (mira cuáles hay con --lista)');
  const { js, cuentas } = leer();
  const quedan = cuentas.filter((x) => x.etiqueta !== arg2);
  if (quedan.length === cuentas.length) salir(`No hay ninguna cuenta con la etiqueta "${arg2}". Mira cuáles hay con --lista.`);
  /* Sin cuentas no entraría nadie y habría que editar el archivo a mano */
  if (!quedan.length) salir("Esa es la única cuenta que queda. Agrega otra antes de quitarla, o nadie podrá entrar.");
  guardar(js, quedan);
  console.log(`\nListo. "${arg2}" ya no entra al panel. Quedan: ${quedan.map((x) => x.etiqueta).join(", ")}.`);
  console.log("Falta hacer commit y subir para que aplique en el panel publicado.");
  process.exit(0);
}

const clave = arg1, correo = (arg2 || "nandezcafe@gmail.com").trim().toLowerCase();
if (!clave || clave.startsWith("--")) salir('Uso: node tools/clave.js "la contraseña" correo@dominio.com [etiqueta]\n     node tools/clave.js --quitar <etiqueta>\n     node tools/clave.js --lista');
if (clave.length < MIN) salir(`Usa una contraseña de al menos ${MIN} caracteres.`);
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) salir(`"${correo}" no parece un correo.`);

const { js, cuentas } = leer();
const sal = c.randomBytes(16);
const nueva = { etiqueta: (arg3 || correo.split("@")[0]).replace(/[^A-Za-z0-9._-]/g, "") || "cuenta",
  correo: huella(correo), sal: sal.toString("hex"), clave: c.pbkdf2Sync(clave, sal, VUELTAS, 32, "sha256").toString("hex") };

/* Un mismo correo no puede tener dos cuentas: la nueva reemplaza la vieja */
const i = cuentas.findIndex((x) => x.correo === nueva.correo);
const choca = cuentas.some((x, j) => j !== i && x.etiqueta === nueva.etiqueta);
if (choca) salir(`Ya hay otra cuenta con la etiqueta "${nueva.etiqueta}". Pon otra como tercer argumento.`);
if (i >= 0) { nueva.etiqueta = arg3 ? nueva.etiqueta : cuentas[i].etiqueta; cuentas[i] = nueva; }
else cuentas.push(nueva);

guardar(js, cuentas);
console.log(`\nListo. ${i >= 0 ? "Contraseña nueva para" : "Cuenta nueva:"} ${correo} (etiqueta "${nueva.etiqueta}").`);
console.log(`Entran al panel: ${cuentas.map((x) => x.etiqueta).join(", ")}.`);
console.log("Falta hacer commit y subir para que aplique en el panel publicado.");

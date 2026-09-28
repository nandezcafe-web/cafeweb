/* Cambia la contraseña del panel:  node tools/clave.js "nueva clave" [correo]
   Escribe el verificador en prototipo/js/admin.js (AUTH) y vuelve a armar el sitio.
   La contraseña nunca queda guardada: solo un verificador PBKDF2 con sal aleatoria. */
const c = require("crypto"), fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const clave = process.argv[2], correo = (process.argv[3] || "nandezcafe@gmail.com").trim().toLowerCase();
if (!clave) { console.error('Uso: node tools/clave.js "nueva clave" [correo]'); process.exit(1); }
if (clave.length < 10) { console.error("Usa una contraseña de al menos 10 caracteres."); process.exit(1); }

const sal = c.randomBytes(16);
const nuevo = {
  correo: c.createHash("sha256").update(correo).digest("hex").slice(0, 32),
  sal: sal.toString("hex"),
  clave: c.pbkdf2Sync(clave, sal, 310000, 32, "sha256").toString("hex"),
};

const archivo = path.join(__dirname, "..", "prototipo", "js", "admin.js");
let js = fs.readFileSync(archivo, "utf8");
for (const k of ["correo", "sal", "clave"]) {
  const re = new RegExp(`(\\n  ${k}: ")[0-9a-f]+(")`);
  if (!re.test(js)) { console.error(`No encontré "${k}" dentro de AUTH en ${archivo}.`); process.exit(1); }
  js = js.replace(re, `$1${nuevo[k]}$2`);
}
fs.writeFileSync(archivo, js);
execFileSync(process.execPath, [path.join(__dirname, "build.js")], { stdio: "inherit" });
console.log(`\nListo. El panel ahora entra con ${correo} y la contraseña nueva.`);

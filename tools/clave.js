/* Genera el verificador para la contraseña del panel:  node tools/clave.js "nueva clave" [correo] */
const c = require("crypto");
const clave = process.argv[2], correo = (process.argv[3] || "nandezcafe@gmail.com").trim().toLowerCase();
if (!clave) { console.error('Uso: node tools/clave.js "nueva clave" [correo]'); process.exit(1); }
const sal = c.randomBytes(16);
console.log("Pega esto en prototipo/js/admin.js, en AUTH:\n");
console.log(`  correo: "${c.createHash("sha256").update(correo).digest("hex").slice(0, 32)}",`);
console.log(`  sal: "${sal.toString("hex")}",`);
console.log(`  clave: "${c.pbkdf2Sync(clave, sal, 310000, 32, "sha256").toString("hex")}",`);
console.log("\nDespués: node tools/build.js");

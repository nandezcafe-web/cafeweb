/* Servidor estático mínimo para desarrollo: node tools/serve.js prototipo 5174 */
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(process.argv[2] || "."), port = +process.argv[3] || 5174;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  const candidatos = [file, file + ".html", path.join(file, "index.html")];   // cleanUrls, como Vercel
  const real = candidatos.find((f) => { try { return fs.statSync(f).isFile(); } catch { return false; } }) || file;
  fs.readFile(real, (err, data) => {
    if (err) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": types[path.extname(real) || ".html"] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(port, () => console.log("sirviendo " + root + " en http://localhost:" + port));

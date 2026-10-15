const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../js/worker-dashboard.js"), "utf8");
const start = source.indexOf("function obtenerThumbnailSegura(");
const end = source.indexOf("\nlet solicitudMisCursos", start);
const ctx = vm.createContext({ URL, window: { location: { href: "https://cicsa.test/trabajador/dashboard.html" } },
  escaparHtml: value => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") });
vm.runInContext(source.slice(start, end), ctx);
const thumbnail = ctx.obtenerThumbnailSegura;
for (const mime of ["png", "jpeg", "webp", "gif", "avif", "svg+xml"]) {
  const image = `data:image/${mime};base64,YWJj`;
  assert.equal(thumbnail(image), image, `Uploaded ${mime} cover must not become the default cover`);
}
assert.equal(thumbnail("../assets/incendios.jpg"), "../assets/incendios.jpg");
assert.equal(thumbnail("https://cicsa.test/cover.jpg"), "https://cicsa.test/cover.jpg");
assert.equal(thumbnail('https://cicsa.test/cover.jpg?a=1&b=2'), 'https://cicsa.test/cover.jpg?a=1&amp;b=2');
for (const value of ["", null, "javascript:alert(1)", "data:text/html;base64,YWJj", "data:video/mp4;base64,YWJj", "idb:media:missing"]) {
  assert.equal(thumbnail(value), "../assets/soldador.avif");
}
console.log("OK: uploaded image covers, existing paths and unsafe URL rejection.");

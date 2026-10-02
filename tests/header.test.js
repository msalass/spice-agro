"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { syncHeaders } = require("../scripts/sync-header.js");
const header = require("../assets/js/site-header.js");

const ROOT = path.resolve(__dirname, "..");
const PARTIAL = fs.readFileSync(path.join(ROOT, "partials", "site-header.html"), "utf8").replace(/\s+$/, "");

function pages() {
  const result = syncHeaders({ check: true, root: ROOT });
  return result.files.map(function (rel) { return path.join(ROOT, rel); });
}

function headerBlock(html) {
  const m = html.match(/<!-- SITE-HEADER:START -->[\s\S]*?<!-- SITE-HEADER:END -->/);
  assert.ok(m, "falta el header marcado");
  return m[0];
}

const htmlFiles = pages();

describe("header único", function () {
  it("está sincronizado en todas las páginas HTML", function () {
    const result = syncHeaders({ check: true, root: ROOT });
    assert.deepStrictEqual(result.dirty, []);
    assert.ok(result.files.length >= 20);
  });

  it("el markup del header es idéntico en cada página", function () {
    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, "utf8");
      assert.strictEqual(headerBlock(html), PARTIAL, path.relative(ROOT, file));
      assert.ok(html.includes('href="/assets/css/site-header.css"'), file);
      assert.ok(html.includes('src="/assets/js/site-header.js"'), file);
    }
  });

  it("el orden del menú y el CTA son los pedidos", function () {
    const labels = [
      "Academia",
      "Huerto Rentable",
      "HR35 · Parte",
      "HR55 · Produce",
      "SPICe Partner",
      "Herramientas",
      "La ciencia",
      "Huerto",
      "SPICe Lab ↗",
      "Análisis de suelo ›"
    ];
    let from = 0;
    for (const label of labels) {
      const at = PARTIAL.indexOf(label, from);
      assert.ok(at > from, "falta o está fuera de orden: " + label);
      from = at + label.length;
    }
    assert.match(PARTIAL, /<a href="\/academia\.html">Academia<\/a>/);
    assert.match(PARTIAL, /<a href="\/huerto-rentable\.html" id="hr-nav-link"/);
    assert.match(PARTIAL, /<a href="\/huerto-rentable-35\.html">HR35 · Parte<\/a>/);
    assert.match(PARTIAL, /<a href="\/huerto-rentable-55\.html">HR55 · Produce<\/a>/);
    assert.match(PARTIAL, /<a href="\/spice-partner\.html">SPICe Partner<\/a>/);
    assert.match(PARTIAL, /<a href="\/herramientas\.html">Herramientas<\/a>/);
    assert.match(PARTIAL, /<a href="\/la-ciencia\.html">La ciencia<\/a>/);
    assert.match(PARTIAL, /<a href="https:\/\/huerto\.spicelab\.cl">Huerto<\/a>/);
    assert.match(PARTIAL, /<a class="sh-ext" href="https:\/\/www\.spicelab\.cl" target="_blank" rel="noopener">SPICe Lab ↗<\/a>/);
    assert.match(PARTIAL, /<a class="sh-cta" href="\/analisis-de-suelo\.html">Análisis de suelo ›<\/a>/);
    const cta = PARTIAL.match(/<a class="sh-cta"[^>]*>[^<]+<\/a>/)[0];
    assert.doesNotMatch(cta, /\$|CLP|000|precio/i);
  });

  it("el dropdown trae el markup accesible", function () {
    assert.match(PARTIAL, /id="hr-nav-link"[^>]*aria-haspopup="true"/);
    assert.match(PARTIAL, /aria-expanded="false"/);
    assert.match(PARTIAL, /aria-controls="hr-nav-menu"/);
    assert.match(PARTIAL, /id="hr-nav-menu"/);
    assert.match(PARTIAL, /aria-controls="site-nav-menu"/);
    assert.match(PARTIAL, /aria-label="Abrir menú"/);
    const css = fs.readFileSync(path.join(ROOT, "assets/css/site-header.css"), "utf8");
    assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)/);
    assert.match(css, /\.sh-dd:hover>\.sh-dd-menu/);
    assert.match(css, /\.sh-dd:focus-within>\.sh-dd-menu/);
    assert.match(css, /\.sh-dd\.is-open>\.sh-dd-menu/);
    assert.match(css, /\.sh-dd\.is-dismissed>\.sh-dd-menu/);
  });
});

describe("dropdown Huerto Rentable", function () {
  it("en escritorio el clic del enlace padre navega", function () {
    const r = header.onParentClick(false, false);
    assert.strictEqual(r.navigate, true);
    assert.strictEqual(r.preventDefault, false);
  });

  it("en touch el primer toque abre y no navega", function () {
    const r = header.onParentClick(true, false);
    assert.strictEqual(r.navigate, false);
    assert.strictEqual(r.preventDefault, true);
    assert.strictEqual(r.open, true);
  });

  it("en touch el segundo toque navega", function () {
    const r = header.onParentClick(true, true);
    assert.strictEqual(r.navigate, true);
    assert.strictEqual(r.preventDefault, false);
  });

  it("detecta layout estrecho o puntero táctil", function () {
    assert.strictEqual(header.isTapMode(function () { return false; }), false);
    assert.strictEqual(header.isTapMode(function (q) { return q === header.NARROW; }), true);
    assert.strictEqual(header.isTapMode(function (q) { return q === header.COARSE; }), true);
  });

  it("el script cierra con Escape y con toque afuera", function () {
    const js = fs.readFileSync(path.join(ROOT, "assets/js/site-header.js"), "utf8");
    assert.match(js, /e\.key !== "Escape"/);
    assert.match(js, /is-dismissed/);
    assert.match(js, /pointerdown/);
    assert.match(js, /aria-expanded/);
  });
});

describe("preventa y checkout", function () {
  it("no toca crear-pago, lista10 ni mp-webhook", function () {
    const crear = fs.readFileSync(path.join(ROOT, "netlify/functions/crear-pago.js"), "utf8");
    const lista = fs.readFileSync(path.join(ROOT, "netlify/functions/lista10.js"), "utf8");
    const hook = fs.readFileSync(path.join(ROOT, "netlify/functions/mp-webhook.js"), "utf8");
    assert.match(crear, /const price = isLista \? 71100 : 79000;/);
    assert.match(lista, /const price = isLista \? 71100 : 79000;/);
    assert.match(hook, /pay\.transaction_amount \|\| 79000/);
    assert.match(hook, /14 de septiembre/);
  });

  it("deja la preventa de academia, gracias y curso al PR #7", function () {
    const academia = fs.readFileSync(path.join(ROOT, "academia.html"), "utf8");
    const gracias = fs.readFileSync(path.join(ROOT, "gracias-academia.html"), "utf8");
    const curso = fs.readFileSync(path.join(ROOT, "curso/index.html"), "utf8");
    assert.match(academia, /79\.000/);
    assert.match(academia, /preventa/i);
    assert.match(academia, /14 de septiembre/);
    assert.match(gracias, /preventa/i);
    assert.match(gracias, /79000/);
    assert.match(curso, /14 de septiembre/);
  });

  it("quita el candado del 14 de septiembre en el módulo 1", function () {
    const mod = fs.readFileSync(path.join(ROOT, "curso/modulo-1.html"), "utf8");
    assert.doesNotMatch(mod, /14 de septiembre|14-sep|2026-09-14|79\.000|79000|preventa/i);
  });
});

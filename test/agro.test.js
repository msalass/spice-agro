"use strict";
// Repo-specific checks for agro.spicelab.cl. The package tests stay in the other files.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const chat = require("../netlify/functions/chat.js");
const I = chat._internal;

function htmlFiles(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === "live-test" || e.name === "qr") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

test("cada HTML público carga /spice-widget.js con data-site=agro", () => {
  const files = htmlFiles(ROOT);
  assert.equal(files.length, 23, files.map((f) => path.relative(ROOT, f)).join(", "));
  const tag = '<script src="/spice-widget.js" defer data-site="agro"></script>';
  for (const f of files) {
    const html = fs.readFileSync(f, "utf8");
    const n = html.split(tag).length - 1;
    assert.equal(n, 1, path.relative(ROOT, f));
    assert.ok(html.indexOf(tag) < html.lastIndexOf("</body>"), path.relative(ROOT, f));
  }
});

test("widget: panel cerrado no captura toques, y el launcher evita .wa y Solicitar propuesta", () => {
  const w = fs.readFileSync(path.join(ROOT, "spice-widget.js"), "utf8");
  const css = w.slice(w.indexOf(".launcher,.panel"), w.indexOf("@media (max-width:640px)"));
  assert.ok(css.includes(".panel[hidden]{display:none !important;}"));
  assert.ok(w.includes("a.whatsapp-float, a.wa"));
  assert.ok(w.includes("#analisis-short-form button[type='submit']"));
});

test("resolveSite: el host de spice-agro es agro si SITE_ID no es un sitio conocido", () => {
  const prev = process.env.SITE_ID;
  delete process.env.SITE_ID;
  try {
    assert.equal(
      I.resolveSite("https://deploy-preview-8--spice-agro.netlify.app", "", "deploy-preview-8--spice-agro.netlify.app"),
      "agro"
    );
    assert.equal(I.resolveSite("", "", "agro.spicelab.cl"), "agro");
    assert.equal(I.resolveSite(""), "spicelab");
    process.env.SITE_ID = "bogus";
    assert.equal(I.resolveSite("", "", "deploy-preview-8--spice-agro.netlify.app"), "agro");
    process.env.SITE_ID = "huerto";
    assert.equal(I.resolveSite("", "", "deploy-preview-8--spice-agro.netlify.app"), "huerto");
    process.env.SITE_ID = "agro";
    assert.equal(I.resolveSite(""), "agro");
  } finally {
    if (prev == null) delete process.env.SITE_ID;
    else process.env.SITE_ID = prev;
  }
});

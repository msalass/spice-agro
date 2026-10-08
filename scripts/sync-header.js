#!/usr/bin/env node
/**
 * Copia partials/site-header.html a cada página HTML.
 *   node scripts/sync-header.js         escribe
 *   node scripts/sync-header.js --check falla si alguna página se desvía
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PARTIAL = path.join(ROOT, "partials", "site-header.html");
const CSS_TAG = '<link rel="stylesheet" href="/assets/css/site-header.css">';
const JS_TAG = '<script src="/assets/js/site-header.js?v=20261008e" defer></script>';
const MARKER = /<!-- SITE-HEADER:START -->[\s\S]*?<!-- SITE-HEADER:END -->/;

function walkHtml(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkHtml(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

function block() {
  return fs.readFileSync(PARTIAL, "utf8").replace(/\s+$/, "") + "\n";
}

function ensureAssets(html) {
  if (!html.includes("/assets/css/site-header.css")) {
    html = html.replace("</head>", "  " + CSS_TAG + "\n</head>");
  }
  if (html.includes("/assets/js/site-header.js")) {
    html = html.replace(
      /<script src="\/assets\/js\/site-header\.js(?:\?[^"]*)?" defer><\/script>/g,
      JS_TAG
    );
  } else {
    html = html.replace("</head>", "  " + JS_TAG + "\n</head>");
  }
  return html;
}

function stripLegacyHeroNav(html) {
  return html.replace(
    /(<header class="hero">\s*<div class="wrap">\s*)<nav>[\s\S]*?<\/nav>\s*/,
    "$1"
  );
}

function upsertHeader(html, snippet) {
  html = html.replace(/<!-- HEADER -->\s*(?=<header id="top">)/, "");
  if (MARKER.test(html)) return html.replace(MARKER, snippet.trimEnd());
  if (/<header id="top">/.test(html)) {
    return html.replace(/<header id="top">[\s\S]*?<\/header>/, snippet.trimEnd());
  }
  const gtm = /<body[^>]*>\s*<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/;
  if (gtm.test(html)) return html.replace(gtm, function (m) { return m + "\n" + snippet.trimEnd(); });
  return html.replace(/<body[^>]*>/, function (m) { return m + "\n" + snippet.trimEnd(); });
}

function syncHeaders(options) {
  const check = !!(options && options.check);
  const root = (options && options.root) || ROOT;
  const files = walkHtml(root, []).filter(function (file) {
    return !file.includes(path.sep + "partials" + path.sep);
  });
  const snippet = block();
  const dirty = [];
  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    let next = ensureAssets(before);
    next = stripLegacyHeroNav(next);
    next = upsertHeader(next, snippet);
    if (next !== before) {
      dirty.push(path.relative(root, file));
      if (!check) fs.writeFileSync(file, next);
    }
  }
  return { files: files.map(function (f) { return path.relative(root, f); }), dirty: dirty };
}

if (require.main === module) {
  const check = process.argv.includes("--check");
  const result = syncHeaders({ check: check, root: ROOT });
  if (check) {
    if (result.dirty.length) {
      console.error("Header desactualizado en:\n" + result.dirty.join("\n"));
      process.exit(1);
    }
    console.log("Header idéntico en " + result.files.length + " páginas.");
  } else {
    console.log(result.dirty.length
      ? "Actualizadas " + result.dirty.length + " páginas:\n" + result.dirty.join("\n")
      : "Nada que actualizar (" + result.files.length + " páginas).");
  }
}

module.exports = { syncHeaders, walkHtml };

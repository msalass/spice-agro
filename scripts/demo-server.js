#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { handler } = require("../netlify/functions/chat");

const ROOT = path.join(__dirname, "..");
// agro.spicelab.cl publishes the repo root (netlify.toml publish = ".").
const PUBLIC = ROOT;
const PORT = Number(process.env.PORT) || 8888;

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] == null || process.env[k] === "") process.env[k] = v;
  }
}

loadEnv();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePublicPath(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (clean.includes("\0")) return null;
  const rel = clean === "/" ? "index.html" : clean.replace(/^\/+/, "");
  if (rel.split("/").some(function (part) {
    return part === ".git" || part === "node_modules" || part === ".netlify" || part === ".env" || part.startsWith(".");
  })) return null;
  const abs = path.normalize(path.join(PUBLIC, rel));
  if (!abs.startsWith(PUBLIC + path.sep) && abs !== PUBLIC) return null;
  return abs;
}

function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/") urlPath = "/index.html";
  const abs = safePublicPath(urlPath);
  if (!abs) {
    send(res, 400, { "Content-Type": "text/plain" }, "Bad path");
    return;
  }
  fs.readFile(abs, function (err, data) {
    if (err) {
      send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    send(res, 200, { "Content-Type": MIME[ext] || "application/octet-stream" }, data);
  });
}

function collectBody(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let n = 0;
    req.on("data", function (c) {
      n += c.length;
      if (n > 200000) {
        reject(new Error("too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", function () {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

async function serveFunction(req, res) {
  const origin = req.headers.origin || "http://localhost:" + PORT;
  let body = "";
  if (req.method === "POST") {
    try {
      body = await collectBody(req);
    } catch (e) {
      send(res, 413, { "Content-Type": "application/json" }, JSON.stringify({ error: "too_large", message: "Cuerpo demasiado grande." }));
      return;
    }
  }
  const headers = {};
  for (const k of Object.keys(req.headers)) headers[k] = req.headers[k];
  if (!headers["x-forwarded-for"]) {
    headers["x-forwarded-for"] = req.socket.remoteAddress || "127.0.0.1";
  }
  const event = {
    httpMethod: req.method,
    headers: headers,
    body: body,
    isBase64Encoded: false,
  };
  try {
    const out = await handler(event);
    const h = Object.assign({ "Content-Type": "application/json; charset=utf-8" }, out.headers || {});
    send(res, out.statusCode || 200, h, out.body == null ? "" : out.body);
  } catch (err) {
    console.error("demo function error", err);
    send(res, 500, { "Content-Type": "application/json; charset=utf-8" }, JSON.stringify({ error: "server", message: "Error interno del demo." }));
  }
}

const server = http.createServer(function (req, res) {
  const urlPath = (req.url || "/").split("?")[0];
  if (urlPath === "/.netlify/functions/chat" || urlPath === "/.netlify/functions/chat/") {
    serveFunction(req, res);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, { "Content-Type": "text/plain" }, "Method not allowed");
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", function () {
  const key = Boolean((process.env.OPENAI_API_KEY || "").trim());
  console.log("SPICe Lab chat — demo local");
  console.log("  Widget:   http://localhost:" + PORT + "/");
  console.log("  Function: POST http://localhost:" + PORT + "/.netlify/functions/chat");
  console.log("  API key:  " + (key ? "cargada" : "AUSENTE — el widget mostrara 'aun no esta activo' y derivara a WhatsApp"));
});

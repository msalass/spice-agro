"use strict";
// El formulario HR35 tiene que quedar en el HTML estático (Netlify lo detecta
// en el deploy) y el POST no puede caer en un redirect que lo convierta en 404.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const PAGE = fs.readFileSync(path.join(ROOT, "huerto-rentable-35.html"), "utf8");
const THANKS = fs.readFileSync(path.join(ROOT, "gracias-hr35.html"), "utf8");
const TOML = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function formHtml() {
  const visible = stripComments(PAGE);
  const m = visible.match(/<form\b[\s\S]*?<\/form>/);
  assert.ok(m, "el formulario hr35 tiene que estar en el HTML, fuera de comentarios");
  return m[0];
}

test("el formulario hr35 es HTML estático detectable por Netlify", () => {
  const form = formHtml();
  assert.match(form, /<form\b[^>]*\bname="hr35"/);
  assert.match(form, /\bmethod="POST"/);
  assert.match(form, /\baction="\/gracias-hr35\.html"/);
  assert.match(form, /\bdata-netlify="true"/);
  assert.match(form, /\bnetlify-honeypot="bot-field"/);
  assert.match(form, /name="form-name"[^>]*value="hr35"/);
  assert.match(form, /name="bot-field"/);
  assert.doesNotMatch(form, /onsubmit/i);
  assert.doesNotMatch(form, /formsubmit\.co/);
  assert.doesNotMatch(form, /consentimiento/);
  for (const name of [
    "interes",
    "Etapa",
    "Nombre",
    "Correo",
    "Telefono",
    "Comuna",
    "Superficie",
    "Mensaje",
    "gclid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content"
  ]) {
    assert.match(form, new RegExp("name=\"" + name + "\""), name);
  }
  const order = ["interes", "Etapa", "Nombre", "Correo", "Telefono", "Comuna", "Superficie", "Mensaje"];
  let cursor = -1;
  for (const name of order) {
    const at = form.indexOf('name="' + name + '"');
    assert.ok(at > cursor, "orden: " + name);
    cursor = at;
  }
  assert.match(form, /<option value="Huerto Rentable 35" selected>/);
  assert.match(form, /value="Huerto Rentable 55"/);
  assert.match(form, /value="Academia"/);
  assert.match(form, /value="Análisis de suelo"/);
  assert.match(form, /name="Etapa" value="Estoy explorando opciones" checked/);
  assert.match(form, /value="Quiero una propuesta"/);
  assert.match(form, /value="Ya cultivo y quiero ordenar mi producción"/);
  assert.match(form, /placeholder="Tu nombre"[^>]*required/);
  assert.match(form, /type="email" name="Correo"[^>]*required|name="Correo"[^>]*type="email"[^>]*required|type="email"[^>]*required[^>]*name="Correo"/);
  const correo = /<input\b[^>]*name="Correo"[^>]*>/.exec(form)[0];
  assert.match(correo, /type="email"/);
  assert.match(correo, /\brequired\b/);
  assert.match(form, /placeholder="Tu correo"/);
  assert.doesNotMatch(/<input\b[^>]*name="Telefono"[^>]*>/.exec(form)[0], /\brequired\b/);
  assert.match(/<input\b[^>]*name="Comuna"[^>]*>/.exec(form)[0], /\brequired\b/);
  assert.doesNotMatch(/<input\b[^>]*name="Superficie"[^>]*>/.exec(form)[0], /\brequired\b/);
  assert.doesNotMatch(/<textarea\b[^>]*name="Mensaje"[^>]*>/.exec(form)[0], /\brequired\b/);
  assert.match(form, /placeholder="¿Qué cultivas hoy o qué quieres producir\?"/);
  assert.match(form, />Enviar &rsaquo;</);
  assert.match(form, /class="sf-label"/);
  assert.match(form, /class="sf-etapa"/);
  assert.match(form, /class="sf-row"/);
  assert.match(PAGE, /<section id="formulario"/);
  assert.doesNotMatch(PAGE, /id="postular"/);
  assert.doesNotMatch(PAGE, /#postular/);
  assert.doesNotMatch(PAGE, /preventDefault/);
  assert.doesNotMatch(PAGE, /window\.open/);
});

test("la página HR35 no usa las palabras prohibidas y no toca el precio", () => {
  const blob = (PAGE + "\n" + THANKS).toLowerCase();
  assert.doesNotMatch(blob, /postul/);
  assert.doesNotMatch(blob, /agroqu[ií]mic/);
  assert.doesNotMatch(blob, /sin tarjeta/);
  assert.doesNotMatch(blob, /c[oó]digo de descuento/);
  assert.match(PAGE, /\$1\.690\.000 \+ IVA/);
  assert.match(PAGE, /\$1\.900\.000/);
  assert.match(THANKS, /\$1\.690\.000 CLP \+ IVA/);
});

test("cada enlace wa.me de HR35 declara un location distinto", () => {
  const tags = PAGE.match(/<a\b[^>]*>/g) || [];
  const locations = [];
  for (const tag of tags) {
    const isWa = /wa\.me/.test(tag) || /id="calc-wa-btn"/.test(tag);
    if (!isWa) continue;
    const m = /data-wa-location="([^"]+)"/.exec(tag);
    assert.ok(m, "falta data-wa-location en " + tag.slice(0, 80));
    locations.push(m[1]);
  }
  assert.deepStrictEqual(locations.sort(), ["calc", "cta", "float", "hero"]);
  assert.doesNotMatch(PAGE, /data-wa-location="hero-info"/);
  assert.doesNotMatch(PAGE, /Quiero más información/);
  const explore = PAGE.match(/<a\b[^>]*>Quiero explorar opciones/)[0];
  assert.match(explore, /href="#formulario"/);
  assert.doesNotMatch(explore, /wa\.me/);
  assert.doesNotMatch(explore, /data-wa-location/);
  assert.match(PAGE, /gtag\("event","whatsapp_click",\{location:/);
});

test("netlify.toml no se traga el POST del formulario", () => {
  const rules = [];
  let current = null;
  for (const line of TOML.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed) continue;
    if (trimmed === "[[redirects]]") {
      current = {};
      rules.push(current);
      continue;
    }
    const kv = /^([A-Za-z0-9_]+)\s*=\s*(.+)$/.exec(trimmed);
    if (!kv || !current) continue;
    current[kv[1]] = kv[2].replace(/^"|"$/g, "");
  }
  assert.equal(rules.some((r) => r.from === "/*"), false, "el splat 404 se come los POST");
  const action = "/gracias-hr35.html";
  const hitsAction = rules.filter((r) => r.from === action);
  assert.equal(hitsAction.length, 0, "no debe haber redirect sobre el action del POST");
  const clean = rules.find((r) => r.from === "/gracias-hr35");
  assert.ok(clean);
  assert.equal(clean.to, "/gracias-hr35.html");
  assert.equal(clean.status, "301");
});

function runPageScript(search, extras) {
  extras = extras || {};
  const values = Object.create(null);
  const cookieJar = { raw: extras.cookie || "" };
  const listeners = [];
  const gtagCalls = [];
  const store = Object.assign(Object.create(null), extras.session || {});
  const document = {
    getElementById(id) {
      if (id === "yr" || id === "nav-menu") return null;
      if (!Object.prototype.hasOwnProperty.call(values, id)) values[id] = "";
      return {
        get value() { return values[id]; },
        set value(v) { values[id] = v; }
      };
    },
    querySelector() { return null; },
    addEventListener(type, fn) { listeners.push({ type, fn }); }
  };
  Object.defineProperty(document, "cookie", {
    get() { return cookieJar.raw; },
    set(v) {
      const pair = String(v).split(";")[0];
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const rest = cookieJar.raw ? cookieJar.raw.split("; ").filter((p) => !p.startsWith(name + "=")) : [];
      rest.push(pair);
      cookieJar.raw = rest.join("; ");
    }
  });
  const start = PAGE.indexOf("function param(name)");
  const end = PAGE.indexOf("</script>", start);
  assert.ok(start > 0 && end > start);
  const code = PAGE.slice(PAGE.lastIndexOf("<script>", start) + 8, end);
  vm.runInNewContext(code, {
    location: { protocol: "https:", search },
    document,
    sessionStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); }
    },
    URLSearchParams,
    gtag() { gtagCalls.push([].slice.call(arguments)); },
    window: { location: { protocol: "https:", search: search } }
  });
  return { values, cookie: cookieJar.raw, listeners, gtagCalls, store };
}

test("gclid y utm se llenan desde la URL y quedan en la cookie", () => {
  const first = runPageScript("?gclid=CLICK123&utm_source=google&utm_medium=cpc&utm_campaign=hr35-sur&utm_content=anuncio-a&gbraid=GB1");
  assert.equal(first.values["hr35-gclid"], "CLICK123");
  assert.equal(first.values["hr35-utm-source"], "google");
  assert.equal(first.values["hr35-utm-medium"], "cpc");
  assert.equal(first.values["hr35-utm-campaign"], "hr35-sur");
  assert.equal(first.values["hr35-utm-content"], "anuncio-a");
  assert.match(first.cookie, /gclid=CLICK123/);
  assert.equal(first.store.gbraid, "GB1");

  const second = runPageScript("", { cookie: first.cookie });
  assert.equal(second.values["hr35-gclid"], "CLICK123");
  assert.equal(second.values["hr35-utm-campaign"], "hr35-sur");

  const fromSession = runPageScript("", { session: { gclid: "SESION9" } });
  assert.equal(fromSession.values["hr35-gclid"], "SESION9");
});

test("un clic de WhatsApp avisa el location y no abre el formulario por JS", () => {
  const ran = runPageScript("");
  const click = ran.listeners.find((l) => l.type === "click");
  assert.ok(click);
  click.fn({
    target: {
      closest(sel) {
        assert.match(sel, /wa\.me/);
        return { getAttribute: () => "calc" };
      }
    }
  });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ran.gtagCalls)), [["event", "whatsapp_click", { location: "calc" }]]);
});

test("gracias-hr35 dispara la conversión Formulario HR35 una sola vez por sesión", () => {
  const SEND_TO = "AW-18018765001/tmf9CMP2hqQdEMmRgpBD";
  assert.ok(THANKS.includes(SEND_TO));
  assert.match(THANKS, /gtag\("event", "conversion", \{ send_to: SEND_TO, value: 0\.0, currency: "CLP" \}\)/);
  assert.match(THANKS, /gtag\("event", "generate_lead", \{ form: "hr35" \}\)/);
  assert.doesNotMatch(THANKS, /PLACEHOLDER/);
  assert.doesNotMatch(THANKS, /Tnc5CNmonMAcEMmRgpBD/);

  const start = THANKS.indexOf("var SEND_TO");
  const end = THANKS.indexOf("</script>", start);
  const code = THANKS.slice(THANKS.lastIndexOf("<script>", start) + 8, end);
  const store = Object.create(null);
  function run() {
    const calls = [];
    const sandbox = {
      window: { dataLayer: [] },
      document: { addEventListener() {} },
      sessionStorage: {
        getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
        setItem(k, v) { store[k] = String(v); }
      },
      gtag() { calls.push([].slice.call(arguments)); },
      fbq() {}
    };
    vm.runInNewContext(code, sandbox);
    return { calls: JSON.parse(JSON.stringify(calls)), dataLayer: sandbox.window.dataLayer };
  }

  const first = run();
  assert.deepStrictEqual(first.calls, [
    ["event", "conversion", { send_to: SEND_TO, value: 0, currency: "CLP" }],
    ["event", "generate_lead", { form: "hr35" }]
  ]);
  assert.equal(first.dataLayer[0].form, "hr35");
  assert.equal(first.dataLayer[0].event, "generate_lead");

  const second = run();
  assert.deepStrictEqual(second.calls, []);
  assert.deepStrictEqual(second.dataLayer, []);
});

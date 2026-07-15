// Webhook de MercadoPago: al confirmarse un pago, registra la compra en Supabase
// (activated=true) y envía el correo de bienvenida por Brevo.
// Env vars: MP_ACCESS_TOKEN, SUPABASE_SERVICE_KEY, BREVO_API_KEY
const SB_URL = "https://simpksmjwgvihrahifpv.supabase.co";
const SITE = "https://agro.spicelab.cl";

exports.handler = async (event) => {
  const MP = process.env.MP_ACCESS_TOKEN;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  const BREVO = process.env.BREVO_API_KEY;

  try {
    // Obtener el id del pago (viene por query y/o por body)
    const q = event.queryStringParameters || {};
    let paymentId = q["data.id"] || q.id;
    let topic = q.type || q.topic;
    if (event.body) {
      try {
        const b = JSON.parse(event.body);
        paymentId = paymentId || (b.data && b.data.id) || b.id;
        topic = topic || b.type || b.action;
      } catch (e) {}
    }
    // Solo nos interesan notificaciones de pago
    if (topic && String(topic).indexOf("payment") === -1) return { statusCode: 200, body: "ignored" };
    if (!paymentId) return { statusCode: 200, body: "no id" };

    // Verificar el pago con la API de MercadoPago (esto autentica la notificación)
    const pr = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, {
      headers: { "Authorization": "Bearer " + MP }
    });
    if (!pr.ok) return { statusCode: 200, body: "pago no encontrado" };
    const pay = await pr.json();
    if (pay.status !== "approved") return { statusCode: 200, body: "estado: " + pay.status };

    const email = ((pay.payer && pay.payer.email) || "").toLowerCase().trim();
    const amount = Math.round(pay.transaction_amount || 79000);
    if (!email) return { statusCode: 200, body: "sin email" };

    // 1) Registrar/activar la compra en Supabase (upsert por email; service_role salta RLS)
    const up = await fetch(SB_URL + "/rest/v1/purchases?on_conflict=email", {
      method: "POST",
      headers: {
        "apikey": SB_KEY,
        "Authorization": "Bearer " + SB_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({ email, product: "academia", amount_clp: amount, source: "mercadopago", activated: true })
    });
    if (!up.ok) {
      const t = await up.text();
      return { statusCode: 500, body: "Supabase error: " + t.slice(0, 200) }; // 500 => MP reintenta
    }

    // 2) Correo de bienvenida por Brevo (best-effort, con log del resultado)
    if (!BREVO) { console.log("Brevo: falta BREVO_API_KEY"); }
    if (BREVO) {
      const br = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": BREVO, "Content-Type": "application/json", "accept": "application/json" },
        body: JSON.stringify({
          sender: { name: "SPICe Agro", email: "msalas@spicelab.cl" },
          to: [{ email }],
          subject: "Tu acceso a la Academia SPICe Agro esta activo",
          htmlContent:
            "<div style=\"font-family:Arial,sans-serif;color:#1d2233;line-height:1.6\">" +
            "<p>Gracias por sumarte a la <b>Academia SPICe Agro</b>.</p>" +
            "<p>Tu acceso ya esta <b>activo</b>. El curso parte el <b>lunes 14 de septiembre</b>.</p>" +
            "<p>Ese dia entra a <a href=\"" + SITE + "/curso/\">agro.spicelab.cl/curso</a> con <b>este mismo correo</b> — te llegara un codigo de 6 digitos, sin contrasenas.</p>" +
            "<p>Incluye 4 modulos con lecciones cortas y experimentos, quiz, certificado y acceso de por vida.</p>" +
            "<p>Cualquier duda, escribenos por WhatsApp +56 9 7154 0665.</p>" +
            "<p>— Equipo SPICe Agro</p></div>"
        })
      });
      const btxt = await br.text();
      console.log("Brevo status:", br.status, "para", email, "->", btxt.slice(0, 300));
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 500, body: "err: " + e.message };
  }
};

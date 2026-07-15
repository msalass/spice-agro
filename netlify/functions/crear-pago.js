// Crea un cobro de MercadoPago por API y redirige al checkout.
// Requiere env var: MP_ACCESS_TOKEN (credencial de producción de MercadoPago)
const SITE = "https://agro.spicelab.cl";

exports.handler = async () => {
  const MP = process.env.MP_ACCESS_TOKEN;
  if (!MP) return { statusCode: 500, body: "Falta MP_ACCESS_TOKEN" };
  try {
    const pref = {
      items: [{
        title: "Academia SPICe Agro — Preventa",
        quantity: 1,
        currency_id: "CLP",
        unit_price: 79000
      }],
      back_urls: {
        success: SITE + "/gracias-academia.html",
        pending: SITE + "/gracias-academia.html",
        failure: SITE + "/academia.html"
      },
      auto_return: "approved",
      notification_url: SITE + "/.netlify/functions/mp-webhook",
      statement_descriptor: "SPICE AGRO",
      metadata: { product: "academia" }
    };
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Authorization": "Bearer " + MP, "Content-Type": "application/json" },
      body: JSON.stringify(pref)
    });
    const data = await r.json();
    if (!r.ok || !data.init_point) {
      return { statusCode: 500, body: "No se pudo crear el cobro: " + JSON.stringify(data).slice(0, 300) };
    }
    return { statusCode: 302, headers: { Location: data.init_point } };
  } catch (e) {
    return { statusCode: 500, body: "Error: " + e.message };
  }
};

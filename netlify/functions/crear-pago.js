// Crea un cobro de MercadoPago por API y redirige al checkout.
// Requiere env var: MP_ACCESS_TOKEN (credencial de producción de MercadoPago)
const SITE = "https://agro.spicelab.cl";

exports.handler = async (event) => {
  const MP = process.env.MP_ACCESS_TOKEN;
  if (!MP) return { statusCode: 500, body: "Falta MP_ACCESS_TOKEN" };
  const promo = ((event.queryStringParameters || {}).promo || "").trim();
  const isLista = promo === "lista10";
  const price = isLista ? 71100 : 79000;
  const title = isLista
    ? "Academia SPICe Agro — Preventa lista 10%"
    : "Academia SPICe Agro — Preventa";
  try {
    const pref = {
      items: [{
        title,
        quantity: 1,
        currency_id: "CLP",
        unit_price: price
      }],
      back_urls: {
        success: SITE + "/gracias-academia.html",
        pending: SITE + "/gracias-academia.html",
        failure: SITE + "/academia.html"
      },
      auto_return: "approved",
      notification_url: SITE + "/.netlify/functions/mp-webhook",
      statement_descriptor: "SPICE AGRO",
      metadata: { product: "academia", ...(isLista ? { promo: "lista10" } : {}) }
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

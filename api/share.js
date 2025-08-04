// exiro-share/api/share.js

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin (solo una volta)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ekoach.firebaseio.com"
  });
}
const db = admin.firestore();

module.exports = async function handler(req, res) {
  const token = req.query.token;
  if (!token) {
    res.status(400).send("Missing token");
    return;
  }

  // Cerca il programma in Firestore
  const snaps = await db
    .collection("public_programs")
    .where("share_token", "==", token)
    .limit(1)
    .get();

  if (snaps.empty) {
    res.status(404).send("Program not found");
    return;
  }

  const doc = snaps.docs[0];
  const data = doc.data();
  const title = data.title || "Programma Exiro";
  const desc  = data.description || "";
  const img   = data.photo_url ||
    "https://firebasestorage.googleapis.com/v0/b/ekoach.firebasestorage.app/o/program_images%2Fapp_icon_light_256.png?alt=media";

  // Fallback HTML: mini-landing con feature prima del download
  const downloadHtml = `
    <div class="hero">
      <img src="/img/app_screenshot.png" alt="App Screenshot" class="screenshot" />
    </div>
    <div class="intro">
      <h1>Exiro: allenamenti senza distrazioni</h1>
      <p>Il tuo training, esattamente come lo vuoi – sempre a portata di mano.</p>
    </div>
    <div class="features">
      <div class="feat">
        <img src="/img/icon-custom.png" alt="Custom Workouts" />
        <h3>Custom Workouts</h3>
        <p>Scegli livello, tempo e attrezzi.</p>
      </div>
      <div class="feat">
        <img src="/img/icon-track.png" alt="Tracking Automatico" />
        <h3>Tracking Automatico</h3>
        <p>Peso, rip e tempo registrati.</p>
      </div>
      <div class="feat">
        <img src="/img/icon-offline.png" alt="Modalità Offline" />
        <h3>Modalità Offline</h3>
        <p>Allenati ovunque senza rete.</p>
      </div>
      <div class="feat">
        <img src="/img/icon-market.png" alt="Marketplace" />
        <h3>Marketplace Integrato</h3>
        <p>Pubblica e monetizza programmi.</p>
      </div>
    </div>
    <div class="social-proof">
      <span>⭐️⭐️⭐️⭐️⭐️ (4.8) • 10K+ valutazioni</span>
    </div>
    <div class="cta">
      <a href="#download" class="btn-main">Scarica Exiro</a>
      <p class="note">Gratis su iOS e Android • Nessuna carta richiesta</p>
    </div>`;

  // HTML completo con logo e design responsive
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <!-- Favicon per Vercel e browser -->
  <link rel="icon" type="image/png" href="/img/exiro_logo_transparent.png" />
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>

  <!-- Open Graph -->
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image"       content="${img}" />
  <meta property="og:type"        content="website" />
  <meta name="twitter:card"       content="summary_large_image" />

  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; overflow-x: hidden; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #FAFAFA; color: #333; }
    .hero { text-align: center; padding: 20px 0; }
    .screenshot { max-width: 90%; height: auto; border-radius: 12px; }
    .intro { text-align: center; padding: 0 16px; }
    .intro h1 { font-size: 2rem; margin: 16px 0 8px; }
    .intro p { font-size: 1rem; margin: 0 0 24px; }
    .features { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; padding: 0 16px; }
    .feat { width: calc(50% - 20px); text-align: center; }
    .feat img { width: 48px; height: 48px; margin-bottom: 8px; }
    .feat h3 { font-size: 1.125rem; margin: 4px 0; }
    .feat p { font-size: 0.875rem; margin: 0; }
    .social-proof { text-align: center; font-size: 0.875rem; margin: 24px 0; color: #666; }
    .cta { text-align: center; padding: 0 16px 40px; }
    .btn-main { display: inline-block; background: #FF5500; color: #fff; text-decoration: none; font-weight: bold; font-size: 1rem; padding: 12px 24px; border-radius: 8px; }
    .note { font-size: 0.75rem; color: #666; margin-top: 8px; }
    @media(min-width: 600px) {
      .feat { width: calc(25% - 20px); }
      .intro h1 { font-size: 2.5rem; }
    }
  </style>
</head>
<body>
  ${downloadHtml}
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};

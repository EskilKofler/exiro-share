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

  // Fallback HTML: lista verticale di feature + pulsanti + nota
  const downloadHtml = `
    <div class="download-container">
      <div class="header">
        <img src="/img/exiro_logo_transparent.png" alt="Exiro Logo" class="logo" />
        <h1 class="title">Passa al livello superiore con Exiro</h1>
      </div>
      <ul class="feature-list">
        <li>
          <img src="/icon/dumbbell.svg" alt="Create Your Workout Plan" class="feat-icon" />
          <div class="feat-content">
            <span class="feat-title">Create Your Workout Plan</span>
            <small class="feat-desc">Over 2,300 exercises to build any routine, customizing reps, sets, rest times and more.</small>
          </div>
        </li>
        <li>
          <img src="/icon/psycology.svg" alt="Smart Recommendations" class="feat-icon" />
          <div class="feat-content">
            <span class="feat-title">Smart Recommendations</span>
            <small class="feat-desc">Our algorithm filters the Exiro Marketplace to show only the plans best suited to your goals.</small>
          </div>
        </li>
        <li>
          <img src="/icon/timer.svg" alt="Live Tracking & Log-Book" class="feat-icon" />
          <div class="feat-content">
            <span class="feat-title">Live Tracking & Log-Book</span>
            <small class="feat-desc">Track kilos, reps and sessions for every program; follow video tutorials and a built-in timer in one screen.</small>
          </div>
        </li>
        <li>
          <img src="/icon/storefront.svg" alt="Marketplace & Monetization" class="feat-icon" />
          <div class="feat-content">
            <span class="feat-title">Marketplace & Monetization</span>
            <small class="feat-desc">Download, publish and earn real money from your routines thanks to Stripe.</small>
          </div>
        </li>
      </ul>
      <!-- Nota spostata sopra i pulsanti ma nascosta -->
      <p class="note">Free on iOS e Android • No card request</p>
      <div class="store-links">
        <a href="https://apps.apple.com/app/idYOUR_IOS_APP_ID" target="_blank" rel="noopener">
          <img src="/img/apple_logo.png" alt="Apple Logo" class="btn-icon" />
          <div class="text">
            <span class="small">Download on the</span>
            <span class="large">App Store</span>
          </div>
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.exiro.app" target="_blank" rel="noopener">
          <img src="/img/play_store_logo.png" alt="Play Store Logo" class="btn-icon" />
          <div class="text">
            <span class="small">Get it on</span>
            <span class="large">Google Play</span>
          </div>
        </a>
      </div>
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
    html, body { margin: 0; padding: 0; overflow-x: hidden; width: 100%; height: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #FAFAFA; color: #333; position: relative; padding-bottom: 80px; }
    .download-container { width: 100%; max-width: 480px; margin: 40px auto 0; padding: 0 16px; display: flex; flex-direction: column; min-height: 100vh; }
    .header { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
    .logo { width: 80px; height: auto; margin-bottom: 12px; }
    .title { font-size: 2rem; margin: 0; line-height: 1.2; font-weight: 800; text-align: center; }
    .feature-list { list-style: none; padding: 0; margin: 0 0 40px; }
    .feature-list li { display: flex; align-items: center; margin-bottom: 16px; }
    .feat-icon { width: 32px; height: auto; margin-right: 12px; filter: brightness(0); }
    .feat-content { text-align: left; }
    .feat-title { font-weight: 700; font-size: 0.95rem; color: #333; line-height: 1.2; }
    .feat-desc { display: block; font-size: 0.875rem; color: #666; margin: 4px 0 0; }
    .note { display: none; }
    .store-links {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 12px 16px 16px; /* 12px top spacer */
      background: #FAFAFA;
    }
    .store-links a { display: flex; flex-direction: row; align-items: center; justify-content: center; text-decoration: none; background: #000; color: #fff; padding: 14px 20px; border-radius: 12px; width: 100%; max-width: 480px; }
    .btn-icon { width: 36px; height: auto; margin-right: 12px; }
    .text { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .small { font-size: 0.75rem; line-height: 1; opacity: 0.85; }
    .large { font-size: 1.375rem; line-height: 1; font-weight: 700; margin-top: 2px; }
    @media(min-width: 600px) {
      .store-links { position: static; padding: 0; bottom: auto; background: transparent; flex-direction: row; justify-content: center; margin-top: 24px; }
      .store-links a { width: auto; margin: 0 8px; }
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

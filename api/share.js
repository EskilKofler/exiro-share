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

  // Fallback HTML: mostra sempre la pagina di download personalizzata
  const downloadHtml = `
    <div class="download-container">
      <img src="/img/app_icon_light.png" alt="Exiro Logo" class="logo" />
      <h1>Potenzia il tuo allenamento con Exiro</h1>
      <p>Scarica l’app per vivere l’esperienza completa:</p>
      <div class="store-links">
        <a href="https://apps.apple.com/app/idYOUR_IOS_APP_ID" target="_blank" rel="noopener">
          <img src="/img/apple_logo.png" alt="Apple Logo" class="btn-icon" />
          <span>Download on App Store</span>
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.exiro.app" target="_blank" rel="noopener">
          <img src="/img/play_store_logo.png" alt="Play Store Logo" class="btn-icon" />
          <span>Get it on Google Play</span>
        </a>
      </div>
    </div>`;

  // HTML completo con logo e design responsive
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
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
    /* Mantieni proporzioni originali */
    img { max-width: 100%; height: auto; }

    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #333;
      background: #FAFAFA; /* Colore di sfondo aggiornato */
      padding-top: 20px;
    }
    .download-container {
      width: 90%;
      max-width: 480px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      background: #fff;
      border-radius: 12px;
    }
    .logo {
      display: block;
      margin: 0 auto 20px;
      width: 120px;
      height: auto;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }
    .store-links {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .store-links a {
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 8px;
      background: #000;
      color: #fff;
      font-weight: 600;
    }
    .btn-icon {
      width: 24px;
      height: auto;
      margin-right: 10px;
    }
    @media(min-width: 600px) {
      .download-container {
        padding: 40px;
        max-width: 600px;
      }
      h1 {
        font-size: 2rem;
      }
      .store-links {
        flex-direction: row;
      }
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
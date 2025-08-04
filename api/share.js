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

  // Deep link custom scheme
  const deepLink = `exiro://share/${token}`;

  // Fallback HTML per chi NON apre l’app
  const downloadHtml = `
    <div class="download-container">
      <h1>Potenzia il tuo allenamento con Exiro</h1>
      <p>Scarica l’app per vivere l’esperienza completa:</p>
      <div class="store-links">
        <a href="https://apps.apple.com/app/idYOUR_IOS_ID">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.exiro.app">Play Store</a>
      </div>
    </div>`;

  // HTML completo con logo e responsive design
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
    body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#333; }
    .container { max-width: 480px; margin: 0 auto; padding: 20px; text-align: center; }
    .logo { max-width: 120px; margin: 20px auto; display: block; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { font-size: 1rem; margin-bottom: 1rem; }
    .store-links { display: flex; justify-content: center; gap: 10px; }
    .store-links a { text-decoration: none; padding: 10px 15px; border-radius: 8px; background: #007AFF; color: #fff; font-weight: 500; }
    @media(min-width: 600px) {
      .container { max-width: 600px; }
      h1 { font-size: 2rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Logo in alto -->
    <img src="/app_icon_light.png" alt="Exiro Logo" class="logo" />
    <!-- Script per deep link e fallback -->
    <script>
      (function() {
        // Prova ad aprire l'app
        window.location.href = "${deepLink}";
        // Dopo 1.8 s, se l'app non si apre, mostra il fallback
        setTimeout(function() {
          document.querySelector('.container').innerHTML = \`${downloadHtml}\`;
        }, 1800);
      })();
    </script>
    <noscript>
      ${downloadHtml}
    </noscript>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};

// exiro-share/api/share.js

const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const { join } = require('path');

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
  // 1) prendi il token sia da /share?token= sia da /program/:id?share_token=
  const token = req.query.token || req.query.share_token;
  if (!token) {
    res.status(400).send("Missing token");
    return;
  }

  // 2) cerco in Firestore
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
  const img   = data.photo_url || "https://share.exiro.app/default.jpg";

  // 3) l’URL che i bot dovranno “scrapare” è proprio quello con cui sono arrivati
  //    (req.headers.host + req.url)
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const ogUrl = `${protocol}://${host}${req.url}`;

  // 4) l’URL di destinazione (browser/app) è sempre il path program
  const redirectUrl = `https://share.exiro.app/program/${doc.id}?share_token=${token}`;

  // 5) costruiamo la pagina con i meta OG E con lo script di redirect in fondo
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>

  <!-- Open Graph -->
  <meta property="og:title"       content="${title}"/>
  <meta property="og:description" content="${desc}"/>
  <meta property="og:image"       content="${img}"/>
  <meta property="og:url"         content="${ogUrl}"/>
  <meta property="og:type"        content="website"/>
  <meta name="twitter:card"       content="summary_large_image"/>
</head>
<body>
  <p>Reindirizzamento in corso…</p>
  <script>
    // redirect per browser / deep link
    window.location.replace("${redirectUrl}");
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};

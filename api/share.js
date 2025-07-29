// exiro-share/api/share.js

const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const { join } = require('path');

// Inizializza Firebase Admin (solo una volta)
if (!admin.apps.length) {
  admin.initializeApp({
    // se usi serviceAccountKey.json, altrimenti usa applicationDefault()
    credential: admin.credential.applicationDefault(),
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
  const img   = data.photo_url || "https://share.exiro.app/default.jpg";
  const url   = `https://share.exiro.app/share/${token}`;

  // Genera HTML con meta OG
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>

  <!-- Open Graph -->
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image"       content="${img}" />
  <meta property="og:url"         content="${url}" />
  <meta property="og:type"        content="website" />
  <meta name="twitter:card"       content="summary_large_image" />

  <!-- redirect in JS per utenti browser -->
  <script>
    window.location.replace("https://app.exiro.com/program/${doc.id}");
  </script>
</head>
<body>
  <p>Reindirizzamento in corso…</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};

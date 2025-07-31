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
  // accetta sia ?token=… che ?share_token=…
  const token = req.query.token || req.query.share_token;
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
  // qui usiamo sempre il link breve “/share/…” per i tuoi bot OG
  const url   = `https://share.exiro.app/share/${token}`;
  // ma per il redirect nativo /program/…?share_token=…
  const redirectUrl = `https://share.exiro.app/program/${doc.id}?share_token=${token}`;

  // Genera HTML con meta OG e redirect
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

  <!-- meta-refresh per i crawler -->
  <meta http-equiv="refresh" content="0; url=${redirectUrl}" />

  <!-- redirect in JS per utenti browser -->
  <script>
    window.location.replace("${redirectUrl}");
  </script>
</head>
<body>
  <p>Reindirizzamento in corso…</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};

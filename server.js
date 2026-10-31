const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HTA = path.join(__dirname, 'file.hta');

function sendHta(req, res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('X-UA-Compatible', 'IE=edge');
  res.send(fs.readFileSync(HTA, 'utf8'));
}

// n'importe quelle URL finissant par .hta sert le fichier
app.get(/\.hta$/i, sendHta);

// la racine aussi, pour l'affichage navigateur
app.get('/', sendHta);

// fallback : tout le reste renvoie le HTA (utile si tu changes de lien)
app.use((req, res) => sendHta(req, res));

app.listen(PORT, () => console.log('up on ' + PORT));

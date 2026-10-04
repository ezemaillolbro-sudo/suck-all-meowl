const express = require("express");
const path = require("path");

const app = express();

app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "file.hta");

    res.download(filePath, "file.hta", (err) => {
        if (err) {
            console.error(err);

            if (!res.headersSent) {
                res.status(404).send("File not found.");
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
const path = require("path");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "/dist/csci571-assi3-nikhal");

app.use(express.static(publicPath));

app.listen(port, () => {
  console.log(`Server is up on ${port}`);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/dist/csci571-assi3-nikhal/index.html"));
});
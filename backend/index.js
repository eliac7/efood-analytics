const express = require("express");
const app = express();
const cors = require("cors");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require("./routes"));

app.use("/", (req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

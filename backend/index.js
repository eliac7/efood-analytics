const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
const login = require("./routes/login");
const orders = require("./routes/orders");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/login", login);
app.post("/api/orders", orders);

app.use("/", (req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

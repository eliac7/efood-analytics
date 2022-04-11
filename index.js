const express = require("express");
const app = express();
const axios = require('axios')
const fetch = require('node-fetch')
const cors = require("cors");
const port = process.env.PORT || 3002;
require('dotenv').config()

app.use(cors());
app.use(express.json())




app.post("/api/v1/efood", async (req, res) => {
  const USER_LOGIN = 'https://api.e-food.gr/api/v1/user/login'

  const { email, password } = req.body
  if (!email || !password) {
    res.status(500).json({ message: 'Please enter e-mail or password.' })
    return
  }
  console.log(req.body)








});

app.get("*", (req, res) => {
  res.status(404).json({
    status: 404,
    message: "Page not found",
  });
});

app.listen(port, () => console.log(`Listening on ${port}`));

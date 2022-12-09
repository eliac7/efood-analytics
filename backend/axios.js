const axios = require("axios");

const axiosfood = axios.create({
  timeout: 1000,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
  },
});

module.exports = axiosfood;

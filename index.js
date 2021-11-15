const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const cheerio = require("cheerio");
const multer = require("multer");
const uuid = require("uuid").v4;
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json({ limit: "10mb" }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    const { originalname } = file;
    cb(null, uuid() + originalname);
  },
});
const upload = multer({ storage });

app.use(express.static("public"));

app.post("/api/v1/efood", upload.single("analytics"), async (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(400).json({
      status: 400,
      error: "No file uploaded",
    });
  }
  let filename = req.file.filename;
  let path = req.file.path;
  let $ = cheerio.load(fs.readFileSync("./uploads/" + filename));

  const stores = $("a");

  //Fallback to check if the file is a valid efood file
  let firstOrderLink = $(stores).first().attr("href");

  if (!firstOrderLink || !firstOrderLink.includes("e-food.gr")) {
    fs.unlinkSync(path);
    res.status(400).json({
      status: 400,
      error: "Invalid file.",
    });
    return;
  }
  var formatter = new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  });

  const orders = $(".user-account-orders-order");
  const money = $(".col-lg-1.mb-8.mb-lg-0 > div");
  const products = $(".col-lg-3.mb-7.mb-lg-0 > div ");
  const paymentType = $(".col-lg-1.mb-8.mb-lg-0 > span i");

  const lastOrder = $(orders).children().first().find("strong").last().text();
  const firstOrder = $(orders).children().last().find("strong").last().text();

  let tempStores = [];
  let tempProducts = [];
  let finalProducts = [];
  let dates = [];
  let totalOrders = orders.length;
  let topTenOrders = [];

  //Get the top ten orders
  orders.each((index, order) => {
    let orderID = $(order).find("strong").first().text();
    let storeName = $(order).find("a").text();
    let date = $(order)
      .find(".col-6.col-lg-2.mb-7.mb-lg-0:nth-child(2) strong")
      .text();
    let time = $(order).find(".text-muted").first().text();

    let productsSelector = $(order)
      .find(".col-lg-3.mb-7.mb-lg-0 > .mb-3")
      .contents()
      .map(function () {
        if (this.type === "text") return $(this).text().trim();
      })
      .get();
    let products = new Array();
    let money = $(order).find(".col-lg-1.mb-8.mb-lg-0 > .mb-3").text();

    productsSelector.forEach((product, index) => {
      if (product !== "") {
        products.push(product);
      }
    });

    topTenOrders.push({
      orderID,
      date,
      time,
      store: {
        name: storeName,
        link: $(order).find("a").attr("href"),
      },
      products,
      money,
    });

    //Get only the top 10 orders
    return index < 9;
  });

  //Get the amount of orders by payment type
  let paymentTypes = [];

  paymentType.each((index, element) => {
    let type = $(element).attr("title");
    paymentTypes.push(type);
  });

  let paymentTypeOccurrences = paymentTypes.reduce(function (acc, curr) {
    return acc[curr] ? ++acc[curr] : (acc[curr] = 1), acc;
  }, {});

  paymentTypeOccurrences = {
    ...paymentTypeOccurrences,
    "Πληρώσατε με μετρητά": Number(orders.length) - Number(paymentType.length),
  };

  //Order by year

  let ordersByYearAndPrice = [];

  function orderExists(date) {
    return ordersByYearAndPrice.some(function (el) {
      return el.date === date;
    });
  }

  orders.each((index, order) => {
    let rawDate = $(order).find("strong:not(.text-yellow)").last().text();
    let date = rawDate.split("/")[2];
    let priceSelector = $(order).find(".col-lg-1.mb-8.mb-lg-0 > div");
    let price = Number(priceSelector.text().replace("€", "").replace(",", "."));

    if (orderExists(date)) {
      ordersByYearAndPrice.forEach(function (el) {
        if (el.date === date) {
          el.price = el.price + price;
        }
      });
    } else {
      ordersByYearAndPrice.push({
        date,
        price,
      });
    }
    dates.push(date);
  });

  //Sort by date
  ordersByYearAndPrice.sort(function (a, b) {
    return a.date - b.date;
  });

  const ordersByYear = dates.reduce(function (acc, curr) {
    return acc[curr] ? ++acc[curr] : (acc[curr] = 1), acc;
  }, {});

  //Products

  //For each products, push the name of it to the tempProducts array
  products.each((index, item) => {
    //Remove "tip gia dianomea" div
    if (!$(item).hasClass("tip-gia-dianomea")) {
      tempProducts.push(
        $(item)
          .text()
          .replace(/(\r\n|\n|\r)/gm, "")
          .trim()
      );
    }
  });

  //Remove duplicates
  let uniqProducts = [...new Set(tempProducts)];

  //Push name of item and times of this item been seen on the tempPoroducts array
  uniqProducts.forEach((item) => {
    let times = tempProducts.filter((e) => e === item).length;
    finalProducts.push({ name: item.split(" ").slice(1).join(" "), times });
  });
  //Sort by times been seen
  finalProducts = finalProducts.sort(function (a, b) {
    return a.times - b.times;
  });

  //Get the most frequest product that the user bought

  let frequentProduct = finalProducts[finalProducts.length - 1];

  //Stores

  //Fill the tempStores array with name of the store, image, and default times that been seen.
  stores.each((index, store) => {
    tempStores.push({
      name: $(store).text(),
      image: $(store).parent().find("img").attr("data-src"),
      link: $(store).attr("href"),
      times: 1,
    });
  });

  //   console.log(tempStores);

  //Filter the tempStores array to remove duplicates
  const seen = new Set();
  const filteredStores = tempStores.filter((el) => {
    const duplicate = seen.has(el.name);
    seen.add(el.name);
    return !duplicate;
  });

  //Loop through the filteredStores array and add the times that been seen to the times property of the object
  tempStores.forEach((item) => {
    filteredStores.forEach((store) => {
      if (item.name === store.name) {
        store.times++;
      }
    });
  });
  //Sort stores by times been seen
  filteredStores.sort((a, b) => (a.times > b.times ? 1 : -1));

  let frequentStore = filteredStores[filteredStores.length - 1];

  //Money
  let total = 0;
  money.each((index, el) => {
    replacedMoney = Number($(el).text().replace("€", "").replace(",", "."));
    total = total + replacedMoney;
  });

  total = formatter.format(total);

  res.status(200).json({
    status: 200,
    data: {
      frequentStore,
      firstOrder,
      lastOrder,
      total,
      frequentProduct,
      totalOrders,
      ordersByYear,
      ordersByYearAndPrice,
      paymentTypeOccurrences,
      topTenOrders,
    },
  });

  fs.unlinkSync(path);
});

app.get("*", (req, res) => {
  res.json("nothing to see here");
});

app.listen(port, () => console.log(`Listening on ${port}`));

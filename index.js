const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const cheerio = require("cheerio");
const Humanoid = require("humanoid-js");
const multer = require("multer");
const uuid = require("uuid").v4;
const { next } = require("cheerio/lib/api/traversing");
const port = process.env.PORT || 3000;

let humanoid = new Humanoid();
const uploadPATH = "/tmp/";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPATH);
  },
  filename: function (req, file, cb) {
    const { originalname } = file;
    cb(null, uuid() + originalname);
  },
});
const upload = multer({ storage });

app.use(cors());

app.use(express.json({ limit: "10mb" }));

app.use(express.static("public"));

app.post("/api/v1/efood", upload.single("analytics"), async (req, res) => {
  const checkMaps = req.query["maps"] === "true";
  const { file } = req;
  if (!file) {
    return res.status(400).json({
      status: 400,
      error: "No file uploaded",
    });
  }
  let filename = req.file.filename;
  let path = req.file.path;
  let $ = cheerio.load(fs.readFileSync(uploadPATH + filename));
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
  //Counter for tips
  let tipsCounter = 0;
  //For each products, push the name of it to the tempProducts array
  products.each((index, item) => {
    //Push only products without tips for the delivery but keep a counter for the tips
    if (
      !(
        $(item)
          .find("span")
          .text()
          .trim()
          .replace(/(\r\n|\n|\r)/gm, "") === "Tip για διανομέα"
      )
    ) {
      tempProducts.push(
        $(item)
          .text()
          .replace(/(\r\n|\n|\r)/gm, "")
          .trim()
      );
    } else {
      tipsCounter = tipsCounter + 1;
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
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  //Fill the tempStores array with name of the store, image,  default times that been seen and amount that spent on that store
  stores.each((index, store) => {
    let storeName = $(store).text();
    let storeImage = $(store).parent().find("img").attr("data-src");
    let storeLink = $(store).attr("href");
    tempStores.push({
      name: storeName,
      image: storeImage,
      link: storeLink,
      times: 0,
      amount: 0,
      ...(checkMaps ? { gps: { x: 0, y: 0 } } : {}),
    });
  });
  //For each order, find the store and increase the times that been seen and the amount that spent on that store
  orders.each((index, order) => {
    let storeName = $(order).find("a").text();
    let amount = $(order)
      .find(".col-lg-1.mb-8.mb-lg-0 > div")
      .text()
      .trim()
      .replace("€", "")
      .replace(",", ".");
    let store = tempStores.find((store) => store.name === storeName);
    if (store) {
      store.amount += Number(amount);
    }
  });
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
  //Get Geo Location of every store
  if (checkMaps) {
    let time;
    var filter = new Promise((resolve, reject) => {
      filteredStores.forEach((store, i, array) => {
        time = setTimeout(async () => {
          let response = await humanoid.sendRequest(store.link);
          let $ = cheerio.load(response.body);
          let scripts = $("script[type='application/ld+json']")[0];
          let json = JSON.parse(scripts.children[0].data);
          let scriptSplit = json;
          if (Object.keys(scriptSplit).length === 1) {
            scriptSplit = scriptSplit["@graph"][0];
          }
          let latitude = scriptSplit.geo.latitude;
          let longitude = scriptSplit.geo.longitude;
          store.gps.x = latitude;
          store.gps.y = longitude;

          if (i === array.length - 1) resolve();
        }, i * 1000);
      });
      req.connection.on("close", () => {
        clearTimeout(time);
        reject("Error");
      });
    });

    filter.then(() => {
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
          filteredStores,
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
          tipsCounter,
        },
      });
      fs.unlinkSync(path);
    });
    filter.catch(() => {
      next(new Error("Something went wrong"));
      return;
    });
  } else {
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
        filteredStores,
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
        tipsCounter,
      },
    });
    fs.unlinkSync(path);
  }
});

app.get("*", (req, res) => {
  res.status(404).json({
    status: 404,
    message: "Page not found",
  });
});

app.listen(port, () => console.log(`Listening on ${port}`));

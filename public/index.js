let form = document.querySelector("form");
let uploadContainer = document.querySelector(".upload-container");
let uploadBox = document.querySelector(".upload-box");
let uploadArea = document.querySelector(".upload-area-fourth-step");
let uploadAreaSteps = document.querySelectorAll("[class*=step]");

let uploadInput = document.querySelector("input[type=file]");
let switchMapInput = document.querySelector("#map-switch");
let uploadText = document.querySelector(".upload-area > p");
let nextIcon = document.querySelectorAll(".next");
let prevIcon = document.querySelectorAll(".back");
let resetButton = document.querySelector(".reset-button");

let ToastifyAlertColor = "#cc3300";
let ToastifyInfoColor = "#7db0b1";

//Analytics selectors

let firstOrder = document.getElementById("first-order");
let lastOrder = document.getElementById("latest-order");
let totalOrders = document.getElementById("total-orders");
let totalAmount = document.getElementById("total-amount");
let uniqueStores = document.getElementById("unique-stores");
let totalTips = document.getElementById("total-tips");
let frequentStoreSelector = document.getElementById("frequent-store");
let salesLink = document.querySelectorAll("a.sales-link");
let frequentImageStore = document.querySelectorAll(".frequent-store");
let frequentStoreTimes = document.getElementById("frequent-store-times");
let frequentProductSelector = document.getElementById("frequent-product");
let frequentProductTimesSelector = document.getElementById(
  "frequent-product-times"
);
let creditCardTotal = document.getElementById("credit-card-total");
let cashTotal = document.getElementById("cash-total");
let paypalTotal = document.getElementById("paypal-total");

//Chart JS Selectors
let topTenOrdersTable = document.getElementById("ordersTableBody");

//Currency formatter
const formatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

//Placeholder for first and last orders date
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1;

var yyyy = today.getFullYear();
if (dd < 10) {
  dd = "0" + dd;
}
if (mm < 10) {
  mm = "0" + mm;
}
var today = dd + "/" + mm + "/" + yyyy;

firstOrder.innerHTML = today;
lastOrder.innerHTML = today;

//Year on credits
const yearSelector = document.querySelector(".year");
yearSelector.innerText = yyyy;

//Check if is touch device
function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}
//Vanilla JS Fade out animation
function FadeOutUploadArea() {
  var s = uploadContainer.style;
  s.opacity = 1;
  (function fade() {
    (s.opacity -= 0.1) < 0 ? (s.display = "none") : setTimeout(fade, 40);
  })();
}

var tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

//Leaflet JS
var map = L.map("map").setView([37.9908997, 23.70332], 13);

L.tileLayer(
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    maxZoom: 18,
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    accessToken:
      "pk.eyJ1IjoiZWxpYWM3IiwiYSI6ImNrcjZ1d3pqczA5dDIybm1hbndkYzA3cWUifQ.oCsZHSmdgFiahDuozJWNOg",
  }
).addTo(map);
var storesLayer = L.layerGroup().addTo(map);
const controlSearch = new L.Control.Search({
  layer: storesLayer,
  initial: false,
  zoom: 16,
  marker: false,
});

map.addControl(controlSearch);

//Trigger Toastify with message given by user
function TriggerToastify(message, color) {
  Toastify({
    text: message,
    duration: 3000,
    newWindow: true,
    close: true,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: {
      background: color || "#cc3300",
      textAlign: "center",
    },
  }).showToast();
}

//Create new Bootstrap Model for the products
function createModal(ID, products) {
  let modal = document.getElementById("productsModal");
  if (modal) {
    modal.parentNode.removeChild(modal);
  }

  let html = `<div class="modal fade" id="productsModal" tabindex="-1" aria-labelledby="productsModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="productsModalLabel">Order No: ${ID}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <ul class="list-group list-unstyled">
        ${Object.keys(products)
          .map(function (key) {
            return (
              "<li class='list-group-item' value='" +
              key +
              "'>" +
              products[key] +
              "</li>"
            );
          })
          .join("")}
        </li>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  var myModal = new bootstrap.Modal(
    document.getElementById("productsModal"),
    {}
  );
  myModal.show();
}

//Remove commas  from numbers
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
//Animate counter for money and total orders
function counterAnimationHandler() {
  const counters = document.querySelectorAll(".count ");
  counters.forEach((counter) => {
    const RAWtarget = counter.innerHTML;
    counter.innerText = "0"; //set default counter value
    counter.dataset.count = 0;
    const updateCounter = () => {
      const target = +counter.getAttribute("data-target"); //define increase couter to it's data-target
      const count = +counter.dataset.count; //define increase couter on innerText

      const increment = target / 400; // define increment as counter increase value / speed

      if (count < target) {
        let newCount = 0;
        if (RAWtarget.includes("€")) {
          newCount = parseFloat(count + increment).toFixed(2);
          counter.innerHTML = formatter.format(newCount);
        } else {
          newCount = Math.ceil(count + increment);
          counter.innerText = numberWithCommas(newCount);
        }
        counter.dataset.count = newCount;
        setTimeout(updateCounter, 1);
      } else {
        counter.innerHTML = RAWtarget;
      }
    };

    updateCounter(); //call the function event
  });
}

function uploadFile(formData) {
  uploadBox.classList.add("loading");
  switchMapInput.disabled = true;
  let mapRow = document.getElementsByClassName("map-row")[0];
  if (switchMapInput.checked) {
    mapRow.style.display = "flex";
    mapRow.style.visibility = "visible";

    url = "https://efood-analytics.herokuapp.com/api/v1/efood?maps=true";

    const progressBar = ` 
      <div class="progress w-100 position-absolute w-100 top-0" style="z-index:2">
        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="100" aria-valuemin="100" aria-valuemax="100" style="width: 100%">Loading, please wait...</div>
      </div>
    `;
    uploadContainer.insertAdjacentHTML("beforeend", progressBar);

    window.addEventListener("beforeunload", (event) => {
      // Cancel the event as stated by the standard.
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";
    });
  } else {
    mapRow.style.display = "none";
    mapRow.style.visibility = "hidden";
    url = "https://efood-analytics.herokuapp.com/api/v1/efood?maps=false";
  }

  axios({
    method: "post",
    url,
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then(function (response) {
      //Remove event listener on window for refreshing the page
      window.removeEventListener(
        "beforeunload",
        (event) => {
          // Cancel the event as stated by the standard.
          event.preventDefault();
          // Chrome requires returnValue to be set.
          event.returnValue = "";
        },
        true
      );

      //Enable again map switcher
      switchMapInput.disabled = false;

      //Remove progress bar
      let progress = document.querySelector(".progress");
      if (progress) progress.remove();

      //Remove loading class from upload box

      uploadBox.classList.remove("loading");

      //Remove overflow hidden from body
      document.body.style.overflow = "visible";

      //Make sure that user is top of the page to check the counters animating ;)
      window.scroll({ top: 0, left: 0, behavior: "smooth" });

      //Update Chart
      let orders = response.data.data.ordersByYear;
      let ordersByPrice = response.data.data.ordersByYearAndPrice;
      let stores = response.data.data.filteredStores;

      console.log(response.data);

      if (switchMapInput.checked) {
        let coords = [];
        stores.forEach((store) => {
          let storeLink = store.link;
          let storeName = store.name;
          let storeImage = store.image;
          let storeTimes = store.times;
          let storeAmount = store.amount;
          let latitude = store.gps.x;
          let longitude = store.gps.y;
          coords.push([latitude, longitude]);
          marker = new L.marker([latitude, longitude], {
            title: storeName,
            icon: L.icon({
              iconUrl: storeImage,
              iconSize: [50, 50],
              iconAnchor: [25, 25],
              popupAnchor: [0, -15],
            }),
          }).bindPopup(
            ` <a class="text-center" href=${storeLink} target="_blank" rel="noreferrer">
                      ${storeName}
                    </a>
                    <p class="text-center">Times: <b>${storeTimes}</b></h1>
                    <p class="text-center">Total spent: <b>${formatter.format(
                      storeAmount
                    )}</b></h1>
                  `
          );
          storesLayer.addLayer(marker);
        });
        var bounds = new L.LatLngBounds(coords);
        map.fitBounds(bounds);
      }

      let chartLabelsOrdersPerYear = [];
      let chartDataOrdersPerYear = [];
      let chartDataMoneyPerYear = [];

      for (data in orders) {
        chartLabelsOrdersPerYear.push(data);
        chartDataOrdersPerYear.push(orders[data]);
      }

      for (data in ordersByPrice) {
        chartDataMoneyPerYear.push(
          parseFloat(ordersByPrice[data].price).toFixed(2)
        );
      }

      myChart.data.labels = chartLabelsOrdersPerYear;
      myChart.data.datasets[0].data = chartDataOrdersPerYear;
      myChart.data.datasets[1].data = chartDataMoneyPerYear;

      myChart.update();

      //Update first,last, total orders, total spending, frequent store, frequent product and payment types
      firstOrder.innerHTML = response.data.data.firstOrder;
      lastOrder.innerHTML = response.data.data.lastOrder;
      totalOrders.innerHTML = response.data.data.totalOrders;
      totalOrders.setAttribute("data-target", response.data.data.totalOrders);
      totalAmount.innerHTML = response.data.data.total;

      uniqueStores.innerHTML = Object.keys(
        response.data.data.filteredStores
      ).length;
      uniqueStores.setAttribute(
        "data-target",
        Object.keys(response.data.data.filteredStores).length
      );

      let paymentType = response.data.data.paymentTypeOccurrences;
      for (type in paymentType) {
        if (type.includes("μετρητά")) {
          cashTotal.innerHTML = paymentType[type];
          cashTotal.setAttribute("data-target", paymentType[type]);
        } else if (type.includes("κάρτα")) {
          creditCardTotal.innerText = paymentType[type];
          creditCardTotal.setAttribute("data-target", paymentType[type]);
        } else {
          paypalTotal.innerText = paymentType[type];
          paypalTotal.setAttribute("data-target", paymentType[type]);
        }
      }

      totalAmount.setAttribute(
        "data-target",
        response.data.data.total
          .toString()
          .replace(".", "")
          .replace(",", ".")
          .replace(/\s/g, "")
          .replace("€", "")
      );

      totalTips.innerText = response.data.data.tipsCounter;

      frequentStoreSelector.innerHTML = response.data.data.frequentStore.name;
      frequentProductSelector.innerHTML =
        response.data.data.frequentProduct.name;
      frequentProductTimesSelector.innerHTML =
        response.data.data.frequentProduct.times + " times";
      frequentStoreTimes.innerHTML =
        response.data.data.frequentStore.times + " times";

      //Update link for the most frequent store

      salesLink[0].href = response.data.data.frequentStore.link;

      //Update frequent store image
      frequentImageStore[0].src = response.data.data.frequentStore.image;
      let topTenOrders = response.data.data.topTenOrders;

      //Update top ten orders

      topTenOrdersTable.innerHTML = "";

      Object.keys(topTenOrders).forEach((key, index) => {
        let row = document.createElement("tr");
        let orderID = document.createElement("td");
        let storeName = document.createElement("td");
        let date = document.createElement("td");
        let time = document.createElement("td");
        let products = document.createElement("td");
        let money = document.createElement("td");

        orderID.innerHTML = topTenOrders[key].orderID;
        storeName.innerHTML = `<a class="d-inline-block" href=${topTenOrders[key].store.link} target="_blank" rel="noreferrer"> ${topTenOrders[key].store.name}</a>`;
        date.innerHTML = topTenOrders[key].date;
        time.innerHTML = topTenOrders[key].time;
        products.innerHTML = `
         <i class="fas fa-info bg-success text-white p-1 cursor-pointer product-info" data-id=${topTenOrders[key].orderID} title="Click to see your products"></i>`;
        money.innerHTML = topTenOrders[key].money;

        row.appendChild(orderID);
        row.appendChild(storeName);
        row.appendChild(date);
        row.appendChild(time);
        row.appendChild(products);
        row.appendChild(money);

        topTenOrdersTable.appendChild(row);
      });

      //Handle button click on Chart JS

      let buttons = topTenOrdersTable.querySelectorAll(".product-info");

      buttons.forEach((button) => {
        button.addEventListener("click", (e) => {
          let ID = e.target.dataset.id;
          let products = [];
          topTenOrders.filter((order) => {
            if (order.orderID == ID) {
              order.products.forEach((product) => {
                products.push(product);
              });
            }
          });

          createModal(ID, products);
        });
      });

      //Animate counters
      counterAnimationHandler();
      //Fade out upload box
      FadeOutUploadArea();
    })
    .catch(function (error) {
      console.log(error);

      //Enable again map switcher
      switchMapInput.disabled = false;

      //Remove progress bar
      let progress = document.querySelector(".progress");
      if (progress) progress.remove();

      //Remove loading class from upload box
      setTimeout(() => {
        uploadBox.classList.remove("loading");
      }, 500);

      //Check if user has internet connection

      if (error.message === "Network Error") {
        if (window.navigator.onLine) {
          TriggerToastify(
            "Server Error. Please try again later.",
            ToastifyAlertColor
          );
        } else {
          TriggerToastify(
            "Please check your internet connection and try again.",
            ToastifyAlertColor
          );
        }
      }
      TriggerToastify(error.response.data.error, ToastifyAlertColor);
    });
}

//Validate file before uploading it and request on API
function validate_fileupload(fileName) {
  var allowed_extensions = new Array("shtml", "html", "ehtml", "shtm", "htm");
  var file_extension = fileName.split(".").pop().toLowerCase();
  for (var i = 0; i <= allowed_extensions.length; i++) {
    if (allowed_extensions[i] == file_extension) {
      return true; // valid file extension
    }
  }

  return false;
}

if (isTouchDevice()) {
  TriggerToastify(
    "This app is compatible with touch devices only if you have the .HTML file. ",
    ToastifyInfoColor
  );
}

//Prevent on window dragging
window.addEventListener(
  "dragover",
  function (e) {
    e.preventDefault();
  },
  false
);
window.addEventListener(
  "drop",
  function (e) {
    e.preventDefault();
  },
  false
);

//Handle next button click
nextIcon.forEach(function (element) {
  element.onclick = function () {
    let elActive = 0;

    uploadAreaSteps.forEach((element, index) => {
      if (element.classList.contains("active")) {
        elActive = index;
        element.classList.remove("active");
      }
    });

    uploadAreaSteps[elActive + 1].classList.add("active");
  };
});
//Handle previous button click

prevIcon.forEach(function (element) {
  element.onclick = function () {
    let elActive = 0;

    uploadAreaSteps.forEach((element, index) => {
      if (element.classList.contains("active")) {
        elActive = index;
        element.classList.remove("active");
      }
    });

    uploadAreaSteps[elActive - 1].classList.add("active");
  };
});

//Manipulate form to trigger upload
uploadArea.addEventListener("click", (e) => {
  if (
    e.target === switchMapInput ||
    e.target.classList.contains("form-check-label") ||
    e.target.classList.contains("fa-info-circle") ||
    e.target.classList.contains("form-check")
  )
    return;
  uploadInput.click();
});

uploadInput.onchange = function (e) {
  let file = e.target.files[0];
  if (file && validate_fileupload(file.name)) {
    var formData = new FormData();
    formData.append("analytics", file);
    uploadFile(formData);
  } else {
    TriggerToastify(
      "Invalid file type. Please upload a valid file.",
      ToastifyAlertColor
    );
  }
};

uploadArea.addEventListener("dragover", function (e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.add("drag-active");
});
uploadArea.addEventListener("dragleave", function (e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove("drag-active");
});
uploadArea.addEventListener("drop", function (e) {
  uploadArea.classList.remove("drag-active");
  e.preventDefault();
  e.stopPropagation();
  let file = e.dataTransfer.files[0];
  if (file && validate_fileupload(file.name)) {
    var formData = new FormData();
    formData.append("analytics", file);
    uploadFile(formData);
  } else {
    TriggerToastify(
      "Invalid file type. Please upload a valid file.",
      ToastifyAlertColor
    );
  }
});

//Prevent default of the form submit
form.onsubmit = function (e) {
  e.preventDefault();
};

//Handle reset button click
resetButton.addEventListener("click", (e) => {
  e.preventDefault();
  uploadInput.value = "";
  uploadAreaSteps.forEach((element, index) => {
    element.classList.remove("active");
    if (index == 0) {
      element.classList.add("active");
    }
  });
  uploadContainer.style.display = "flex";
  uploadContainer.style.opacity = "1";
});

//Chart JS
const chart = document.getElementById("chart");
const labels = ["2016", "2017", "2018", "2019", "2020", "2021"];
let ChartData = {
  labels: labels,
  datasets: [
    {
      label: "Orders per Year",
      backgroundColor: "#ed2e2e",
      borderColor: "#ed2e2e",
      data: ["23", "150", "98", "60", "121", "50"],
    },
    {
      label: "Money per Year",
      backgroundColor: "#118C4F",
      borderColor: "#118C4F",
      data: ["23 ", "150", "98", "60", "121", "50"],
    },
  ],
};

//Chart JS Config
const config = {
  type: "bar",
  data: ChartData,
  responsive: true,
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label === "Money per Year") {
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += formatter.format(context.parsed.y);
              }
            } else {
              label = `${context.dataset.label}: ${context.parsed.y} `;
            }

            return label;
          },
        },
      },
      legend: {
        labels: {
          color: "white",
          font: {
            size: 16,
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          drawBorder: false,
          color: "rgba(255,255,255,0.05)",
        },
        ticks: {
          color: "white",
          font: {
            size: 14,
          },
          stepSize: 1,
          beginAtZero: true,
        },
      },
      y: {
        grid: {
          drawBorder: false,
          color: "rgba(255,255,255,0.05)",
        },
      },
    },
  },
};
const myChart = new Chart(chart, config);

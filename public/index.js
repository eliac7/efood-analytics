let form = document.querySelector("form");
let formLogin = document.querySelector('form[id="login"]');
let uploadContainer = document.querySelector(".upload-container");
let uploadBox = document.querySelector(".upload-box");
let submitButton = document.querySelector('button[type="submit"]');
let passwordField = document.querySelector('input[type="password"]');

//Analytics selectors
let nameSelector = document.getElementById("name");
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

let ToastifyAlertColor = "#cc3300";
let ToastifyInfoColor = "#7db0b1";
let ToastifySuccessColor = "#00C851";

//Vanilla JS Fade out animation
function FadeOutUploadArea() {
  var s = uploadContainer.style;
  s.opacity = 1;
  (function fade() {
    (s.opacity -= 0.1) < 0 ? (s.display = "none") : setTimeout(fade, 40);
  })();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  // submitButton.disabled = true;
  const formData = new FormData(e.target);
  const object = {};
  formData.forEach((value, key) => (object[key] = value));
  const json = object;

  try {
    const data = await axios.post("/api/v1/efood", json);
    const res = await data.data;

    //Fade out login area

    // FadeOutUploadArea();

    //remove overflow hidden from body
    document.body.style.overflow = "visible";

    //Make sure that user is top of the page to check the counters animating ;)
    window.scroll({ top: 0, left: 0, behavior: "smooth" });

    //Change name
    nameSelector.innerText = res.name;

    //Add restaurants on the map

    let coords = [];
    res.restaurants.forEach((r) => {
      const {
        name,
        longitude,
        latitude,
        logo,
        times,
        amount,
        details,
        is_open,
      } = r;
      coords.push([latitude, longitude]);
      marker = new L.marker([latitude, longitude], {
        title: name,
        icon: L.icon({
          iconUrl: logo,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
          popupAnchor: [0, -15],
        }),
      }).bindPopup(
        ` <a class="text-center" href=${
          "https://www.e-food.gr/delivery" + details.slug
        } target="_blank" rel="noreferrer">
                  ${name}
                </a>
                <p class="text-center">Times: <b>${times}</b></h1>
                <p class="text-center">Total spent: <b>${formatter.format(
                  amount
                )}</b></h1>
                <p class="text-center">Is open: <b>${
                  is_open
                    ? '<i class="fa-solid fa-check text-success"></i>'
                    : '<i class="fa-solid fa-circle-xmark text-danger"></i>'
                }</b></h1>
              `
      );
      storesLayer.addLayer(marker);
    });

    var bounds = new L.LatLngBounds(coords);
    map.fitBounds(bounds);
  } catch (error) {
    if (error) {
      TriggerToastify(error || error.response.data.error, ToastifyAlertColor);
      // passwordField.value = "";
      submitButton.disabled = false;
    }
  }
});

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

//Chart JS
const chart = document.getElementById("chart");
const labels = ["2016", "2017", "2018", "2019", "2020", "2021", "2022"];
let ChartData = {
  labels: labels,
  datasets: [
    {
      label: "Orders per Year",
      backgroundColor: "#ed2e2e",
      borderColor: "#ed2e2e",
      data: ["23", "150", "98", "60", "121", "50", "70"],
    },
    {
      label: "Money per Year",
      backgroundColor: "#118C4F",
      borderColor: "#118C4F",
      data: ["23 ", "150", "98", "60", "121", "50", "70"],
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

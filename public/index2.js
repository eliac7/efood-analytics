window.addEventListener("load", function () {
  //Form selectors
  const form = document.querySelector("form");
  const loading = document.querySelector(".login-form .loading");
  const quoteSelector = document.querySelector("#quote");
  const email = document.querySelector('input[name="email"]');
  const password = document.querySelector('input[name="password"]');
  const passwordEye = document.querySelector(".fa-eye-slash");
  let coords = [];

  //Quotes about food

  function getQuotes(disable) {
    const quotes = [
      "Ξέρατε ότι πιθανότατα οι Αρχαίοι Έλληνες ήταν αυτοί που φύτεψαν πρώτοι ελιές στην περιοχή της Μεσογείου, συμπεριλαμβανομένης της ανατολικής Ισπανίας, της νότιας Γαλλίας και της νότιας Ιταλίας;",
      "Αν και πολλοί συνδέουν την ελληνική κουζίνα με πιάτα όπως το αρνί, το σουβλάκι, το «κλέφτικο» και τη φέτα, στην πραγματικότητα στην αυθεντική ελληνική κουζίνα κυριαρχούν τα λαχανικά, τα πουλερικά, τα θαλασσινά κι όχι το κρέας. ",
      "Ξέρατε ότι η συνταγή για σουβλάκι είναι γνωστή από την ελληνική αρχαιότητα; Χαρακτηριστική είναι η αναφορά του Αθήναιου στο έργο του Δειπνοσοφιστές, ότι ο Ηγήσιππος στον οδηγό μαγειρικής που έγραψε, αναφέρει ένα έδεσμα που λεγόταν κάνδαυλος και ήταν κάτι ανάλογο με το σημερινό σουβλάκι-καλαμάκι. Συνδύαζε κομμάτια από ψητό κρέας, πίτα, τυρί και άνηθο και σερβιριζόταν με ζουμί.",
      "Ένα σουβλάκι μπορεί να περιέχει από 180 έως 480 θερμίδες",
      "Τα ζαχαρούχα ποτά είναι η πιο παχυντική πτυχή της σύγχρονης διατροφής",
      "Το μέλι προκαλεί στο σάκχαρο του αίματος την ίδια απόκριση όπως η ζάχαρη και το σιρόπι φρουκτόζης, με όλες τις σχετικές συνέπειες για την υγεία. Μην το κόψεις, απλά κατανάλωνέ το με μέτρο.",
    ];
    //loop through the quotes and return one at random every 5 seconds
    const interval = setInterval(function () {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      quoteSelector.innerHTML = randomQuote;
    }, 10000);
    //stop the interval
    if (disable) {
      clearInterval(interval);
    }
  }

  //Vanilla JS Fade out animation and bring results container back
  function FadeOutLoginAndBringResults() {
    const s = document.querySelector(".outer-container").style;
    s.opacity = 1;
    (function fade() {
      (s.opacity -= 0.1) < 0 ? (s.display = "none") : setTimeout(fade, 40);
    })();
    //bring results in
    setTimeout(function () {
      document
        .querySelector(".outer-results-container")
        .classList.remove("d-none");
      //add fade in class
      document
        .querySelector(".outer-results-container")
        .classList.add("fade-in");
      //Re render map to get the correct size
      map.invalidateSize();
      const bounds = new L.LatLngBounds(coords);
      map.fitBounds(bounds);
    }, 1000);
  }

  //Create new Bootstrap Model for the products
  function createModal(storeName, productsArray) {
    let products = productsArray.products;
    let modal = document.getElementById("productsModal");
    if (modal) {
      modal.parentNode.removeChild(modal);
    }

    let html = `
<div class="modal fade" id="productsModal" tabindex="-1" aria-labelledby="productsModalLabel" aria-hidden="true">
<div class="modal-dialog">
   <div class="modal-content">
      <div class="modal-header">
         <h5 class="modal-title" style="var(--background-color)"><span class="text-secondary"></span> ${storeName}</h5>

         <button type="button" class="btn-close ${
           document
             .querySelector(".toggle")
             .classList.contains("toggle--active")
             ? "btn-close-white"
             : ""
         }" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Όνομα προϊόντος</th>
            <th scope="col">Ποσότητα</th>
            <th scope="col">Τιμή</th>
          </tr>
        </thead>
        ${products
          .map((product) => {
            return `
          <tr>
            <td>${product.name}</td>
            <td>${product.quantity}</td>
            <td>${formatter.format(
              Number(product.quantity * product.full_price)
            )}</td>
          </tr>
          `;
          })
          .join("")}
          ${
            productsArray.tip
              ? `
               <tr>
                <td>Φιλοδώρημα</td>
                <td>1</td>
                <td>${formatter.format(Number(productsArray.tip))}</td>
              </tr>
          `
              : ""
          }
          ${
            productsArray.delivery_cost
              ? `
               <tr>
                <td>Κόστος αποστολής</td>
                <td>1</td>
                <td>${formatter.format(
                  Number(productsArray.delivery_cost)
                )}</td>
              </tr>
          `
              : ""
          }

          
        <tbody>
        </tbody>
      </table>
      </div>
     
   </div>
</div>
</div>

`;
    document.body.insertAdjacentHTML("beforeend", html);

    const myModal = new bootstrap.Modal(
      document.getElementById("productsModal"),
      {}
    );
    myModal.show();
  }

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

  //Currency formatter
  const formatter = new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  });

  //Add year on the footer
  document.querySelector(".year").innerHTML = new Date().getFullYear();

  //Handle the eye icon to show/hide the password

  passwordEye.addEventListener("click", () => {
    if (passwordEye.classList.contains("fa-eye-slash")) {
      passwordEye.classList.remove("fa-eye-slash");
      passwordEye.classList.add("fa-eye");
      password.type = "text";
    } else {
      passwordEye.classList.remove("fa-eye");
      passwordEye.classList.add("fa-eye-slash");
      password.type = "password";
    }
  });

  //Handle dark mode for chartJS charts
  document.querySelector(".toggle_wrapper").addEventListener("click", () => {
    if (
      //dark mode enabled
      document.querySelector(".toggle").classList.contains("toggle--active")
    ) {
      configBar.options.scales.x.ticks.color = "#fff";
      configBar.options.scales.y.ticks.color = "#fff";
      configBar.options.plugins.legend.labels.color = "#fff";

      barChart.update();
    } else {
      configBar.options.scales.x.ticks.color = "#121212";
      configBar.options.scales.y.ticks.color = "#121212";
      configBar.options.plugins.legend.labels.color = "#121212";
      barChart.update();
    }
  });

  //On blur or on input handle the validation
  "blur input".split(" ").forEach((e) => {
    email.addEventListener(e, function () {
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!emailRegex.test(email.value)) {
        email.classList.add("is-invalid");
      } else {
        email.classList.remove("is-invalid");
      }
      if (email.value.length == 0) {
        email.classList.remove("is-invalid");
      }
    });
  });

  //Swiper
  new Swiper(".swiper", {
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    spaceBetween: 30,

    pagination: {
      el: ".swiper-pagination",
    },
  });

  //Chart.js (Pie) for payment methods
  const data = {
    labels: ["Μετρητά", "Πιστωτική κάρτα", "PayPal"],
    datasets: [
      {
        data: [300, 50, 100],
        backgroundColor: ["#C60C30", "#F79E1B", "#3b7bbf"],
      },
    ],
  };
  const config = {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: "Αγορές ανα μέθοδο πληρωμής",
        },
      },
    },
  };
  const piePayments = new Chart("pieChart", config);

  //Chart.js (Pie) for operating systems
  const dataOS = {
    labels: ["Web", "iOS", "Android"],
    datasets: [
      {
        data: [300, 50, 100],
        backgroundColor: ["#2471A3", "#A2AAAD", "#a4c639 "],
      },
    ],
  };
  const configOS = {
    type: "pie",
    data: dataOS,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: "Αγορές ανα πλατφόρμα ",
        },
      },
    },
  };
  const pieOS = new Chart("pieChartOS", configOS);

  //Chart.js (Bar) for products
  const chart = document.getElementById("chart");
  const labels = ["2016", "2017", "2018", "2019", "2020", "2021", "2022"];
  let ChartData = {
    labels: labels,
    datasets: [
      {
        label: "Παραγγελίες ανα χρόνο",
        backgroundColor: "#ed2e2e",
        borderColor: "#ed2e2e",
        data: ["23", "150", "98", "60", "121", "50", "70"],
      },
      {
        label: "Χρήματα ανα χρόνο",
        backgroundColor: "#118C4F",
        borderColor: "#118C4F",
        data: ["23 ", "150", "98", "60", "121", "50", "70"],
      },
    ],
  };

  //Chart JS Config
  const configBar = {
    type: "bar",
    data: ChartData,
    responsive: true,
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label === "Χρήματα ανα χρόνο") {
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
            color:
              this.localStorage.getItem("theme") === "dark"
                ? "#fff"
                : "#121212",
            font: {
              size: 16,
            },
          },
          position: "bottom",
        },
      },
      scales: {
        x: {
          grid: {
            drawBorder: false,
            color: "rgba(255,255,255,0.5)",
          },
          ticks: {
            color:
              this.localStorage.getItem("theme") === "dark"
                ? "#fff"
                : "#121212",
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
            color: "rgba(255,255,255,0.5)",
          },
          ticks: {
            color:
              this.localStorage.getItem("theme") === "dark"
                ? "#fff"
                : "#121212",
          },
        },
      },
    },
  };
  const barChart = new Chart(chart, configBar);

  //Leaflet JS
  const map = L.map("map", {
    gestureHandling: true,
    gestureHandlingOptions: {
      duration: 4000,
      text: {
        touch: "Χρησιμοποιήστε δύο δάκτυλα για να κινήσετε το χάρτη",
        scroll: "Χρησιμοποιήστε το CTRL + ροδέλα για να κυλήσετε το χάρτη",
        scrollMac: "Χρησιμοποιήστε το \u2318 + ροδέλα για να κυλήσετε το χάρτη",
      },
    },
  }).setView([37.9908997, 23.70332], 13);

  L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
      maxZoom: 18,
      id: "mapbox/streets-v11",
      tileSize: 512,
      zoomOffset: -1,
      accessToken:
        "pk.eyJ1IjoiZWxpYWM3IiwiYSI6ImNrcjZ1d3pqczA5dDIybm1hbndkYzA3cWUifQ.oCsZHSmdgFiahDuozJWNOg",
      className: "map-tiles",
    }
  ).addTo(map);
  const storesLayer = L.layerGroup().addTo(map);
  const controlSearch = new L.Control.Search({
    layer: storesLayer,
    initial: false,
    zoom: 16,
    marker: false,
    textErr: "Δεν βρέθηκε κανένα αποτέλεσμα",
    textPlaceholder: "Αναζήτηση καταστήματος",
    textCancel: "Ακύρωση",
  });

  map.addControl(controlSearch);

  //Open popup when controlSearch find a result
  controlSearch.on("search:locationfound", function (e) {
    if (e.layer._popup) e.layer.openPopup();
  });

  //Handle form submit
  form.addEventListener("submit", async function (event) {
    getQuotes();
    event.preventDefault();
    form.querySelector("button[type='submit']").disabled = true;
    loading.classList.add("loading--active");
    const formData = new FormData(event.target);
    const object = {};
    formData.forEach((value, key) => (object[key] = value));
    const loginData = object;

    try {
      const res = await axios.post("/api/v1/efood", loginData);
      const data = await res.data;

      //Cancel interval
      getQuotes(true);

      ///////////////////////////////SELECTORS///////////////////////////////

      //Name selector
      const name = (document.querySelector(".welcome-text-name").innerText =
        data.name);
      //First order selector
      document.querySelector(".first-order .info p").innerHTML =
        data.firstOrder;

      //Latest order selector
      document.querySelector(".last-order .info p").innerHTML = data.lastOrder;

      //Total order selector
      document.querySelector(".total-order .info p").innerHTML =
        data.totalOrders;

      //Total spendings selector
      document.querySelector(".total-spending .info p").innerHTML =
        formatter.format(data.totalPrice);

      //Total tips selector
      document.querySelector(".total-tips .info p").innerHTML =
        formatter.format(data.totalTips);

      //Unique restaurants selector
      document.querySelector(".unique-restaurants .info p").innerHTML =
        data.restaurants.length;

      //Frequent store
      //Frequent store logo
      document.querySelector(".frequent-store").src = data.restaurants[0].logo;
      //Frequent store title
      document.querySelector(".frequent-store-container .info p").innerHTML =
        data.restaurants[0].name;
      //Frequent store times
      document.querySelector(
        ".frequent-store-container .info p:last-child"
      ).innerHTML =
        data.restaurants[0].times +
        " φορές " +
        "με σύνολο " +
        formatter.format(data.restaurants[0].amount);

      //Frequent product
      //Frequent prduct logo
      document.querySelector(".frequent-product").src =
        data.frequentProduct.image;

      //Frequent product name
      document.querySelector(".frequent-product-container .info p").innerHTML =
        data.frequentProduct.name;

      //Frequent product times
      document.querySelector(
        ".frequent-product-container .info p:last-child"
      ).innerHTML =
        data.frequentProduct.quantity +
        " φορές " +
        "με σύνολο " +
        formatter.format(data.frequentProduct.price);

      //Medium time selector
      document.querySelector(".medium-time .info p").innerHTML =
        data.mediumDeliveryTime + "'";

      //Delivered by efood selector
      //Firstly we need to check if the user has delivered by efood
      if (data.deliveryCost) {
        document.querySelector(".delivered-by-efood .info p").innerHTML =
          formatter.format(data.deliveryCost);
      } else {
        document.querySelector(".delivered-by-efood").classList.add("d-none");
      }

      //Coupon selector
      //Firstly we need to check if the user has used a coupon
      if (data.couponAmount) {
        document.querySelector(".coupon-container .info p").innerHTML =
          formatter.format(data.couponAmount);
      } else {
        document.querySelector(".coupon-container").classList.add("d-none");
      }

      document.querySelector(".number-orders").innerHTML =
        data.tenRecentOrders.length;
      ///////////////////////////////END OF SELECTORS///////////////////////////////

      ///////////////////////////////SIMPLE DATATABLE///////////////////////////////

      let dataTable = new simpleDatatables.DataTable("#ordersTable", {
        searchable: false,
        responsive: true,
        pagination: true,
        perPage: 5,
        perPageSelect: [5, 10],
        labels: {
          perPage: "{select} παραγγελίες ανά σελίδα",
          noRows: " Δεν βρέθηκαν παραγγελίες",
          info: " Εμφανίζονται {start} έως {end} από {rows} παραγγελίες",
        },
        columns: [
          {
            select: 2,
            type: "date",
            format: "DD/MM/YYYY",
          },
          {
            select: 3,
            type: "time",
            format: "HH:mm:ss",
          },
          {
            select: 4,
            sortable: false,
            //render a green button
            render: function (data, cell, row) {
              return `<div class="product-info"><i class="fas fa-info text-white p-1 pe-none" data-id=${data} title="Click to see your products"></i></div>`;
            },
          },
          {
            select: 5,
            type: "number",
            sortable: false,
          },
        ],
        data: {
          headings: [
            "Αρ. παραγγελίας",
            "Όνομα εστιατορίου",
            "Ημερομηνία παραγγελίας",
            "Ώρα παραγγελίας",
            "Προϊόντα",
            "Σύνολο",
          ],
          data: data.tenRecentOrders.map((order) => {
            let { submission_date } = order;
            let dateObj = new Date(submission_date);
            let dateResult = dateObj.toLocaleDateString("el-GR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
            let timeResult = dateObj.toLocaleTimeString("el-GR", {
              hour12: false,
            });
            return [
              order.id,
              order.name,
              dateResult,
              timeResult,
              order.id,
              formatter.format(order.price),
            ];
          }),
        },
      });

      //catch product info click

      dataTable.body.addEventListener("click", (e) => {
        let target = e.target.children[0];
        if (target && target.classList.contains("fas") && target.dataset.id) {
          //get the id of the clicked element
          let id = target.dataset.id;
          //get the products of the order
          let products = data.tenRecentOrders.find((order) => order.id == id);
          createModal(products?.name, products);
        }
      });

      ///////////////////////////////END OF SIMPLE DATATABLE///////////////////////////////

      //Lower opacity of Star rating
      document.querySelector(".star").style.opacity = 0.7;

      //Enable logout button

      document.querySelector(".logout").classList.remove("d-none");

      //Handle click of logout button
      document.querySelector(".logout").addEventListener("click", () => {
        //just refresh the page
        window.location.reload();
      });

      //PIES
      //Update pie chart with payment methods
      piePayments.data.datasets[0].data = [
        data.paymentMethods.cash,
        data.paymentMethods.credit_card,
        data.paymentMethods.paypal,
      ];
      piePayments.update();

      //Update pie chart with operating systems
      configOS.data.datasets[0].data = [
        data.platforms.web,
        data.platforms.ios,
        data.platforms.android,
      ];
      pieOS.update();

      //Bar chart

      //Firstly add labels to the bar chart
      let labels = [];
      let timesPerYear = [];
      let amountPerYear = [];

      for (let year in data.ordersByYear) {
        labels.push(year);
        timesPerYear.push(data.ordersByYear[year].times);
        amountPerYear.push(data.ordersByYear[year].amount);
      }

      //Update bar chart with data
      barChart.data.labels = labels;
      barChart.data.datasets[0].data = timesPerYear;
      barChart.data.datasets[1].data = amountPerYear;

      barChart.update();

      //Add cords to map

      data.restaurants.forEach((r) => {
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
                <p class="text-center">Φορές: <b>${times}</b></h1>
                <p class="text-center">Σύνολο δαπανών: <b>${formatter.format(
                  amount
                )}</b></h1>
                <p class="text-center">Εξυπηρετεί αυτή τη στιγμή: <b>${
                  is_open
                    ? '<i class="fa-solid fa-check text-success"></i>'
                    : '<i class="fa-solid fa-circle-xmark text-danger"></i>'
                }</b></h1>
              `
        );
        storesLayer.addLayer(marker);
      });

      //Fade out login form and fade in the results
      FadeOutLoginAndBringResults();
    } catch (error) {
      console.log(error);
      //empty password field
      document.querySelector("input[type='password']").value = "";
      //make submit button active
      form.querySelector("button[type='submit']").disabled = false;
      //remove loading class
      loading.classList.remove("loading--active");
      if (error.response.data.error) {
        TriggerToastify(error.response.data.error, "#cc3300");
      } else {
        TriggerToastify(error, "#cc3300");
      }
    }
  });
});

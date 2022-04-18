window.addEventListener("load", function () {
  //Form selectors
  const form = document.querySelector("form");
  const loading = document.querySelector(".login-form .loading");
  const quoteSelector = document.querySelector("#quote");
  const email = document.querySelector('input[name="email"]');
  const password = document.querySelector('input[name="password"]');
  const passwordEye = document.querySelector(".fa-eye-slash");

  //Quotes about food

  function getQuotes() {
    const quotes = [
      "Ξέρατε ότι πιθανότατα οι Αρχαίοι Έλληνες ήταν αυτοί που φύτεψαν πρώτοι ελιές στην περιοχή της Μεσογείου, συμπεριλαμβανομένης της ανατολικής Ισπανίας, της νότιας Γαλλίας και της νότιας Ιταλίας;",
      "Αν και πολλοί συνδέουν την ελληνική κουζίνα με πιάτα όπως το αρνί, το σουβλάκι, το «κλέφτικο» και τη φέτα, στην πραγματικότητα στην αυθεντική ελληνική κουζίνα κυριαρχούν τα λαχανικά, τα πουλερικά, τα θαλασσινά κι όχι το κρέας. ",
      "Ξέρατε ότι η συνταγή για σουβλάκι είναι γνωστή από την ελληνική αρχαιότητα; Χαρακτηριστική είναι η αναφορά του Αθήναιου στο έργο του Δειπνοσοφιστές, ότι ο Ηγήσιππος στον οδηγό μαγειρικής που έγραψε, αναφέρει ένα έδεσμα που λεγόταν κάνδαυλος και ήταν κάτι ανάλογο με το σημερινό σουβλάκι-καλαμάκι. Συνδύαζε κομμάτια από ψητό κρέας, πίτα, τυρί και άνηθο και σερβιριζόταν με ζουμί.",
      "Ένα σουβλάκι μπορεί να περιέχει από 180 έως 480 θερμίδες",
      "Τα ζαχαρούχα ποτά είναι η πιο παχυντική πτυχή της σύγχρονης διατροφής",
      "Το μέλι προκαλεί στο σάκχαρο του αίματος την ίδια απόκριση όπως η ζάχαρη και το σιρόπι φρουκτόζης, με όλες τις σχετικές συνέπειες για την υγεία. Μην το κόψεις, απλά κατανάλωνέ το με μέτρο.",
    ];
    //loop through the quotes and return one at random every 5 seconds
    setInterval(function () {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      quoteSelector.innerHTML = randomQuote;
    }, 10000);
  }

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

      console.log(data);
    } catch (error) {
      console.log(error);
    }
  });

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

    pagination: {
      el: ".swiper-pagination",
    },
  });

  //Chart.js (Pie)
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
          position: "top",
        },
        title: {
          display: true,
          text: "Αγορές ανα μέθοδο πληρωμής",
        },
      },
    },
  };
  new Chart("pieChart", config);

  //Chart.js (Pie)
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
          position: "top",
        },
        title: {
          display: true,
          text: "Αγορές ανα πλατφόρμα ",
        },
      },
    },
  };
  new Chart("pieChartOS", configOS);

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
});

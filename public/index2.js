window.addEventListener("load", function () {
  const email = document.querySelector('input[name="email"]');
  const password = document.querySelector('input[name="password"]');
  const passwordEye = document.querySelector(".fa-eye-slash");

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

  const swiper = new Swiper(".swiper", {
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },

    pagination: {
      el: ".swiper-pagination",
    },
  });
});

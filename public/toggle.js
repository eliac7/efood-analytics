/*Toggle*/
const toggle_wrapper = document.querySelector(".toggle_wrapper");
const toggle = document.querySelector(".toggle");

const localStorage = window.localStorage.getItem("theme");

if (localStorage && localStorage === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  toggle.classList.add("toggle--active");
} else {
  document.documentElement.setAttribute("data-theme", "light");
}

toggle_wrapper.addEventListener("click", () => {
  if (document.documentElement.getAttribute("data-theme") === "light") {
    document.documentElement.setAttribute("data-theme", "dark");
    window.localStorage.setItem("theme", "dark");
    toggle.classList.add("toggle--active");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    window.localStorage.setItem("theme", "light");
    toggle.classList.remove("toggle--active");
  }
});

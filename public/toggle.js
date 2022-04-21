/*Toggle*/
const toggle_wrapper = document.querySelector(".toggle_wrapper");
const toggle = document.querySelector(".toggle");
let dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const localStorage = window.localStorage.getItem("theme");

//Firstly , check if the user has a theme set in localStorage
if (localStorage) {
  //If the user has a theme set in localStorage, check if it's dark or light
  if (localStorage === "dark") {
    //If it's dark, set the toggle to dark
    toggle.classList.add("toggle--active");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    //If it's light, set the toggle to light
    toggle.classList.remove("toggle--active");
    document.documentElement.setAttribute("data-theme", "light");
  }
} else {
  //If the user doesn't have a theme set in localStorage, check if dark scheme is preferred by system
  if (dark) {
    //If prefers dark mode, set the toggle to dark
    toggle.classList.add("toggle--active");
    document.documentElement.setAttribute("data-theme", "dark");
    window.localStorage.setItem("theme", "dark");
  } else {
    //else, set the toggle to light
    toggle.classList.remove("toggle--active");
    document.documentElement.setAttribute("data-theme", "light");
  }
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

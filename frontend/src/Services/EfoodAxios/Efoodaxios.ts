import axios from "axios";

const EfoodAxios = axios.create({
  baseURL:
    import.meta.env.VITE_APP_ENV === "development"
      ? import.meta.env.VITE_APP_API_URL_DEV
      : import.meta.env.VITE_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default EfoodAxios;

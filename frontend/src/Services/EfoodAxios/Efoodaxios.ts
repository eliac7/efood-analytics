import axios from "axios";

const EfoodAxios = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default EfoodAxios;

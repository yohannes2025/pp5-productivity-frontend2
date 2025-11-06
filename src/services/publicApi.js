// src/services/publicApi.js
import axios from "axios";

const publicApi = axios.create({
  baseURL:
    process.env.REACT_APP_BACKEND_URL ||
    "https://pp5-productivity-backend2.onrender.com",
  headers: { "Content-Type": "application/json" },
});

export default publicApi;

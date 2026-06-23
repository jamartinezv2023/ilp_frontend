import axios from "axios";

export const authApi = axios.create({
  baseURL: "https://ilp-adaptive-education-service.onrender.com/api", // ðŸ”´ ajusta si tu auth-service usa otro puerto
  headers: {
    "Content-Type": "application/json",
  },
});


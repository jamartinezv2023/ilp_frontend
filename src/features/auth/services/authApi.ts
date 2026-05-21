import axios from "axios";

export const authApi = axios.create({
  baseURL: "http://localhost:8080/api", // 🔴 ajusta si tu auth-service usa otro puerto
  headers: {
    "Content-Type": "application/json",
  },
});

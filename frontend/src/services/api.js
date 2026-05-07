import axios from "axios";
import { getToken, clearAuth } from "../utils/auth";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ─── Request: gắn token ─────────────────────
API.interceptors.request.use(
  (req) => {
    const token = getToken();

    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    // 🔥 LOG để debug
    console.log("👉 API CALL:", req.baseURL + req.url);

    return req;
  },
  (err) => Promise.reject(err)
);

// ─── Response ───────────────────────────────
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    console.error("❌ API ERROR:", err.config?.url, status);

    if (status === 401) {
      clearAuth();
      window.location.href = "/";
    }

    if (status === 403) {
      console.warn("[API] 403 Forbidden:", err.config?.url);
    }

    if (!err.response) {
      console.error("[API] Không thể kết nối server");
    }

    return Promise.reject(err);
  }
);

export default API;
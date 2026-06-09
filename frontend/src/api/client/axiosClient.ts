// ============================================================
// DevTrace — Axios Client Instance
// ============================================================

import axios from "axios";
import { API_CONFIG } from "../constants/config";
import { setupInterceptors } from "./interceptors";

export const axiosClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure client through interceptors module
setupInterceptors(axiosClient);

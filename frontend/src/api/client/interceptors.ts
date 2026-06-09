// ============================================================
// DevTrace — Axios Interceptors
// ============================================================

import { AxiosInstance, AxiosError } from "axios";
import { ApiErrorResponse } from "../types";

export function setupInterceptors(axiosInstance: AxiosInstance) {
  // Request interceptor: logging and headers setup
  axiosInstance.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: logging, error mapping and central code handling
  axiosInstance.interceptors.response.use(
    (response) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error: AxiosError<ApiErrorResponse>) => {
      let message = "An unexpected error occurred.";
      const status = error.response?.status;

      if (!error.response) {
        // Network failures
        message = "Unable to connect to DevTrace servers. Please try again.";
      } else if (status === 400) {
        message = "Unable to access repository. Please verify the repository URL.";
      } else if (status === 404) {
        message = "No contributions found for the specified GitHub user.";
      } else if (status === 500) {
        message = "DevTrace services are temporarily unavailable.";
      } else if (status === 409) {
        message = "A similar analysis job is already in progress.";
      } else if (status === 429) {
        message = "Too many requests. Please slow down and try again later.";
      } else if (error.response.data && typeof error.response.data.message === "string") {
        message = error.response.data.message;
      }

      const mappedError: ApiErrorResponse = {
        message,
        status,
        code: error.code,
      };

      if (process.env.NODE_ENV === "development") {
        console.error(`[API Error] ${status || "Network"} - ${message}`, error);
      }

      return Promise.reject(mappedError);
    }
  );
}

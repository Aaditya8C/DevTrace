// ============================================================
// DevTrace — API Configuration Constants
// ============================================================

export const API_CONFIG = {
  // Use env variable or fall back to localhost in dev
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  TIMEOUT: 75000,
  POLLING_INTERVAL: 2000,
};

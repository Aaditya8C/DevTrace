// ============================================================
// DevTrace — Analysis API Endpoints
// ============================================================

export const ANALYSIS_ENDPOINTS = {
  START: "/api/analysis/start",
  STATUS: (jobId: string) => `/api/analysis/${jobId}/status`,
  RESULT: (jobId: string) => `/api/analysis/${jobId}/result`,
  VERIFY: "/api/analysis/verify",
} as const;

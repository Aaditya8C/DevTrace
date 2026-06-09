// ============================================================
// DevTrace — Analysis Service Layer (Updated)
// ============================================================

import { axiosClient } from "../client/axiosClient";
import { ANALYSIS_ENDPOINTS } from "../endpoints/analysisEndpoints";
import type {
  AnalysisRequest,
  AnalysisResponse,
  JobStatusResponse,
  JobResultResponse,
} from "../types";

export const analysisService = {
  /**
   * Starts a new analysis job.
   */
  async startAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await axiosClient.post<AnalysisResponse>(
      ANALYSIS_ENDPOINTS.START,
      request
    );
    return response.data;
  },

  /**
   * Checks the status of an analysis job.
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await axiosClient.get<JobStatusResponse>(
      ANALYSIS_ENDPOINTS.STATUS(jobId)
    );
    return response.data;
  },

  /**
   * Fetches the result of a completed analysis job.
   */
  async getJobResult(jobId: string): Promise<JobResultResponse> {
    const response = await axiosClient.get<JobResultResponse>(
      ANALYSIS_ENDPOINTS.RESULT(jobId)
    );
    return response.data;
  },

  /**
   * Verifies repository access levels.
   */
  async verifyAccess(repositoryUrl: string): Promise<string> {
    const response = await axiosClient.get<string>(
      `${ANALYSIS_ENDPOINTS.VERIFY}?repositoryUrl=${encodeURIComponent(repositoryUrl)}`
    );
    return response.data;
  },
};
export type AnalysisServiceType = typeof analysisService;

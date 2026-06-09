// ============================================================
// DevTrace — Zustand Analysis Store (Updated)
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DashboardData, AnalysisStatus } from "@/types";

interface StoreState {
  repositoryUrl: string;
  githubUsername: string;
  analysisStatus: AnalysisStatus;
  jobId: string;
  progress: number;
  dashboardData: DashboardData | null;
}

interface StoreActions {
  setRepositoryUrl: (url: string) => void;
  setGithubUsername: (username: string) => void;
  startAnalysis: (url: string, username: string, jobId: string) => void;
  setJobId: (jobId: string) => void;
  setProgress: (progress: number) => void;
  setAnalysisStatus: (status: AnalysisStatus) => void;
  completeAnalysis: (data: DashboardData) => void;
  setError: () => void;
  reset: () => void;
}

const initialState: StoreState = {
  repositoryUrl: "",
  githubUsername: "",
  analysisStatus: "idle",
  jobId: "",
  progress: 0,
  dashboardData: null,
};

export const useAnalysisStore = create<StoreState & StoreActions>()(
  persist(
    (set) => ({
      ...initialState,

      setRepositoryUrl: (url: string) =>
        set({ repositoryUrl: url }),

      setGithubUsername: (username: string) =>
        set({ githubUsername: username }),

      startAnalysis: (url: string, username: string, jobId: string) =>
        set({
          repositoryUrl: url,
          githubUsername: username,
          analysisStatus: "processing",
          jobId,
          progress: 0,
          dashboardData: null,
        }),

      setJobId: (jobId: string) =>
        set({ jobId }),

      setProgress: (progress: number) =>
        set({ progress }),

      setAnalysisStatus: (status: AnalysisStatus) =>
        set({ analysisStatus: status }),

      completeAnalysis: (data: DashboardData) =>
        set({
          analysisStatus: "complete",
          dashboardData: data,
        }),

      setError: () =>
        set({
          analysisStatus: "error",
        }),

      reset: () => set(initialState),
    }),
    {
      name: "devtrace-analysis-store-v2", // using a new key to avoid migration issues
      storage: createJSONStorage(() => localStorage),
      // Persist everything including the processing progress and jobId for reload resilience
      partialize: (state) => ({
        repositoryUrl: state.repositoryUrl,
        githubUsername: state.githubUsername,
        analysisStatus: state.analysisStatus,
        jobId: state.jobId,
        progress: state.progress,
        dashboardData: state.dashboardData,
      }),
    }
  )
);
export default useAnalysisStore;

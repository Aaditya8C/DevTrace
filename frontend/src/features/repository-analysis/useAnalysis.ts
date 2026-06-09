// ============================================================
// DevTrace — Form Analysis Hook (Updated)
// ============================================================

"use client";

import { useAnalysis as useCoreAnalysis } from "@/hooks/useAnalysis";
import type { AnalysisFormValues } from "./analysisSchema";

export function useAnalysis() {
  const { submitAnalysis: coreSubmit, repositoryUrl, githubUsername } = useCoreAnalysis();

  const submitAnalysis = (values: AnalysisFormValues) => {
    coreSubmit(values.repositoryUrl, values.githubUsername);
  };

  return {
    submitAnalysis,
    defaultValues: {
      repositoryUrl,
      githubUsername,
    },
  };
}
export default useAnalysis;

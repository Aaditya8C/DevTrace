// ============================================================
// DevTrace — Real-time Processing Simulation Hook
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/hooks/useAnalysis";
import { PROCESSING_STEPS, ROUTES } from "@/constants";

export type StepStatus = "pending" | "active" | "complete";

interface StepState {
  status: StepStatus;
}

interface UseProcessingSimulationReturn {
  steps: StepState[];
  currentStepIndex: number;
  terminalLines: string[];
  progressPercent: number;
  isComplete: boolean;
  isError: boolean;
  errorMsg: string | null;
}

export function useProcessingSimulation(): UseProcessingSimulationReturn {
  const router = useRouter();
  const { progress, status, errorMsg, repositoryUrl, githubUsername } = useAnalysis();

  const [steps, setSteps] = useState<StepState[]>(
    PROCESSING_STEPS.map(() => ({ status: "pending" as StepStatus }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const streamedStepsRef = useRef<number>(-1);
  const lineTimerRef = useRef<NodeJS.Timeout | null>(null);

  const extractRepoName = (url: string): string => {
    try {
      const parts = url.replace(/\/$/, "").split("/");
      return parts[parts.length - 1] || "repository";
    } catch {
      return "repository";
    }
  };

  const repoName = extractRepoName(repositoryUrl);

  const addTerminalLine = useCallback((line: string) => {
    const interpolated = line
      .replace(/\{\{username\}\}/g, githubUsername || "contributor")
      .replace(/\{\{repo\}\}/g, repoName || "repository");
    setTerminalLines((prev) => [...prev, interpolated]);
  }, [githubUsername, repoName]);

  // Determine active step based on backend progress
  let activeIndex = 0;
  if (progress >= 100) {
    activeIndex = 5;
  } else if (progress >= 90) {
    activeIndex = 5;
  } else if (progress >= 70) {
    activeIndex = 4;
  } else if (progress >= 50) {
    activeIndex = 3;
  } else if (progress >= 20) {
    activeIndex = 1;
  } else if (progress >= 10) {
    activeIndex = 0;
  }

  // Update step visual status
  useEffect(() => {
    if (status === "error") {
      setSteps((prev) =>
        prev.map((s, idx) => (idx === currentStepIndex ? { status: "pending" } : s))
      );
      return;
    }

    setSteps((prev) =>
      prev.map((s, idx) => {
        if (idx < activeIndex) return { status: "complete" };
        if (idx === activeIndex) return { status: "active" };
        return { status: "pending" };
      })
    );
    setCurrentStepIndex(activeIndex);
  }, [activeIndex, status, currentStepIndex]);

  // Stream terminal lines for current active step
  useEffect(() => {
    if (status === "error" || isComplete) return;

    // Only start streaming if this step hasn't been streamed yet
    if (activeIndex > streamedStepsRef.current) {
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);

      const step = PROCESSING_STEPS[activeIndex];
      if (!step) return;

      streamedStepsRef.current = activeIndex;
      let lineIndex = 0;

      const streamLines = () => {
        if (lineIndex < step.terminalLines.length) {
          addTerminalLine(step.terminalLines[lineIndex]);
          lineIndex++;
          lineTimerRef.current = setTimeout(
            streamLines,
            step.terminalLines[lineIndex - 1]?.trim() === "" ? 50 : Math.random() * 120 + 80
          );
        }
      };

      streamLines();
    }
  }, [activeIndex, status, isComplete, addTerminalLine]);

  // Handle error reporting in terminal
  useEffect(() => {
    if (status === "error") {
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
      addTerminalLine("");
      addTerminalLine("❌ ANALYSIS FAILED!");
      if (errorMsg) {
        addTerminalLine(`Error detail: ${errorMsg}`);
      } else {
        addTerminalLine("Reason: Backend JGit clone or credentials error.");
      }
      addTerminalLine("Please return to home page and verify the Repository URL.");
    }
  }, [status, errorMsg, addTerminalLine]);

  // Handle completion redirect
  useEffect(() => {
    if (status === "complete" && !isComplete) {
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
      
      // Print final success line
      addTerminalLine("");
      addTerminalLine("🎉 Analysis complete! Redirecting to dashboard...");
      setIsComplete(true);

      const redirectTimer = setTimeout(() => {
        router.push(ROUTES.DASHBOARD);
      }, 1500);

      return () => clearTimeout(redirectTimer);
    }
  }, [status, isComplete, router, addTerminalLine]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    };
  }, []);

  return {
    steps,
    currentStepIndex,
    terminalLines,
    progressPercent: progress,
    isComplete,
    isError: status === "error",
    errorMsg,
  };
}
export default useProcessingSimulation;

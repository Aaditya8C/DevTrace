import { MOCK_DASHBOARD_DATA } from "@/mock/dashboardData";
import type { DashboardData } from "@/types";
import { PROCESSING_STEPS } from "@/constants";

// ============================================================
// DevTrace — Mock Analysis Service
// Simulates a backend API with staged async delays.
// Replace with real HTTP calls in Phase 2.
// ============================================================

interface AnalysisProgressCallback {
  onStepStart: (stepIndex: number) => void;
  onStepComplete: (stepIndex: number) => void;
  onTerminalLine: (line: string) => void;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulates the full analysis pipeline with staged delays.
 * Each step triggers callbacks for UI updates.
 */
export async function runMockAnalysis(
  repositoryUrl: string,
  githubUsername: string,
  callbacks?: AnalysisProgressCallback
): Promise<DashboardData> {
  const repoName = extractRepoName(repositoryUrl);

  for (let i = 0; i < PROCESSING_STEPS.length; i++) {
    const step = PROCESSING_STEPS[i];

    callbacks?.onStepStart(i);

    // Stream terminal lines with small delays between each
    for (const line of step.terminalLines) {
      const interpolated = interpolateLine(line, githubUsername, repoName);
      callbacks?.onTerminalLine(interpolated);
      await sleep(line.trim() === "" ? 50 : Math.random() * 120 + 80);
    }

    // Wait remaining duration for step
    const lineTime = step.terminalLines.length * 100;
    const remaining = Math.max(0, step.durationMs - lineTime);
    await sleep(remaining);

    callbacks?.onStepComplete(i);
  }

  // Return mock data (Phase 2: replace with API response)
  return {
    ...MOCK_DASHBOARD_DATA,
    generatedAt: new Date().toISOString(),
  };
}

function extractRepoName(url: string): string {
  try {
    const parts = url.replace(/\/$/, "").split("/");
    return parts[parts.length - 1] || "repository";
  } catch {
    return "repository";
  }
}

function interpolateLine(line: string, username: string, repo: string): string {
  return line
    .replace(/\{\{username\}\}/g, username || "contributor")
    .replace(/\{\{repo\}\}/g, repo || "repository");
}

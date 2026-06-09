// ============================================================
// DevTrace — Custom Hook for Analysis & Polling
// ============================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStore } from "@/store/analysisStore";
import { useToastStore } from "@/store/toastStore";
import { analysisService } from "@/api/services/analysisService";
import { API_CONFIG } from "@/api/constants/config";
import type { DashboardData } from "@/types";
import type { AnalysisResult } from "@/api/types";
import { ROUTES } from "@/constants";

export function useAnalysis() {
  const router = useRouter();
  const {
    repositoryUrl,
    githubUsername,
    analysisStatus,
    jobId,
    progress,
    dashboardData,
    setRepositoryUrl,
    setGithubUsername,
    startAnalysis: storeStartAnalysis,
    setAnalysisStatus,
    setJobId,
    setProgress,
    completeAnalysis,
    setError,
    reset,
  } = useAnalysisStore();

  const { addToast } = useToastStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling helper
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Map JGit / Gemini response into DashboardData
  const mapResultToDashboardData = useCallback(
    (repoUrl: string, username: string, result: AnalysisResult): DashboardData => {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
      const owner = match ? match[1] : "owner";
      const repo = match ? match[2] : "repo";

      // Parse contribution period
      let durationDays = 0;
      if (result.statistics?.contributionPeriod) {
        const daysMatch = result.statistics.contributionPeriod.match(/(\d+)\s+day/);
        const monthsMatch = result.statistics.contributionPeriod.match(/(\d+)\s+month/);
        if (daysMatch) {
          durationDays = parseInt(daysMatch[1], 10);
        } else if (monthsMatch) {
          durationDays = parseInt(monthsMatch[1], 10) * 30;
        }
      }

      // 1. Build Contributor details
      const contributor = {
        name: username,
        githubUsername: username,
        avatarUrl: `https://avatars.githubusercontent.com/${username}`,
        totalCommits: result.statistics?.totalCommits || 0,
        filesModified: result.statistics?.filesModified || 0,
        linesAdded: result.statistics?.linesAdded || 0,
        linesDeleted: result.statistics?.linesDeleted || 0,
        contributionStartDate: new Date().toISOString(),
        contributionEndDate: new Date().toISOString(),
        contributionDurationDays: durationDays || 1,
        topLanguages: result.technologyIndicators || [],
      };

      // 2. Build Repository details
      const repository = {
        name: repo,
        fullName: `${owner}/${repo}`,
        description: "",
        url: repoUrl,
        language: "",
        stars: 0,
        forks: 0,
        watchers: 0,
        openIssues: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        defaultBranch: "main",
      };

      // 3. Build AI Report fallback if null
      const aiReport = result.aiReport;
      const contributionSummary = aiReport
        ? {
            headline: aiReport.contributionSummary?.[0] || "Core contributor contribution summary",
            paragraphs: aiReport.contributionSummary ? aiReport.contributionSummary.slice(1) : [],
            keyAchievements: aiReport.resumeBullets?.slice(0, 3) || [],
          }
        : {
            headline: "Repository analysis completed. AI-generated insights are currently unavailable.",
            paragraphs: [
              "We successfully processed your commit history and compiled repository statistics.",
              "AI-generated insights are temporarily unavailable, which may be caused by an unconfigured model API key or service rate limits."
            ],
            keyAchievements: [
              `Contributed ${contributor.totalCommits} commits to the codebase`,
              `Modified ${contributor.filesModified} code files`,
              `Incurred ${contributor.linesAdded} line additions and ${contributor.linesDeleted} deletions`
            ],
          };

      const resumeBullets = aiReport
        ? aiReport.resumeBullets.map((bullet, idx) => ({
            id: `bullet-${idx}`,
            text: bullet,
            category: (idx % 4 === 0 ? "impact" : idx % 4 === 1 ? "technical" : idx % 4 === 2 ? "collaboration" : "leadership") as any,
          }))
        : [];

      const linkedInSummary = aiReport
        ? {
            text: aiReport.linkedInSummary,
            hashtags: ["#FullStack", "#SoftwareEngineering", "#GitInsights"],
          }
        : {
            text: `I recently completed a detailed analysis of my contributions to the ${repo} repository. Over a period of ${result.statistics?.contributionPeriod || "some time"}, I completed ${contributor.totalCommits} commits, modifying ${contributor.filesModified} files with a total of +${contributor.linesAdded} additions and -${contributor.linesDeleted} deletions. Check out the project!`,
            hashtags: ["#DevTrace", "#OpenSource", "#Contributions"],
          };

      // 4. Technical breakdown from Contribution Intelligence Engine
      const technicalBreakdown = result.contributionBreakdown && result.contributionBreakdown.length > 0
        ? result.contributionBreakdown.map((item) => ({
            area: item.area as any,
            percentage: item.percentage,
            commits: item.commits,
            filesChanged: item.filesChanged,
            color: item.color,
          }))
        : [
            {
              area: "Development" as const,
              percentage: 100,
              commits: contributor.totalCommits,
              filesChanged: contributor.filesModified,
              color: "#6366f1",
            },
          ];

      // 5. Default repository stats (fallback)
      const repositoryStats = {
        stars: 0,
        forks: 0,
        watchers: 0,
        openIssues: 0,
        closedIssues: 0,
        pullRequests: 0,
        mergedPRs: 0,
        contributors: 1,
        releases: 0,
      };

      // 6. Default timeline entries (fallback)
      const timeline = [
        {
          month: "Active Period",
          commits: contributor.totalCommits,
          linesAdded: contributor.linesAdded,
          linesDeleted: contributor.linesDeleted,
          filesChanged: contributor.filesModified,
        },
      ];

      return {
        repository,
        contributor,
        contributionSummary,
        resumeBullets,
        linkedInSummary,
        technicalBreakdown,
        timeline,
        repositoryStats,
        generatedAt: new Date().toISOString(),
      };
    },
    []
  );

  // Fetch job result and transition to complete state
  const fetchJobResult = useCallback(
    async (id: string, url: string, username: string) => {
      try {
        const response = await analysisService.getJobResult(id);
        
        if (response.status === "COMPLETED" && response.result) {
          stopPolling();
          
          if (!response.result.aiReport) {
            addToast(
              "Analysis Completed",
              "warning",
              "AI-generated insights are currently unavailable."
            );
          } else {
            addToast("Analysis Completed", "success", "Your developer report is ready.");
          }

          const dashboardDataMapped = mapResultToDashboardData(url, username, response.result);
          completeAnalysis(dashboardDataMapped);
          
          setTimeout(() => {
            router.push(ROUTES.DASHBOARD);
          }, 1500);
        } else if (response.status === "FAILED") {
          stopPolling();
          setError();
          const errorMsg = response.errorMessage || "Backend analysis failure.";
          setErrorMsg(errorMsg);
          addToast("Analysis Failed", "error", errorMsg);
        }
      } catch (err: any) {
        stopPolling();
        setError();
        const msg = err.message || "Failed to fetch analysis details.";
        setErrorMsg(msg);
        addToast("Network Error", "error", msg);
      }
    },
    [router, completeAnalysis, stopPolling, addToast, setError, mapResultToDashboardData]
  );

  // Poll job status logic
  const startPolling = useCallback(
    (id: string, url: string, username: string) => {
      stopPolling();

      pollingRef.current = setInterval(async () => {
        try {
          const response = await analysisService.getJobStatus(id);
          setProgress(response.progress);

          if (response.status === "COMPLETED") {
            await fetchJobResult(id, url, username);
          } else if (response.status === "FAILED") {
            stopPolling();
            setError();
            addToast("Analysis Failed", "error", "Repository analysis processing failed.");
          }
        } catch (err: any) {
          // If transient error (e.g. backend down temporary), keep polling or map error
          console.error("Polling error: ", err);
        }
      }, API_CONFIG.POLLING_INTERVAL);
    },
    [fetchJobResult, stopPolling, setProgress, setError, addToast]
  );

  // Intercept OAuth redirection error parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "oauth_denied") {
        addToast("OAuth Denied", "error", "GitHub authorization was cancelled.");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [addToast]);

  // Start a new analysis job
  const submitAnalysis = useCallback(
    async (url: string, username: string) => {
      reset();
      setErrorMsg(null);
      setRepositoryUrl(url);
      setGithubUsername(username);
      setAnalysisStatus("processing");
      setProgress(5);

      // Route immediately
      router.push(ROUTES.PROCESSING);
      addToast("Verifying Access", "info", "Checking repository accessibility...");

      try {
        const accessState = await analysisService.verifyAccess(url);

        if (accessState === "NOT_FOUND") {
          setError();
          setErrorMsg("Unable to access repository. Please verify the repository URL.");
          addToast(
            "Repository Invalid",
            "error",
            "Unable to access repository. Please verify the repository URL."
          );
          return;
        }

        if (accessState === "PRIVATE_NOT_ACCESSIBLE") {
          setError();
          setErrorMsg("This is a private repository. Please sign in with GitHub to analyze it.");
          addToast(
            "Repository Access Denied",
            "warning",
            "This is a private repository. Please sign in with GitHub to analyze it."
          );
          return;
        }

        setProgress(10);
        addToast("Analysis Started", "info", "Submitting your repository for cloning...");

        const response = await analysisService.startAnalysis({
          repositoryUrl: url,
          githubUsername: username,
        });

        storeStartAnalysis(url, username, response.jobId);
        startPolling(response.jobId, url, username);
      } catch (err: any) {
        setError();
        const msg = err.message || "Failed to submit repository for analysis.";
        setErrorMsg(msg);
        addToast("Repository Invalid", "error", msg);
      }
    },
    [reset, router, setRepositoryUrl, setGithubUsername, setAnalysisStatus, setProgress, storeStartAnalysis, startPolling, setError, addToast]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Restore polling if page reloaded in processing state
  useEffect(() => {
    if (analysisStatus === "processing" && jobId && !pollingRef.current) {
      startPolling(jobId, repositoryUrl, githubUsername);
    }
  }, [analysisStatus, jobId, repositoryUrl, githubUsername, startPolling]);

  return {
    submitAnalysis,
    stopPolling,
    errorMsg,
    progress,
    status: analysisStatus,
    dashboardData,
    jobId,
    repositoryUrl,
    githubUsername,
  };
}
export default useAnalysis;

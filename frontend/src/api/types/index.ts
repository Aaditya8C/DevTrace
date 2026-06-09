// ============================================================
// DevTrace — API TypeScript Typings
// ============================================================

export interface AnalysisRequest {
  repositoryUrl: string;
  githubUsername: string;
}

export interface AnalysisResponse {
  jobId: string;
}

export interface GitStatistics {
  totalCommits: number;
  filesModified: number;
  linesAdded: number;
  linesDeleted: number;
  contributionPeriod: string;
}

export interface AiContributionReport {
  contributionSummary: string[];
  resumeBullets: string[];
  linkedInSummary: string;
  interviewTopics: string[];
}

export interface ContributionBreakdownItem {
  area: string;
  percentage: number;
  commits: number;
  filesChanged: number;
  color: string;
}

export interface AnalysisResult {
  statistics: GitStatistics;
  aiReport: AiContributionReport | null;
  contributionBreakdown: ContributionBreakdownItem[];
  fileExtensions: Record<string, number>;
  topKeywords: string[];
  technologyIndicators: string[];
}

export interface JobStatusResponse {
  jobId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
}

export interface JobResultResponse {
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  result: AnalysisResult | null;
  errorMessage: string | null;
}

export interface ApiErrorResponse {
  message: string;
  status?: number;
  code?: string;
}

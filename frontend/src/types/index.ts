// ============================================================
// DevTrace — Centralized TypeScript Types
// ============================================================

// --- Analysis Status ---

export type AnalysisStatus = "idle" | "processing" | "complete" | "error";

// --- Processing Steps ---

export interface ProcessingStep {
  id: string;
  label: string;
  terminalLines: string[];
  durationMs: number;
}

// --- Repository & Contributor ---

export interface RepositoryInfo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  createdAt: string;
  lastUpdated: string;
  defaultBranch: string;
}

export interface ContributorStats {
  name: string;
  githubUsername: string;
  avatarUrl: string;
  totalCommits: number;
  filesModified: number;
  linesAdded: number;
  linesDeleted: number;
  contributionStartDate: string;
  contributionEndDate: string;
  contributionDurationDays: number;
  topLanguages: string[];
}

// --- AI-Generated Content ---

export interface ResumeBullet {
  id: string;
  text: string;
  category: "impact" | "technical" | "collaboration" | "leadership";
}

export interface ContributionSummary {
  headline: string;
  paragraphs: string[];
  keyAchievements: string[];
}

export interface LinkedInSummary {
  text: string;
  hashtags: string[];
}

// --- Technical Breakdown ---

export type TechnicalArea =
  | "Frontend"
  | "Backend"
  | "DevOps"
  | "Documentation"
  | "Testing"
  | "Other";

export interface TechnicalBreakdownItem {
  area: TechnicalArea;
  percentage: number;
  commits: number;
  filesChanged: number;
  color: string;
}

// --- Timeline ---

export interface TimelineEntry {
  month: string; // e.g. "Jan 2025"
  commits: number;
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
}

// --- Repository Statistics ---

export interface RepositoryStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  closedIssues: number;
  pullRequests: number;
  mergedPRs: number;
  contributors: number;
  releases: number;
}

// --- Dashboard (Master Type) ---

export interface DashboardData {
  repository: RepositoryInfo;
  contributor: ContributorStats;
  contributionSummary: ContributionSummary;
  resumeBullets: ResumeBullet[];
  linkedInSummary: LinkedInSummary;
  technicalBreakdown: TechnicalBreakdownItem[];
  timeline: TimelineEntry[];
  repositoryStats: RepositoryStats;
  generatedAt: string;
}

// --- Store ---

export interface AnalysisStore {
  repositoryUrl: string;
  githubUsername: string;
  analysisStatus: AnalysisStatus;
  dashboardData: DashboardData | null;
  // Actions
  setRepositoryUrl: (url: string) => void;
  setGithubUsername: (username: string) => void;
  startAnalysis: (url: string, username: string) => void;
  completeAnalysis: (data: DashboardData) => void;
  setError: () => void;
  reset: () => void;
}

// --- Form ---

export interface AnalysisFormValues {
  repositoryUrl: string;
  githubUsername: string;
}

// --- Feature Card ---

export interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

// --- Navigation ---

export interface NavLink {
  label: string;
  href: string;
}

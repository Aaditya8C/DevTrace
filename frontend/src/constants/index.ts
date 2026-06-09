// ============================================================
// DevTrace — Centralized Constants
// ============================================================

import type { FeatureCard, NavLink, ProcessingStep } from "@/types";

// --- Routes ---

export const ROUTES = {
  HOME: "/",
  ANALYZE: "/analyze",
  PROCESSING: "/analyze/processing",
  DASHBOARD: "/dashboard",
} as const;

// --- Navigation ---

export const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#workflow" },
  { label: "Dashboard", href: ROUTES.DASHBOARD },
];

// --- Processing Steps ---

export const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: "clone",
    label: "Cloning Repository",
    durationMs: 1200,
    terminalLines: [
      "$ git clone https://github.com/{{username}}/{{repo}}.git",
      "Cloning into '{{repo}}'...",
      "remote: Enumerating objects: 2,847, done.",
      "remote: Counting objects: 100% (2,847/2,847), done.",
      "remote: Compressing objects: 100% (1,203/1,203), done.",
      "Receiving objects: 100% (2,847/2,847), 14.23 MiB | 8.41 MiB/s, done.",
      "Resolving deltas: 100% (891/891), done.",
    ],
  },
  {
    id: "commits",
    label: "Analyzing Commits",
    durationMs: 1500,
    terminalLines: [
      "$ git log --author='{{username}}' --oneline",
      "Scanning commit history...",
      "Found 284 commits by {{username}}",
      "Parsing commit messages and metadata...",
      "Extracting timestamps and diffs...",
      "✓ Commit analysis complete",
    ],
  },
  {
    id: "files",
    label: "Extracting File Changes",
    durationMs: 1300,
    terminalLines: [
      "$ git diff --stat HEAD~284 HEAD",
      "Processing file-level changes...",
      "Tracking: src/ components/ lib/ tests/",
      "Lines added:   +12,847",
      "Lines deleted: -3,291",
      "Files modified: 156",
      "✓ File extraction complete",
    ],
  },
  {
    id: "profile",
    label: "Building Contributor Profile",
    durationMs: 1800,
    terminalLines: [
      "Aggregating contribution data...",
      "Mapping language distribution...",
      "Computing contribution score...",
      "Frontend: 45% | Backend: 30% | DevOps: 10%",
      "Documentation: 10% | Testing: 5%",
      "✓ Contributor profile built",
    ],
  },
  {
    id: "insights",
    label: "Generating AI Insights",
    durationMs: 1600,
    terminalLines: [
      "Sending data to AI processing pipeline...",
      "Analyzing contribution patterns...",
      "Generating resume bullet points...",
      "Crafting LinkedIn summary...",
      "Identifying key technical achievements...",
      "✓ AI insights generated",
    ],
  },
  {
    id: "report",
    label: "Preparing Report",
    durationMs: 800,
    terminalLines: [
      "Compiling contribution report...",
      "Formatting visualizations...",
      "Finalizing dashboard data...",
      "✓ Report ready",
      "",
      "🎉 Analysis complete! Redirecting to dashboard...",
    ],
  },
];

// --- Features ---

export const FEATURES: FeatureCard[] = [
  {
    id: "contribution-analysis",
    icon: "GitCommit",
    title: "Contribution Analysis",
    description:
      "Deep-dive into your commit history, file changes, and code impact across any GitHub repository.",
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
  {
    id: "resume-bullets",
    icon: "FileText",
    title: "Resume Bullet Generator",
    description:
      "Auto-generate achievement-oriented resume bullets with action verbs, metrics, and outcomes.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    id: "linkedin-summaries",
    icon: "Link2",
    title: "LinkedIn Summaries",
    description:
      "Craft compelling LinkedIn descriptions that highlight your technical contributions professionally.",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
  },
  {
    id: "technical-insights",
    icon: "BarChart3",
    title: "Technical Insights",
    description:
      "Visualize your stack footprint — Frontend, Backend, DevOps, and more — with interactive charts.",
    gradient: "from-fuchsia-500/20 to-pink-500/20",
  },
  {
    id: "verification",
    icon: "ShieldCheck",
    title: "Contribution Verification",
    description:
      "All data is sourced directly from GitHub's API. Every claim is traceable and verifiable.",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: "shareable-reports",
    icon: "Share2",
    title: "Shareable Reports",
    description:
      "Export and share your contribution report with recruiters or teammates via a unique link.",
    gradient: "from-sky-500/20 to-indigo-500/20",
  },
];

// --- Workflow Steps ---

export const WORKFLOW_STEPS = [
  {
    id: "repo",
    step: "01",
    label: "Repository",
    description: "Paste your GitHub repository URL and contributor username",
    icon: "Github",
  },
  {
    id: "analysis",
    step: "02",
    label: "Analysis",
    description: "We clone, parse, and analyze every commit and file change",
    icon: "Search",
  },
  {
    id: "ai",
    step: "03",
    label: "AI Processing",
    description: "AI models extract key achievements and craft professional descriptions",
    icon: "Sparkles",
  },
  {
    id: "report",
    step: "04",
    label: "Contribution Report",
    description: "Receive a polished, shareable report ready for your resume and LinkedIn",
    icon: "FileCheck",
  },
];

// --- Technical Area Colors ---

export const TECHNICAL_AREA_COLORS: Record<string, string> = {
  Frontend: "#6366f1",
  Backend: "#8b5cf6",
  DevOps: "#06b6d4",
  Documentation: "#10b981",
  Testing: "#f59e0b",
  Other: "#64748b",
};

// --- Site Metadata ---

export const SITE_META = {
  name: "DevTrace",
  tagline: "Transform GitHub Contributions into Career-Ready Achievements",
  description:
    "Analyze repositories, understand your impact, and generate resume-ready contribution summaries instantly.",
  url: "https://devtrace.app",
};

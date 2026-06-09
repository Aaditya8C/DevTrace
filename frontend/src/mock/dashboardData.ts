import type {
  DashboardData,
  RepositoryInfo,
  ContributorStats,
  ContributionSummary,
  ResumeBullet,
  LinkedInSummary,
  TechnicalBreakdownItem,
  TimelineEntry,
  RepositoryStats,
} from "@/types";

// ============================================================
// DevTrace — Realistic Mock Data
// Contributor: Aaditya Padte | Repository: ContrAll
// ============================================================

const mockRepository: RepositoryInfo = {
  name: "ContrAll",
  fullName: "aadityapadte/ContrAll",
  description:
    "A comprehensive contribution management platform for tracking, analyzing, and visualizing developer contributions across organizations.",
  url: "https://github.com/aadityapadte/ContrAll",
  language: "TypeScript",
  stars: 847,
  forks: 124,
  watchers: 63,
  openIssues: 18,
  createdAt: "2024-01-15T08:00:00Z",
  lastUpdated: "2025-06-01T14:32:00Z",
  defaultBranch: "main",
};

const mockContributor: ContributorStats = {
  name: "Aaditya Padte",
  githubUsername: "aadityapadte",
  avatarUrl: "https://avatars.githubusercontent.com/u/placeholder",
  totalCommits: 284,
  filesModified: 156,
  linesAdded: 12847,
  linesDeleted: 3291,
  contributionStartDate: "2024-01-20T09:15:00Z",
  contributionEndDate: "2025-06-01T14:32:00Z",
  contributionDurationDays: 497,
  topLanguages: ["TypeScript", "Dart", "Java", "SQL", "CSS"],
};

const mockContributionSummary: ContributionSummary = {
  headline:
    "Core contributor who architected and delivered critical platform features over 16+ months",
  paragraphs: [
    "Aaditya Padte emerged as a core contributor to ContrAll, driving the development of key platform features including the multi-tenant architecture, real-time analytics dashboard, and developer contribution tracking system. With 284 commits spanning 16+ months, Aaditya demonstrated consistent, high-impact engineering across the full stack.",
    "On the frontend, Aaditya led the development of a Flutter-based mobile application and Next.js web dashboard, building reusable component libraries and implementing complex state management solutions. The frontend contributions totaling 45% of overall work showcased deep proficiency in component-driven architecture and responsive design.",
    "The backend contributions, comprising 30% of overall work, included designing RESTful APIs with Spring Boot, implementing JWT authentication systems, and optimizing database query performance resulting in a 40% reduction in API response times.",
  ],
  keyAchievements: [
    "Architected multi-tenant permission system supporting 500+ concurrent users",
    "Reduced API response time by 40% through query optimization and caching",
    "Built reusable Flutter component library with 60+ production components",
    "Implemented real-time analytics pipeline processing 10K+ events/day",
    "Established CI/CD workflow reducing deployment time from 45 to 8 minutes",
  ],
};

const mockResumeBullets: ResumeBullet[] = [
  {
    id: "bullet-1",
    text: "Architected and implemented a multi-tenant permission system for ContrAll using Spring Boot and PostgreSQL, enabling role-based access control for 500+ concurrent users across 30+ organizations",
    category: "technical",
  },
  {
    id: "bullet-2",
    text: "Optimized database query performance through strategic indexing and Redis caching, reducing average API response times by 40% and improving platform reliability during peak usage",
    category: "impact",
  },
  {
    id: "bullet-3",
    text: "Built a 60+ component Flutter mobile library adhering to atomic design principles, reducing feature development time by 35% and maintaining 98% UI consistency across iOS and Android",
    category: "technical",
  },
  {
    id: "bullet-4",
    text: "Designed and shipped a real-time analytics dashboard processing 10,000+ developer events per day, providing actionable contribution insights that increased team engagement metrics by 28%",
    category: "impact",
  },
  {
    id: "bullet-5",
    text: "Established end-to-end CI/CD pipeline using GitHub Actions and Docker, cutting deployment time from 45 minutes to 8 minutes and achieving 99.2% deployment success rate",
    category: "collaboration",
  },
  {
    id: "bullet-6",
    text: "Led technical documentation initiative, authoring 40+ API reference pages and developer guides that reduced onboarding time for new contributors by 50%",
    category: "leadership",
  },
];

const mockLinkedInSummary: LinkedInSummary = {
  text: `As a core contributor to ContrAll — a contribution management platform for developer teams — I spent 16+ months delivering full-stack features that scaled the platform from prototype to production. My contributions span across 284 commits, touching 156 files with 12,847 lines added across TypeScript, Dart, Java, and SQL.

On the product side, I architected the multi-tenant permission system, built a real-time analytics dashboard, and developed a 60+ component Flutter mobile library. These efforts directly contributed to a 40% improvement in API performance and a 35% reduction in feature development time.

I thrive at the intersection of engineering depth and product impact — whether that means optimizing a slow query, designing a component API, or establishing deployment workflows. ContrAll taught me how to operate as a high-ownership engineer in a fast-moving codebase.`,
  hashtags: [
    "#FullStack",
    "#TypeScript",
    "#Flutter",
    "#SpringBoot",
    "#OpenSource",
    "#SoftwareEngineering",
  ],
};

const mockTechnicalBreakdown: TechnicalBreakdownItem[] = [
  {
    area: "Frontend",
    percentage: 45,
    commits: 128,
    filesChanged: 70,
    color: "#6366f1",
  },
  {
    area: "Backend",
    percentage: 30,
    commits: 85,
    filesChanged: 47,
    color: "#8b5cf6",
  },
  {
    area: "Documentation",
    percentage: 10,
    commits: 28,
    filesChanged: 22,
    color: "#10b981",
  },
  {
    area: "Testing",
    percentage: 10,
    commits: 29,
    filesChanged: 13,
    color: "#f59e0b",
  },
  {
    area: "DevOps",
    percentage: 5,
    commits: 14,
    filesChanged: 4,
    color: "#06b6d4",
  },
];

const mockTimeline: TimelineEntry[] = [
  { month: "Jan 2024", commits: 12, linesAdded: 840, linesDeleted: 120, filesChanged: 8 },
  { month: "Feb 2024", commits: 18, linesAdded: 1240, linesDeleted: 280, filesChanged: 14 },
  { month: "Mar 2024", commits: 24, linesAdded: 1820, linesDeleted: 340, filesChanged: 21 },
  { month: "Apr 2024", commits: 19, linesAdded: 1290, linesDeleted: 210, filesChanged: 16 },
  { month: "May 2024", commits: 31, linesAdded: 2140, linesDeleted: 480, filesChanged: 28 },
  { month: "Jun 2024", commits: 22, linesAdded: 1540, linesDeleted: 310, filesChanged: 18 },
  { month: "Jul 2024", commits: 16, linesAdded: 980, linesDeleted: 190, filesChanged: 11 },
  { month: "Aug 2024", commits: 28, linesAdded: 1920, linesDeleted: 420, filesChanged: 24 },
  { month: "Sep 2024", commits: 34, linesAdded: 2380, linesDeleted: 520, filesChanged: 30 },
  { month: "Oct 2024", commits: 27, linesAdded: 1860, linesDeleted: 390, filesChanged: 22 },
  { month: "Nov 2024", commits: 21, linesAdded: 1420, linesDeleted: 260, filesChanged: 17 },
  { month: "Dec 2024", commits: 15, linesAdded: 940, linesDeleted: 180, filesChanged: 10 },
  { month: "Jan 2025", commits: 8, linesAdded: 520, linesDeleted: 90, filesChanged: 6 },
  { month: "Feb 2025", commits: 9, linesAdded: 594, linesDeleted: 110, filesChanged: 7 },
];

const mockRepositoryStats: RepositoryStats = {
  stars: 847,
  forks: 124,
  watchers: 63,
  openIssues: 18,
  closedIssues: 142,
  pullRequests: 68,
  mergedPRs: 61,
  contributors: 12,
  releases: 8,
};

export const MOCK_DASHBOARD_DATA: DashboardData = {
  repository: mockRepository,
  contributor: mockContributor,
  contributionSummary: mockContributionSummary,
  resumeBullets: mockResumeBullets,
  linkedInSummary: mockLinkedInSummary,
  technicalBreakdown: mockTechnicalBreakdown,
  timeline: mockTimeline,
  repositoryStats: mockRepositoryStats,
  generatedAt: new Date().toISOString(),
};

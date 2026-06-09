// ============================================================
// DevTrace — Dashboard Page (Connected to Backend / Store)
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { useAnalysisStore } from "@/store/analysisStore";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ContributionOverviewCard } from "@/components/dashboard/ContributionOverviewCard";
import { ContributionSummaryCard } from "@/components/dashboard/ContributionSummaryCard";
import { ResumeBulletsCard } from "@/components/dashboard/ResumeBulletsCard";
import { LinkedInSummaryCard } from "@/components/dashboard/LinkedInSummaryCard";
import { TechnicalBreakdownCard } from "@/components/dashboard/TechnicalBreakdownCard";
import { ContributionTimelineCard } from "@/components/dashboard/ContributionTimelineCard";
import { RepositoryStatsCard } from "@/components/dashboard/RepositoryStatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/SharedStates";
import { ROUTES } from "@/constants";
import type { DashboardData } from "@/types";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    } as object,
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { dashboardData, analysisStatus, reset } = useAnalysisStore();
  const [enrichedData, setEnrichedData] = useState<DashboardData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  // Redirect to processing if active
  useEffect(() => {
    if (analysisStatus === "processing") {
      router.push(ROUTES.PROCESSING);
    }
  }, [analysisStatus, router]);

  // Enrich data from GitHub API
  useEffect(() => {
    if (!dashboardData) return;
    setEnrichedData(dashboardData);

    let active = true;
    const enrich = async () => {
      try {
        setIsEnriching(true);
        const repoFullName = dashboardData.repository?.fullName;
        const username = dashboardData.contributor?.githubUsername;

        if (!repoFullName || !username) return;

        const repoUrl = `https://api.github.com/repos/${repoFullName}`;
        const userUrl = `https://api.github.com/users/${username}`;

        const [repoRes, userRes] = await Promise.all([
          fetch(repoUrl).then((r) => (r.ok ? r.json() : null)),
          fetch(userUrl).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!active) return;

        setEnrichedData((prev) => {
          if (!prev) return null;

          const updatedRepo = {
            ...prev.repository,
            description: repoRes?.description || prev.repository.description || "A project contribution repository.",
            language: repoRes?.language || prev.repository.language || "Codebase",
            stars: repoRes?.stargazers_count ?? prev.repository.stars,
            forks: repoRes?.forks_count ?? prev.repository.forks,
            watchers: repoRes?.subscribers_count ?? prev.repository.watchers,
            openIssues: repoRes?.open_issues_count ?? prev.repository.openIssues,
            createdAt: repoRes?.created_at || prev.repository.createdAt,
            lastUpdated: repoRes?.updated_at || prev.repository.lastUpdated,
            defaultBranch: repoRes?.default_branch || prev.repository.defaultBranch,
          };

          const updatedContributor = {
            ...prev.contributor,
            name: userRes?.name || prev.contributor.name || prev.contributor.githubUsername,
            avatarUrl: userRes?.avatar_url || prev.contributor.avatarUrl,
            topLanguages: repoRes?.language ? [repoRes.language] : prev.contributor.topLanguages,
          };

          const updatedRepoStats = {
            ...prev.repositoryStats,
            stars: repoRes?.stargazers_count ?? prev.repositoryStats.stars,
            forks: repoRes?.forks_count ?? prev.repositoryStats.forks,
            watchers: repoRes?.subscribers_count ?? prev.repositoryStats.watchers,
            openIssues: repoRes?.open_issues_count ?? prev.repositoryStats.openIssues,
          };

          return {
            ...prev,
            repository: updatedRepo,
            contributor: updatedContributor,
            repositoryStats: updatedRepoStats,
          };
        });
      } catch (err) {
        console.warn("Failed to enrich repository details from GitHub API:", err);
      } finally {
        if (active) setIsEnriching(false);
      }
    };

    enrich();

    return () => {
      active = false;
    };
  }, [dashboardData]);

  // Handle empty or loading states
  if (analysisStatus === "idle" || !dashboardData) {
    return <EmptyState />;
  }

  if (analysisStatus === "error") {
    return <ErrorState onRetry={() => reset()} />;
  }

  if (!enrichedData) {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen px-4 py-24 sm:px-6 lg:px-8 bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <DashboardHeader
            repository={enrichedData.repository}
            contributor={enrichedData.contributor}
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-4"
        >
          {/* Row 1: Overview (full width) */}
          <motion.div variants={cardVariants}>
            <ContributionOverviewCard
              repository={enrichedData.repository}
              contributor={enrichedData.contributor}
            />
          </motion.div>

          {/* Row 2: Summary + Technical breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <ContributionSummaryCard summary={enrichedData.contributionSummary} />
            </motion.div>
            <motion.div variants={cardVariants}>
              <TechnicalBreakdownCard breakdown={enrichedData.technicalBreakdown} />
            </motion.div>
          </div>

          {/* Row 3: Timeline (full width) */}
          <motion.div variants={cardVariants}>
            <ContributionTimelineCard timeline={enrichedData.timeline} />
          </motion.div>

          {/* Row 4: Resume bullets (full width) */}
          <motion.div variants={cardVariants}>
            <ResumeBulletsCard bullets={enrichedData.resumeBullets} />
          </motion.div>

          {/* Row 5: LinkedIn + Repo stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div variants={cardVariants}>
              <LinkedInSummaryCard summary={enrichedData.linkedInSummary} />
            </motion.div>
            <motion.div variants={cardVariants}>
              <RepositoryStatsCard stats={enrichedData.repositoryStats} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

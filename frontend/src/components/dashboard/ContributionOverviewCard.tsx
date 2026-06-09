"use client";

import { motion } from "framer-motion";
import { GitCommit, FileCode2, Plus, Minus, Clock, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { formatDuration } from "@/lib/utils";
import type { ContributorStats, RepositoryInfo } from "@/types";

interface ContributionOverviewCardProps {
  repository: RepositoryInfo;
  contributor: ContributorStats;
}

const stats = (contributor: ContributorStats) => [
  {
    icon: GitCommit,
    label: "Total Commits",
    value: contributor.totalCommits,
    formatFn: (v: number) => Math.round(v).toLocaleString(),
    bg: "bg-[var(--bg-elevated)]",
    iconColor: "text-[var(--accent-from)]",
    valueColor: "text-[var(--accent-from)]",
  },
  {
    icon: FileCode2,
    label: "Files Modified",
    value: contributor.filesModified,
    formatFn: (v: number) => Math.round(v).toLocaleString(),
    bg: "bg-[var(--bg-elevated)]",
    iconColor: "text-[var(--text-secondary)]",
    valueColor: "text-[var(--text-primary)]",
  },
  {
    icon: Plus,
    label: "Lines Added",
    value: contributor.linesAdded,
    formatFn: (v: number) => `+${Math.round(v).toLocaleString()}`,
    bg: "bg-[var(--bg-elevated)]",
    iconColor: "text-[var(--color-success)]",
    valueColor: "text-[var(--color-success)]",
  },
  {
    icon: Minus,
    label: "Lines Deleted",
    value: contributor.linesDeleted,
    formatFn: (v: number) => `-${Math.round(v).toLocaleString()}`,
    bg: "bg-[var(--bg-elevated)]",
    iconColor: "text-[var(--color-danger)]",
    valueColor: "text-[var(--color-danger)]",
  },
];

export function ContributionOverviewCard({
  repository,
  contributor,
}: ContributionOverviewCardProps) {
  return (
    <Card className="border-[var(--border-default)]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch size={16} className="text-[var(--accent-from)]" />
            Contribution Overview
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">
            <Clock size={11} />
            {formatDuration(contributor.contributionDurationDays)}
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          <span className="font-semibold text-[var(--accent-from)]">{repository.name}</span>
          {" · "}
          {contributor.name}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats(contributor).map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
                className={`flex flex-col gap-2.5 rounded-xl border border-[var(--border-subtle)] ${stat.bg} p-4`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={14} className={stat.iconColor} />
                  <span className="text-xs text-[var(--text-muted)] font-medium">{stat.label}</span>
                </div>
                <span className={`text-2xl font-bold tabular-nums ${stat.valueColor}`}>
                  <AnimatedCounter value={stat.value} formatFn={stat.formatFn} />
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Language pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {contributor.topLanguages.map((lang) => (
            <span
              key={lang}
              className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] shadow-[var(--shadow-xs)]"
            >
              {lang}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

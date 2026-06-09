"use client";

import { motion } from "framer-motion";
import { Star, GitFork, Eye, AlertCircle, GitPullRequest, Users, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import type { RepositoryStats } from "@/types";

interface RepositoryStatsCardProps {
  stats: RepositoryStats;
}

const statItems = (stats: RepositoryStats) => [
  { icon: Star, label: "Stars", value: stats.stars, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--accent-from)]" },
  { icon: GitFork, label: "Forks", value: stats.forks, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--text-secondary)]" },
  { icon: Eye, label: "Watchers", value: stats.watchers, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--text-secondary)]" },
  { icon: AlertCircle, label: "Open Issues", value: stats.openIssues, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--color-danger)]" },
  { icon: GitPullRequest, label: "Merged PRs", value: stats.mergedPRs, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--color-success)]" },
  { icon: Users, label: "Contributors", value: stats.contributors, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--text-secondary)]" },
  { icon: Tag, label: "Releases", value: stats.releases, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--text-secondary)]" },
  { icon: AlertCircle, label: "Closed Issues", value: stats.closedIssues, bg: "bg-[var(--bg-elevated)]", color: "text-[var(--text-secondary)]" },
];

export function RepositoryStatsCard({ stats }: RepositoryStatsCardProps) {
  const items = statItems(stats);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star size={16} className="text-[var(--accent-from)]" />
          Repository Statistics
        </CardTitle>
        <p className="text-xs text-[var(--text-muted)]">Public health metrics</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] ${item.bg} p-3 text-center`}
              >
                <Icon size={16} className={item.color} />
                <AnimatedCounter
                  value={item.value}
                  className={`text-xl font-bold ${item.color}`}
                />
                <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wide leading-none">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

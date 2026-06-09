"use client";

import { motion } from "framer-motion";
import { GitBranch, User, ExternalLink, Download, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RepositoryInfo, ContributorStats } from "@/types";
import { formatDate } from "@/lib/utils";

interface DashboardHeaderProps {
  repository: RepositoryInfo;
  contributor: ContributorStats;
}

export function DashboardHeader({ repository, contributor }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-from)] shadow-sm">
          <User size={20} className="text-[#323437]" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {contributor.name}
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              @{contributor.githubUsername}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <GitBranch size={13} className="text-[var(--accent-from)]" />
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-from)] transition-colors flex items-center gap-1"
              >
                {repository.fullName}
                <ExternalLink size={11} />
              </a>
            </div>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <span className="text-xs text-[var(--text-muted)]">
              Generated {formatDate(new Date().toISOString())}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="default" className="gap-1.5 py-1">
          <Award size={11} />
          Analysis Complete
        </Badge>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Download size={13} />
          Export PDF
        </Button>
      </div>
    </motion.div>
  );
}

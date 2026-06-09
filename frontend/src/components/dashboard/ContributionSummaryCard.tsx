"use client";

import { motion } from "framer-motion";
import { Sparkles, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/animations/FadeIn";
import type { ContributionSummary } from "@/types";

interface ContributionSummaryCardProps {
  summary: ContributionSummary;
}

export function ContributionSummaryCard({ summary }: ContributionSummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--accent-from)]" />
          Your Contributions
        </CardTitle>
        <p className="text-sm font-semibold text-[var(--accent-from)] leading-snug mt-0.5">
          {summary.headline}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Summary paragraphs */}
        <div className="flex flex-col gap-3">
          {summary.paragraphs.map((paragraph, idx) => (
            <FadeIn key={idx} delay={idx * 0.08}>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {paragraph}
              </p>
            </FadeIn>
          ))}
        </div>

        {/* Key achievements */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={14} className="text-[var(--accent-from)]" />
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Key Achievements
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {summary.keyAchievements.map((achievement, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]"
              >
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-success)]" />
                {achievement}
              </motion.li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

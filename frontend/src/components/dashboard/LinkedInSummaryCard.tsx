"use client";

import { motion } from "framer-motion";
import { Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/common/CopyButton";
import type { LinkedInSummary } from "@/types";

interface LinkedInSummaryCardProps {
  summary: LinkedInSummary;
}

export function LinkedInSummaryCard({ summary }: LinkedInSummaryCardProps) {
  const fullText = `${summary.text}\n\n${summary.hashtags.join(" ")}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link2 size={16} className="text-[#0A66C2]" />
            LinkedIn Summary
          </CardTitle>
          <CopyButton text={fullText} />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Ready to paste into your LinkedIn &quot;About&quot; section
        </p>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
        >
          {/* LinkedIn-style header bar */}
          <div className="bg-[#0A66C2] h-12" />

          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="-mt-6 mb-4">
              <div className="h-14 w-14 rounded-full bg-[var(--accent-from)] flex items-center justify-center text-[#323437] text-lg font-bold shadow-md border-2 border-[var(--bg-surface)]">
                AP
              </div>
            </div>

            <div className="mb-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">Aaditya Padte</p>
              <p className="text-xs text-[var(--text-muted)]">Full Stack Developer</p>
            </div>

            <div className="mt-4 space-y-2.5">
              {summary.text.split("\n\n").map((paragraph, idx) => (
                <p key={idx} className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {summary.hashtags.map((tag) => (
                <span key={tag} className="text-xs text-[#0A66C2] hover:underline cursor-pointer font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

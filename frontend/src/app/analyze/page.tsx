"use client";

import { motion } from "framer-motion";
import { GitBranch, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalysisForm } from "@/features/repository-analysis/AnalysisForm";
import { ROUTES } from "@/constants";

export default function AnalyzePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-[var(--bg-surface)]">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button variant="ghost" size="sm" asChild className="text-[var(--text-muted)]">
            <Link href={ROUTES.HOME}>
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </Button>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-modal)]"
        >
          {/* Icon */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-from)] shadow-[var(--shadow-glow)]">
              <GitBranch size={20} className="text-[#323437]" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-elevated)]">
              <Sparkles size={20} className="text-[var(--accent-from)]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1.5">
            Analyze a repository
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
            Enter a GitHub repository URL and your username to generate a comprehensive contribution report in seconds.
          </p>

          <AnalysisForm variant="page" />

    
        </motion.div>
      </div>
    </main>
  );
}

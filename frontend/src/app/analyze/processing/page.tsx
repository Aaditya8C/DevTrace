"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, GitBranch, Sparkles, X } from "lucide-react";
import { TerminalOutput } from "@/components/animations/TerminalOutput";
import { useProcessingSimulation } from "@/hooks/useProcessingSimulation";
import { PROCESSING_STEPS, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProcessingPage() {
  const {
    steps,
    currentStepIndex,
    terminalLines,
    progressPercent,
    isComplete,
    isError,
    errorMsg,
  } = useProcessingSimulation();

  const completeCount = steps.filter((s) => s.status === "complete").length;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--bg-primary)]">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

      {/* Defocused subtle yellow accent glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-5 blur-[120px] pointer-events-none"
        style={{ background: "var(--accent-from)" }}
      />

      <div className="relative w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-from)] shadow-[var(--shadow-glow)]">
              <GitBranch size={16} className="text-[#323437]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--text-primary)]">
                Analyzing Repository
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {completeCount} of {PROCESSING_STEPS.length} steps complete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-3 py-1 text-xs font-medium text-[var(--color-success)]"
                >
                  <Check size={12} strokeWidth={3} />
                  Complete!
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-3xl font-bold tabular-nums text-[var(--accent-from)]">
              {progressPercent}%
            </span>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--accent-from)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        {/* Impressive Horizontal Pipeline Visualizer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-sm overflow-x-auto"
        >
          <div className="min-w-[640px] relative flex items-center justify-between px-4">
            {/* Background connection line */}
            <div className="absolute left-10 right-10 top-5 -translate-y-1/2 h-0.5 bg-[var(--border-default)] z-0" />

            {/* Dynamic success/active connection lines */}
            {PROCESSING_STEPS.map((step, idx) => {
              if (idx === 0) return null;
              
              const prevStepState = steps[idx - 1];
              const isPrevComplete = prevStepState?.status === "complete";
              const isCurrentActive = steps[idx]?.status === "active";
              
              // Calculate width and position dynamically based on step count
              const stepWidthPercent = 100 / (PROCESSING_STEPS.length - 1);
              const leftOffset = (idx - 1) * stepWidthPercent;

              return (
                <div
                  key={`line-${idx}`}
                  className="absolute top-5 -translate-y-1/2 h-0.5 z-0 transition-all duration-500"
                  style={{
                    left: `calc(${leftOffset}% + 40px)`,
                    width: `calc(${stepWidthPercent}% - 80px)`,
                    backgroundColor: isPrevComplete 
                      ? "var(--color-success)" 
                      : isCurrentActive 
                        ? "var(--accent-from)" 
                        : "transparent"
                  }}
                />
              );
            })}

            {PROCESSING_STEPS.map((step, idx) => {
              const stepState = steps[idx];
              const isActive = stepState?.status === "active";
              const isDone = stepState?.status === "complete";

              // Visual short labels for horizontal pipeline
              const shortLabels = [
                "Cloning",
                "Commits",
                "File Diffs",
                "Stack Profile",
                "AI Insights",
                "Compile"
              ];
              const shortLabel = shortLabels[idx];

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center w-20">
                  {/* Node Circle */}
                  <motion.div
                    animate={isActive ? { scale: [1, 1.06, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isDone
                        ? "border-[var(--color-success)] bg-[var(--color-success)] text-[#323437]"
                        : isActive
                          ? "border-[var(--accent-from)] bg-[var(--bg-elevated)] text-[var(--accent-from)] shadow-[var(--shadow-glow)]"
                          : "border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    )}
                  >
                    {isDone ? (
                      <Check size={16} strokeWidth={3} />
                    ) : isActive ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <span className="text-xs font-bold font-mono">{idx + 1}</span>
                    )}
                  </motion.div>

                  {/* Step label */}
                  <span
                    className={cn(
                      "mt-2.5 text-xs font-medium text-center transition-colors duration-300",
                      isDone
                        ? "text-[var(--color-success)]"
                        : isActive
                          ? "text-[var(--accent-from)] font-semibold"
                          : "text-[var(--text-secondary)]"
                    )}
                  >
                    {shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Terminal panel - takes the full width below pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="h-[360px]"
        >
          <TerminalOutput lines={terminalLines} className="h-full" />
        </motion.div>

        {/* Completion banner */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-4 flex items-center justify-center gap-2.5 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 p-3.5 shadow-sm"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-success)]">
                <Check size={13} className="text-[#323437]" strokeWidth={3} />
              </div>
              <span className="text-sm font-semibold text-[var(--color-success)]">
                Analysis complete! Redirecting to your dashboard...
              </span>
              <Sparkles size={15} className="text-[var(--accent-from)] animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error recovery banner */}
        <AnimatePresence>
          {isError && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/10 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ef4444]">
                  <X size={13} className="text-[#323437]" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-[#ef4444] text-left">
                  Analysis failed: {errorMsg || "Unable to clone repository or authenticate."}
                </span>
              </div>
              <Button size="sm" asChild variant="outline" className="shrink-0 border-[#ef4444]/30 hover:bg-[#ef4444]/15 hover:text-[#ef4444] text-xs">
                <Link href={ROUTES.ANALYZE}>
                  Try Again
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

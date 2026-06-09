// ============================================================
// DevTrace — Shared UI State Components (Monkeytype Aesthetic)
// ============================================================

"use client";

import { motion } from "framer-motion";
import { AlertCircle, FolderOpen, RefreshCcw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

// --- Skeleton Card for Loading ---
export function SkeletonCard() {
  return (
    <div className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--bg-elevated)]/50 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-5 rounded-full bg-[var(--border-subtle)]" />
        <div className="h-4 w-32 rounded bg-[var(--border-subtle)]" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[var(--border-subtle)]" />
        <div className="h-3 w-5/6 rounded bg-[var(--border-subtle)]" />
        <div className="h-3 w-4/6 rounded bg-[var(--border-subtle)]" />
      </div>
    </div>
  );
}

// --- Full Dashboard Page Loading Skeleton ---
export function LoadingState() {
  return (
    <main className="min-h-screen px-4 py-24 sm:px-6 lg:px-8 bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-[var(--border-subtle)] animate-pulse" />
            <div className="h-4 w-32 rounded bg-[var(--border-subtle)] animate-pulse" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-[var(--border-subtle)] animate-pulse" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-32 w-full rounded-2xl bg-[var(--border-subtle)] animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-64 lg:col-span-2 rounded-2xl bg-[var(--border-subtle)] animate-pulse" />
            <div className="h-64 rounded-2xl bg-[var(--border-subtle)] animate-pulse" />
          </div>
          <div className="h-48 w-full rounded-2xl bg-[var(--border-subtle)] animate-pulse" />
        </div>
      </div>
    </main>
  );
}

// --- Empty State View ---
interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No Report Active",
  description = "You haven't run any repository analysis in this session yet. Submit a repository to view insights.",
}: EmptyStateProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md text-center flex flex-col items-center border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 rounded-2xl shadow-[var(--shadow-md)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-elevated)] text-[var(--accent-from)] mb-5">
          <FolderOpen size={22} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          {description}
        </p>
        <Button asChild className="gap-2 font-semibold shadow-[var(--shadow-glow)]">
          <Link href={ROUTES.ANALYZE}>
            Analyze Repository
            <ArrowRight size={14} />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}

// --- Error State View ---
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "DevTrace services are temporarily unavailable.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md text-center flex flex-col items-center border border-[#ef4444]/20 bg-[var(--bg-surface)] p-8 rounded-2xl shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ef4444]/10 text-[#ef4444] mb-5">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Analysis Error</h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex items-center gap-3">
          {onRetry ? (
            <Button onClick={onRetry} className="gap-2 font-semibold">
              <RefreshCcw size={14} />
              Retry Analysis
            </Button>
          ) : (
            <Button asChild className="gap-2 font-semibold">
              <Link href={ROUTES.ANALYZE}>
                Return to Analysis
              </Link>
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

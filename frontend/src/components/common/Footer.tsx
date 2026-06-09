import Link from "next/link";
import { GitBranch, Code2, X } from "lucide-react";
import { ROUTES, SITE_META } from "@/constants";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href={ROUTES.HOME} className="flex items-center gap-2.5 w-fit">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-from)]">
                <GitBranch size={13} className="text-[#323437]" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">DevTrace</span>
            </Link>
            <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
              Transform your GitHub contributions into career-ready achievements with AI-powered analysis.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link href={ROUTES.ANALYZE} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              Analyze
            </Link>
            <Link href={ROUTES.DASHBOARD} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              Dashboard
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="GitHub"
            >
              <Code2 size={16} />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="X"
            >
              <X size={16} />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} {SITE_META.name}. Built for developers who ship.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            <p className="text-xs text-[var(--text-muted)]">Phase 1 — Frontend Preview</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

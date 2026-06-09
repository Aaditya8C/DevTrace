// ============================================================
// DevTrace — Navbar (Auth Connected)
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GitBranch, Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, ROUTES } from "@/constants";
import { useAuth } from "@/auth/AuthContext";
import Image from "next/image";

const GithubIcon = ({ size = 13, className = "" }: { size?: number; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-from)] shadow-sm group-hover:shadow-[var(--shadow-glow)] transition-shadow duration-300">
              <GitBranch size={15} className="text-[#323437]" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
              DevTrace
            </span>
          </Link>

          {/* Nav Links */}
          {isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* CTA & Auth Panel */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* User avatar + Username */}
                <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-elevated)] px-2.5 py-1 border border-[var(--border-subtle)]">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || user.username || "avatar"}
                      width={18}
                      height={18}
                      className="rounded-full shrink-0 border border-[var(--border-default)]"
                    />
                  ) : (
                    <div className="h-4.5 w-4.5 rounded-full bg-[var(--border-subtle)]" />
                  )}
                  <span className="text-xs font-semibold text-[var(--text-secondary)] truncate max-w-24">
                    {user.name || user.username}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] hover:border-red-500/30 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-950/20 transition-all"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              // Sign In Button
              <Button
                variant="ghost"
                size="sm"
                onClick={login}
                className="text-xs text-[var(--text-secondary)] gap-1.5 hover:bg-[var(--bg-elevated)]"
              >
                <GithubIcon size={13} />
                Sign In
              </Button>
            )}

            {/* Analyze CTA */}
            {pathname !== ROUTES.ANALYZE && (
              <Button size="sm" asChild>
                <Link href={ROUTES.ANALYZE}>
                  <Zap size={13} />
                  Analyze Repo
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
export default Navbar;

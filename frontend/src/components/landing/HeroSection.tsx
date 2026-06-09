"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalysisForm } from "@/features/repository-analysis/AnalysisForm";
import { ROUTES, SITE_META } from "@/constants";
import { useAuth } from "@/auth/AuthContext";

const GithubIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
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

const socialProof = [
  { icon: CheckCircle2, text: "Analyzes any public repository" },
  { icon: TrendingUp, text: "Resume-ready in seconds" },
  { icon: Award, text: "Career-proof your contributions" },
];

export function HeroSection() {
  const { isAuthenticated, login } = useAuth();
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16"
      aria-label="Hero section"
    >
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

      {/* Defocused subtle yellow accent glow */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full opacity-5 blur-[100px] pointer-events-none"
        style={{ background: "var(--accent-from)" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-center"
        >
          <Badge variant="default" className="gap-1.5 py-1 px-3.5 text-xs font-medium">
            <Award size={12} className="text-[#323437]" />
            AI-Powered Contribution Analysis
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-[var(--text-primary)] leading-tight"
        >
          Transform GitHub Contributions
          <br />
          into{" "}
          <span className="gradient-text">Career-Ready</span>
          {" "}Achievements
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed"
        >
          {SITE_META.description}
        </motion.p>

        {/* GitHub login option for guests */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 flex justify-center"
          >
            <Button
              onClick={login}
              size="lg"
              className="gap-2 font-semibold bg-[#24292e] text-white hover:bg-[#2c3137] border border-[#24292e] shadow-sm"
            >
              <GithubIcon size={16} />
              Continue With GitHub
            </Button>
          </motion.div>
        )}

        {/* Input form card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 mx-auto max-w-2xl"
        >
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-elevated)]">
            <AnalysisForm variant="hero" />
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-5"
        >
          {socialProof.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              <Icon size={14} className="text-[var(--color-success)]" />
              {text}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

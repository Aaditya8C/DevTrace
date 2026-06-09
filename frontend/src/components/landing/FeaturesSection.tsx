"use client";

import { motion } from "framer-motion";
import {
  GitCommit,
  FileText,
  Link2,
  BarChart3,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { SectionReveal } from "@/components/animations/SectionReveal";
import { StaggerChildren, StaggerChild } from "@/components/animations/StaggerChildren";
import { FEATURES } from "@/constants";

const iconMap: Record<string, React.ElementType> = {
  GitCommit,
  FileText,
  Link2,
  BarChart3,
  ShieldCheck,
  Share2,
};

// Clean emerald/teal/lime/amber palette per feature card
const cardAccents: Record<string, { icon: string; bg: string; border: string }> = {
  "contribution-analysis": {
    icon: "text-[var(--text-secondary)] group-hover:text-[var(--accent-from)] transition-colors duration-300",
    bg: "bg-[var(--bg-elevated)]",
    border: "group-hover:border-[var(--accent-from)]/40",
  },
  "resume-bullets": {
    icon: "text-[var(--text-secondary)] group-hover:text-[var(--accent-from)] transition-colors duration-300",
    bg: "bg-[var(--bg-elevated)]",
    border: "group-hover:border-[var(--accent-from)]/40",
  },
  "linkedin-summaries": {
    icon: "text-[var(--text-secondary)] group-hover:text-[var(--accent-from)] transition-colors duration-300",
    bg: "bg-[var(--bg-elevated)]",
    border: "group-hover:border-[var(--accent-from)]/40",
  },
  "technical-insights": {
    icon: "text-[var(--text-secondary)] group-hover:text-[var(--accent-from)] transition-colors duration-300",
    bg: "bg-[var(--bg-elevated)]",
    border: "group-hover:border-[var(--accent-from)]/40",
  },
  verification: {
    icon: "text-[var(--text-secondary)] group-hover:text-[var(--accent-from)] transition-colors duration-300",
    bg: "bg-[var(--bg-elevated)]",
    border: "group-hover:border-[var(--accent-from)]/40",
  },
  "shareable-reports": {
    icon: "text-[var(--text-secondary)] group-hover:text-[var(--accent-from)] transition-colors duration-300",
    bg: "bg-[var(--bg-elevated)]",
    border: "group-hover:border-[var(--accent-from)]/40",
  },
};

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 bg-[var(--bg-surface)]"
      aria-label="Features section"
    >
      {/* Top border accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--border-subtle)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <SectionReveal className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--accent-from)] tracking-wider uppercase mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Everything you need to showcase
            <br />
            your engineering impact
          </h2>
          <p className="mt-4 text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
            DevTrace turns raw commit data into polished professional content — automatically.
          </p>
        </SectionReveal>

        {/* Feature grid */}
        <StaggerChildren
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          staggerDelay={0.07}
        >
          {FEATURES.map((feature) => {
            const Icon = iconMap[feature.icon];
            const accent = cardAccents[feature.id] ?? {
              icon: "text-emerald-600",
              bg: "bg-emerald-50",
              border: "group-hover:border-emerald-200",
            };

            return (
              <StaggerChild key={feature.id}>
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={`group relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:shadow-[var(--shadow-elevated)] ${accent.border} cursor-default`}
                >
                  {/* Icon */}
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent.bg}`}>
                    {Icon && <Icon size={18} className={accent.icon} />}
                  </div>

                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </StaggerChild>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}

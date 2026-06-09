"use client";

import { motion } from "framer-motion";
import { GitBranch, Search, Sparkles, FileCheck, ArrowDown } from "lucide-react";
import { SectionReveal } from "@/components/animations/SectionReveal";
import { WORKFLOW_STEPS } from "@/constants";

const iconMap: Record<string, React.ElementType> = {
  Github: GitBranch,
  Search,
  Sparkles,
  FileCheck,
};

const stepColors = [
  { bg: "bg-[var(--accent-from)]", text: "text-[#323437]", ring: "ring-[var(--bg-elevated)]/20", iconBg: "bg-[var(--bg-elevated)]", iconText: "text-[var(--text-primary)]" },
  { bg: "bg-[var(--accent-from)]", text: "text-[#323437]", ring: "ring-[var(--bg-elevated)]/20", iconBg: "bg-[var(--bg-elevated)]", iconText: "text-[var(--text-primary)]" },
  { bg: "bg-[var(--accent-from)]", text: "text-[#323437]", ring: "ring-[var(--bg-elevated)]/20", iconBg: "bg-[var(--bg-elevated)]", iconText: "text-[var(--text-primary)]" },
  { bg: "bg-[var(--accent-from)]", text: "text-[#323437]", ring: "ring-[var(--bg-elevated)]/20", iconBg: "bg-[var(--bg-elevated)]", iconText: "text-[var(--text-primary)]" },
];

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="relative py-24 sm:py-32 bg-[var(--bg-primary)]"
      aria-label="How it works section"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <SectionReveal className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--accent-from)] tracking-wider uppercase mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            From repository to report
            <br />
            in under 10 seconds
          </h2>
        </SectionReveal>

        {/* Desktop: horizontal pipeline */}
        <div className="hidden lg:block">
          <div className="relative grid grid-cols-4 gap-6">
            {/* Connecting arrows between steps */}
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="absolute top-14 flex items-center justify-center"
                style={{
                  left: `calc(${(idx + 1) * 25}% - 20px)`,
                  width: "40px",
                }}
              >
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.15, ease: "easeOut" }}
                  className="h-0.5 w-full bg-[var(--border-default)] origin-left"
                />
              </div>
            ))}

            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = iconMap[step.icon];
              const colors = stepColors[idx];
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + idx * 0.1, ease: "easeOut" }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  {/* Circle + icon */}
                  <div className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-[var(--bg-surface)] border-2 border-[var(--border-default)] ring-8 ${colors.ring}`}>
                    <div className={`flex h-16 w-16 items-center justify-center rounded-full ${colors.iconBg}`}>
                      {Icon && <Icon size={26} className={colors.iconText} />}
                    </div>
                    {/* Step badge */}
                    <div className={`absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full ${colors.bg} ${colors.text} text-xs font-bold shadow-sm`}>
                      {step.step}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">
                      {step.label}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[160px]">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical steps */}
        <div className="lg:hidden flex flex-col items-center gap-0">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = iconMap[step.icon];
            const colors = stepColors[idx];
            return (
              <div key={step.id} className="flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] w-full max-w-sm shadow-[var(--shadow-card)]"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}>
                    {Icon && <Icon size={20} className={colors.iconText} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {step.step}
                      </span>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{step.label}</h3>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{step.description}</p>
                  </div>
                </motion.div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-4 bg-[var(--border-default)]" />
                    <ArrowDown size={14} className="text-[var(--text-muted)]" />
                    <div className="w-px h-4 bg-[var(--border-default)]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

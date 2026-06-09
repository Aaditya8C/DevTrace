"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/animations/SectionReveal";
import { ROUTES } from "@/constants";

export function CTASection() {
  return (
    <section
      id="cta"
      className="relative py-24 sm:py-32 bg-[var(--bg-surface)]"
      aria-label="Call to action"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--border-subtle)]" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionReveal>
          {/* Dark achievement card */}
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-elevated)] px-10 py-14 sm:px-14 text-center shadow-[var(--shadow-modal)]">
            {/* Subtle yellow glow inside elevated card */}
            <div
              className="absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-[0.03]"
              style={{ background: "var(--accent-from)" }}
            />

            {/* Background dot pattern */}
            <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />

            <div className="relative">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-from)] shadow-[var(--shadow-glow)]"
              >
                <Sparkles size={24} className="text-[#323437]" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
                Your work matters.
                <br />
                <span className="gradient-text">Here&apos;s the proof.</span>
              </h2>

              <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto leading-relaxed">
                Paste your GitHub repository URL, enter your username, and get a professional contribution report that makes recruiters take notice.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="text-sm font-semibold">
                  <Link href={ROUTES.ANALYZE}>
                    Start analyzing for free
                    <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild className="text-sm font-semibold">
                  <Link href={ROUTES.DASHBOARD}>
                    View demo dashboard
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-xs text-[var(--text-muted)]">
                No account required · No backend needed in preview · 100% free
              </p>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

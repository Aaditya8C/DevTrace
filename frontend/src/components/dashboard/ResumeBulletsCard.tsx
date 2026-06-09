"use client";

import { motion } from "framer-motion";
import { FileText, Target, Users, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/common/CopyButton";
import type { ResumeBullet } from "@/types";

interface ResumeBulletsCardProps {
  bullets: ResumeBullet[];
}

const categoryConfig: Record<
  ResumeBullet["category"],
  { label: string; icon: React.ElementType; badgeVariant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "dark"; dotColor: string }
> = {
  impact: { label: "Impact", icon: Target, badgeVariant: "success", dotColor: "bg-[var(--color-success)]" },
  technical: { label: "Technical", icon: FileText, badgeVariant: "default", dotColor: "bg-[var(--accent-from)]" },
  collaboration: { label: "Collaboration", icon: Users, badgeVariant: "outline", dotColor: "bg-[var(--text-secondary)]" },
  leadership: { label: "Leadership", icon: Crown, badgeVariant: "dark", dotColor: "bg-[var(--text-primary)]" },
};

export function ResumeBulletsCard({ bullets }: ResumeBulletsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText size={16} className="text-[var(--accent-from)]" />
            Resume-Ready Bullets
          </CardTitle>
          <Badge variant="secondary">{bullets.length} bullets</Badge>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          AI-generated, achievement-oriented — ready to paste directly into your resume
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2.5">
          {bullets.map((bullet, idx) => {
            const config = categoryConfig[bullet.category];
            const Icon = config.icon;

            return (
              <motion.div
                key={bullet.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                whileHover={{ x: 2 }}
                className="group flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-all duration-200 hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)] hover:shadow-[var(--shadow-card)] cursor-default"
              >
                {/* Achievement dot */}
                <div className={`mt-1.5 shrink-0 h-2 w-2 rounded-full ${config.dotColor}`} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {bullet.text}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={config.badgeVariant} className="gap-1 py-0 text-[10px]">
                      <Icon size={9} />
                      {config.label}
                    </Badge>
                  </div>
                </div>

                {/* Copy on hover */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <CopyButton text={bullet.text} size="sm" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl",
        hover && "transition-all duration-300 hover:bg-[var(--glass-bg-hover)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        glow && "hover:shadow-[var(--shadow-glow)]",
        className
      )}
    >
      {children}
    </div>
  );
}

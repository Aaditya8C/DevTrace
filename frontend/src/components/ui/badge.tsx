import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-from)] text-[#323437] border border-transparent",
        lime:
          "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20",
        amber:
          "bg-[var(--accent-from)]/10 text-[var(--accent-from)] border border-[var(--accent-from)]/20",
        secondary:
          "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]",
        success:
          "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20",
        warning:
          "bg-[var(--accent-from)]/10 text-[var(--accent-from)] border border-[var(--accent-from)]/20",
        destructive:
          "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20",
        outline:
          "border border-[var(--border-default)] text-[var(--text-secondary)]",
        dark:
          "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

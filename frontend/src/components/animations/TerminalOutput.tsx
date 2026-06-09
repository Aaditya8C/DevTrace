"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalOutputProps {
  lines: string[];
  className?: string;
}

export function TerminalOutput({ lines, className }: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={scrollRef}
      className={`terminal overflow-y-auto p-5 h-full shadow-[var(--shadow-elevated)] ${className ?? ""}`}
      aria-live="polite"
      aria-label="Processing terminal output"
    >
      {/* Terminal chrome */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
        <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          devtrace — analysis
        </span>
      </div>

      {/* Lines */}
      <AnimatePresence initial={false}>
        {lines.map((line, idx) => (
          <motion.div
            key={`${idx}-${line.slice(0, 20)}`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.12 }}
            className={`leading-7 select-text ${
              line.startsWith("$")
                ? "text-[var(--accent-from)] font-medium"
                : line.startsWith("✓")
                  ? "text-[var(--color-success)] font-medium"
                  : line.startsWith("🎉")
                    ? "text-[var(--accent-from)] font-semibold"
                    : line === ""
                      ? "h-2"
                      : "text-[var(--text-secondary)]"
            }`}
          >
            {line.startsWith("$") ? (
              <>
                <span className="text-[var(--text-secondary)] select-none mr-1.5">❯</span>
                {line.slice(2)}
                {idx === lines.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--accent-from)] animate-pulse align-text-bottom opacity-80 rounded-sm" />
                )}
              </>
            ) : (
              line
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {lines.length === 0 && (
        <div className="text-[var(--text-secondary)] text-sm">
          <span className="text-[var(--text-secondary)] mr-1.5">❯</span>
          <span className="inline-block w-1.5 h-4 bg-[var(--accent-from)] animate-pulse align-text-bottom opacity-80 rounded-sm" />
        </div>
      )}
    </div>
  );
}

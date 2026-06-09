// ============================================================
// DevTrace — Monkeytype-Themed Toast Component
// ============================================================

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore, ToastMessage } from "@/store/toastStore";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const iconMap = {
    success: <CheckCircle2 size={16} className="text-[#10b981]" />,
    error: <AlertCircle size={16} className="text-[#ef4444]" />,
    info: <Info size={16} className="text-[var(--accent-from)]" />,
    warning: <AlertTriangle size={16} className="text-[var(--accent-from)]" />,
  };

  const borderMap = {
    success: "border-[#10b981]/30 hover:border-[#10b981]/50",
    error: "border-[#ef4444]/30 hover:border-[#ef4444]/50",
    info: "border-[var(--accent-from)]/30 hover:border-[var(--accent-from)]/50",
    warning: "border-[var(--accent-from)]/30 hover:border-[var(--accent-from)]/50",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-md)] transition-all ${borderMap[toast.type]}`}
    >
      <div className="mt-0.5 shrink-0">{iconMap[toast.type]}</div>
      
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
          {toast.title}
        </h3>
        {toast.description && (
          <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5 rounded hover:bg-[var(--bg-elevated)]"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
export default ToastContainer;

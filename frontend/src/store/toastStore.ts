// ============================================================
// DevTrace — Toast Store
// ============================================================

import { create } from "zustand";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastStoreState {
  toasts: ToastMessage[];
}

interface ToastStoreActions {
  addToast: (title: string, type?: ToastMessage["type"], description?: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStoreState & ToastStoreActions>()((set) => ({
  toasts: [],
  addToast: (title, type = "info", description) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, title, description, type }],
    }));

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// ============================================================
// DevTrace — Analysis Form (Auth & Repo Picker Integrated)
// ============================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Link2, ArrowRight, Loader2, GitPullRequest } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analysisSchema, type AnalysisFormValues } from "./analysisSchema";
import { useAnalysis } from "./useAnalysis";
import { useAuth } from "@/auth/AuthContext";
import { RepoPicker } from "@/components/dashboard/RepoPicker";

interface AnalysisFormProps {
  variant?: "hero" | "page";
}

export function AnalysisForm({ variant = "page" }: AnalysisFormProps) {
  const { submitAnalysis, defaultValues } = useAnalysis();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"manual" | "picker">("manual");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues,
  });

  const isHero = variant === "hero";
  const repositoryUrlValue = watch("repositoryUrl");

  const handleRepoSelect = (cloneUrl: string, owner: string) => {
    setValue("repositoryUrl", cloneUrl);
    setValue("githubUsername", owner);
  };

  return (
    <form onSubmit={handleSubmit(submitAnalysis)} noValidate>
      {/* Tab Switchers (Only on full pages when authenticated) */}
      {isAuthenticated && !isHero && (
        <div className="mb-5 flex border-b border-[var(--border-subtle)] pb-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`text-xs font-semibold pb-1.5 transition-all relative cursor-pointer ${
              activeTab === "manual" ? "text-[var(--accent-from)]" : "text-[var(--text-muted)]"
            }`}
          >
            Manual URL
            {activeTab === "manual" && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-from)]"
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("picker")}
            className={`text-xs font-semibold pb-1.5 transition-all relative cursor-pointer ${
              activeTab === "picker" ? "text-[var(--accent-from)]" : "text-[var(--text-muted)]"
            }`}
          >
            Select from GitHub
            {activeTab === "picker" && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-from)]"
              />
            )}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Dynamic content depending on active tab */}
        {activeTab === "picker" && isAuthenticated && !isHero ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <Label>GitHub Repository</Label>
            <RepoPicker onSelect={handleRepoSelect} selectedUrl={repositoryUrlValue} />
            
            {/* Show Selected Repos details */}
            {repositoryUrlValue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] p-2.5 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]"
              >
                <GitPullRequest size={13} className="text-[var(--accent-from)]" />
                <span>
                  Selected: <span className="font-semibold text-[var(--text-primary)]">{repositoryUrlValue}</span>
                </span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Manual URL Input fields */
          <div className={isHero ? "flex flex-col gap-3 sm:flex-row sm:gap-2" : "flex flex-col gap-4"}>
            {/* Repository URL */}
            <div className={isHero ? "flex-1" : "flex flex-col gap-1.5"}>
              {!isHero && <Label htmlFor="repositoryUrl">Repository URL</Label>}
              <div className="relative">
                <Link2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <Input
                  id="repositoryUrl"
                  type="url"
                  placeholder="https://github.com/username/repo"
                  autoComplete="url"
                  className="pl-9"
                  {...register("repositoryUrl")}
                />
              </div>
              {errors.repositoryUrl && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 mt-1"
                >
                  {errors.repositoryUrl.message}
                </motion.p>
              )}
            </div>

            {/* GitHub Username */}
            <div className={isHero ? "flex-none sm:w-52" : "flex flex-col gap-1.5"}>
              {!isHero && <Label htmlFor="githubUsername">GitHub Username</Label>}
              <div className="relative">
                <Code2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <Input
                  id="githubUsername"
                  type="text"
                  placeholder="username"
                  autoComplete="username"
                  className="pl-9"
                  {...register("githubUsername")}
                />
              </div>
              {errors.githubUsername && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 mt-1"
                >
                  {errors.githubUsername.message}
                </motion.p>
              )}
            </div>
          </div>
        )}

        {/* Submit (Always visible below picker or inputs) */}
        <Button
          type="submit"
          size={isHero ? "default" : "lg"}
          disabled={isSubmitting}
          className={isHero ? "shrink-0" : "w-full mt-1"}
          id="analyze-submit-button"
        >
          {isSubmitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ArrowRight size={15} />
          )}
          {isSubmitting ? "Starting..." : "Analyze Repository"}
        </Button>
      </div>
    </form>
  );
}
export default AnalysisForm;

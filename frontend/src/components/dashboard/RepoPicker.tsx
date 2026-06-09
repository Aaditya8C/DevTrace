// ============================================================
// DevTrace — GitHub Repository Picker
// ============================================================

"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Lock, Globe, Loader2, GitFork } from "lucide-react";
import { authService, GithubRepo } from "@/api/services/authService";
import { useToastStore } from "@/store/toastStore";
import { Input } from "@/components/ui/input";

interface RepoPickerProps {
  onSelect: (cloneUrl: string, owner: string) => void;
  selectedUrl?: string;
}

export function RepoPicker({ onSelect, selectedUrl }: RepoPickerProps) {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const { addToast } = useToastStore();

  useEffect(() => {
    let active = true;
    const fetchRepos = async () => {
      try {
        setIsLoading(true);
        const data = await authService.getRepositories();
        if (active) {
          setRepos(data);
        }
      } catch (error) {
        console.error("Failed to fetch GitHub repos:", error);
        if (active) {
          addToast(
            "GitHub API Failure",
            "error",
            "Unable to fetch repositories from GitHub."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchRepos();
    return () => {
      active = false;
    };
  }, [addToast]);

  const filteredRepos = useMemo(() => {
    if (!search.trim()) return repos;
    const query = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.owner.toLowerCase().includes(query)
    );
  }, [repos, search]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-sm w-full">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <Input
          type="text"
          placeholder="Search repositories (e.g. ContrAll)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[var(--bg-surface)] text-xs h-9 border-[var(--border-subtle)] focus-visible:ring-[var(--accent-from)]"
        />
      </div>

      <div className="h-44 overflow-y-auto border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)] py-6">
            <Loader2 size={16} className="animate-spin text-[var(--accent-from)]" />
            <span className="text-xs">Loading repositories from GitHub...</span>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[var(--text-muted)] py-6">
            No repositories found.
          </div>
        ) : (
          filteredRepos.map((repo) => {
            const isSelected = selectedUrl === repo.cloneUrl;
            return (
              <button
                key={repo.cloneUrl}
                type="button"
                onClick={() => onSelect(repo.cloneUrl, repo.owner)}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-[var(--bg-elevated)] ${
                  isSelected ? "bg-[var(--bg-elevated)] border-l-2 border-[var(--accent-from)]" : ""
                }`}
              >
                <div className="flex items-center gap-2 max-w-[80%]">
                  <GitFork size={13} className="text-[var(--text-muted)] shrink-0" />
                  <div className="truncate">
                    <span className="text-[var(--text-muted)]">{repo.owner}/</span>
                    <span className="font-semibold text-[var(--text-primary)]">{repo.name}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  {repo.private ? (
                    <span className="flex items-center gap-1 rounded bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                      <Lock size={9} />
                      Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      <Globe size={9} />
                      Public
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
export default RepoPicker;

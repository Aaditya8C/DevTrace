"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  ArrowLeft,
  Search,
  Lock,
  Globe,
  Loader2,
  Code2,
  Link2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useAuth } from "@/auth/AuthContext";
import { authService, GithubRepo } from "@/api/services/authService";
import { useToastStore } from "@/store/toastStore";
import { ROUTES } from "@/constants";

// Custom safe GitHub SVG Icon
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function AnalyzePage() {
  const { submitAnalysis } = useAnalysis();
  const { isAuthenticated, user, login, isLoading: isAuthLoading } = useAuth();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<"connected" | "manual">("connected");
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);
  const [repoError, setRepoError] = useState<boolean>(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Manual Form State
  const [manualUrl, setManualUrl] = useState("");
  const [manualUsername, setManualUsername] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualErrors, setManualErrors] = useState<{ url?: string; username?: string }>({});

  // Auto-switch default tab based on auth state
  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        setActiveTab("connected");
      } else {
        setActiveTab("manual");
      }
    }
  }, [isAuthenticated, isAuthLoading]);

  // Fetch repositories
  const fetchRepos = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingRepos(true);
      setRepoError(false);
      const data = await authService.getRepositories();
      setRepos(data);
    } catch (err) {
      console.error("Failed to fetch repositories:", err);
      setRepoError(true);
      addToast("Failed to load repositories", "error", "Unable to retrieve your projects from GitHub.");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRepos();
    }
  }, [isAuthenticated]);

  // Languages list computed from repos
  const languages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((repo) => {
      if (repo.language) langs.add(repo.language);
    });
    return Array.from(langs);
  }, [repos]);

  // Filtered repositories
  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.owner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLanguage = !selectedLanguage || repo.language === selectedLanguage;
      return matchesSearch && matchesLanguage;
    });
  }, [repos, searchQuery, selectedLanguage]);

  // Format date helper
  const formatRelativeDate = (dateStr?: string) => {
    if (!dateStr) return "recently";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "today";
      if (diffDays === 1) return "yesterday";
      if (diffDays < 30) return `${diffDays} days ago`;

      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths === 1) return "1 month ago";
      return `${diffMonths} months ago`;
    } catch (e) {
      return "recently";
    }
  };

  // Language Colors mapper
  const getLanguageColor = (language?: string) => {
    if (!language) return "#a1a1aa";
    const lower = language.toLowerCase();
    if (lower === "typescript" || lower === "ts") return "#3178c6";
    if (lower === "javascript" || lower === "js") return "#f1e05a";
    if (lower === "java") return "#b07219";
    if (lower === "python" || lower === "py") return "#3572a5";
    if (lower === "html") return "#e34c26";
    if (lower === "css") return "#563d7c";
    if (lower === "rust") return "#dea584";
    if (lower === "go" || lower === "golang") return "#00add8";
    return "var(--accent-from)";
  };

  // Trigger analysis submission
  const handleAnalyzeRepo = async (cloneUrl: string, owner: string) => {
    try {
      await submitAnalysis(cloneUrl, owner);
    } catch (err) {
      addToast("Submission failed", "error", "Could not start analysis process.");
    }
  };

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { url?: string; username?: string } = {};

    if (!manualUrl.trim()) {
      errors.url = "Repository URL is required";
    } else if (!manualUrl.startsWith("http://") && !manualUrl.startsWith("https://")) {
      errors.url = "Please enter a valid HTTP/HTTPS URL";
    }

    if (!manualUsername.trim()) {
      errors.username = "GitHub username is required";
    }

    if (Object.keys(errors).length > 0) {
      setManualErrors(errors);
      return;
    }

    setManualErrors({});
    setIsSubmittingManual(true);
    handleAnalyzeRepo(manualUrl.trim(), manualUsername.trim());
  };

  return (
    <main className="min-h-screen relative bg-[var(--bg-surface)] text-[var(--text-primary)]">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 mt-6"
        >
          <Button variant="ghost" size="sm" asChild className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <Link href={ROUTES.HOME} className="flex items-center gap-2">
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </Button>
        </motion.div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-[var(--border-subtle)]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-from)] shadow-[var(--shadow-glow)]">
                <GitBranch size={18} className="text-[#323437]" />
              </div>
              <span className="text-xs font-semibold text-[var(--accent-from)] tracking-wider uppercase">Analyze</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Repository Analysis
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">
              Identify contribution distribution, line counts, extension frequencies, and generate polished career assets.
            </p>
          </motion.div>

          {/* User auth state widget on right */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-4 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)] md:self-end"
          >
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-[150px]">
                <Loader2 size={12} className="animate-spin text-[var(--accent-from)]" />
                <span>Checking login state...</span>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User"}
                    className="h-9 w-9 rounded-full border border-[var(--accent-from)]"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-default)]">
                    <GithubIcon className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{user?.name || user?.username}</div>
                  <div className="text-[10px] text-[var(--color-success)] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                    GitHub connected
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[var(--text-muted)]">Connect to search private repositories:</span>
                <Button
                  onClick={login}
                  size="sm"
                  className="bg-[var(--text-primary)] hover:bg-[var(--text-primary)]/90 text-[var(--bg-surface)] font-bold text-xs flex items-center gap-2 py-1.5"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  Connect GitHub
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Tab Selection */}
        {isAuthenticated && (
          <div className="flex border-b border-[var(--border-subtle)] mb-8 gap-6">
            <button
              onClick={() => setActiveTab("connected")}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === "connected" ? "text-[var(--accent-from)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Connected Repositories
              {activeTab === "connected" && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-from)]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === "manual" ? "text-[var(--accent-from)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Manual URL Input
              {activeTab === "manual" && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-from)]"
                />
              )}
            </button>
          </div>
        )}

        {/* Content Wrapper */}
        <AnimatePresence mode="wait">
          {/* Tab 1: Connected Repositories */}
          {activeTab === "connected" && isAuthenticated && (
            <motion.div
              key="connected-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    type="text"
                    placeholder="Search connected projects (e.g. devtrace)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-[var(--bg-surface)] text-sm border-[var(--border-subtle)] focus-visible:ring-[var(--accent-from)]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedLanguage(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedLanguage === null
                        ? "bg-[var(--accent-from)] text-[#323437] border-[var(--accent-from)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    All Languages
                  </button>
                  {languages.slice(0, 5).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedLanguage === lang
                          ? "bg-[var(--accent-from)] text-[#323437] border-[var(--accent-from)]"
                          : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                  <button
                    onClick={fetchRepos}
                    title="Refresh repositories"
                    className="p-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
                  >
                    <RefreshCw size={14} className={isLoadingRepos ? "animate-spin text-[var(--accent-from)]" : ""} />
                  </button>
                </div>
              </div>

              {/* Repositories Grid */}
              {isLoadingRepos ? (
                /* 6 Skeleton Cards Shimmer */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 h-44 animate-pulse space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-32 bg-[var(--bg-surface)] rounded" />
                        <div className="h-5 w-16 bg-[var(--bg-surface)] rounded" />
                      </div>
                      <div className="h-4 w-48 bg-[var(--bg-surface)] rounded" />
                      <div className="pt-4 flex items-center justify-between border-t border-[var(--border-subtle)]">
                        <div className="h-4 w-24 bg-[var(--bg-surface)] rounded" />
                        <div className="h-8 w-20 bg-[var(--bg-surface)] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : repoError ? (
                /* Error State */
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[var(--bg-elevated)] rounded-2xl border border-red-500/10">
                  <AlertCircle size={40} className="text-red-400 mb-3" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to retrieve GitHub details</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm">
                    We could not communicate with GitHub APIs. Try reloading the list or enter a repository URL manually.
                  </p>
                  <Button onClick={fetchRepos} className="mt-5 text-xs h-9 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                    <RefreshCw size={12} className="mr-2" />
                    Retry Loading
                  </Button>
                </div>
              ) : filteredRepos.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)]">
                  <Sparkles size={36} className="text-[var(--accent-from)] mb-4" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">No repositories found</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs">
                    {searchQuery ? "No matching repositories found. Clear your search or change your filter." : "We couldn't locate repositories. Enter URLs manually using the URL tab."}
                  </p>
                  {searchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedLanguage(null);
                      }}
                      className="mt-4 text-xs h-9"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                /* Grid cards */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRepos.map((repo) => (
                    <motion.div
                      key={repo.cloneUrl}
                      whileHover={{ y: -3 }}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 hover:border-[var(--accent-from)] hover:shadow-[var(--shadow-glow)] transition-all duration-200 flex flex-col justify-between h-44 group relative overflow-hidden"
                    >
                      {/* Inner hover glow gradient */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-from)]/2 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      <div className="relative">
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[75%]" title={`${repo.owner}/${repo.name}`}>
                            <span className="font-normal text-[var(--text-muted)]">{repo.owner}/</span>
                            {repo.name}
                          </h3>
                          <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            repo.private
                              ? "bg-red-950/40 border-red-500/25 text-red-400"
                              : "bg-emerald-950/40 border-emerald-500/25 text-emerald-400"
                          }`}>
                            {repo.private ? <span className="flex items-center gap-1"><Lock size={8} /> Priv</span> : "Pub"}
                          </span>
                        </div>
                        {/* URL info */}
                        <div className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-1">
                          {repo.cloneUrl}
                        </div>
                      </div>

                      {/* Language and updated date */}
                      <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between relative mt-4">
                        <div className="flex items-center gap-4">
                          {repo.language && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                              />
                              <span className="text-[11px] text-[var(--text-secondary)] font-medium">{repo.language}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-[var(--text-muted)]">
                            Updated {formatRelativeDate(repo.updatedAt)}
                          </span>
                        </div>

                        {/* Analyze trigger action */}
                        <button
                          onClick={() => handleAnalyzeRepo(repo.cloneUrl, repo.owner)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] group-hover:bg-[var(--accent-from)] group-hover:border-[var(--accent-from)] group-hover:text-[#323437] text-[var(--text-primary)] transition-all duration-300 transform group-hover:scale-105"
                          title="Run Analysis"
                        >
                          <ArrowRight size={14} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 2: Manual URL Form (or default when not authenticated) */}
          {(activeTab === "manual" || !isAuthenticated) && (
            <motion.div
              key="manual-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Login Prompter (only when unauthenticated) */}
              {!isAuthenticated && (
                <div className="lg:col-span-5 space-y-6">
                  <div className="rounded-2xl border border-[var(--border-default)] bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 h-28 w-28 bg-[var(--accent-from)]/5 rounded-full filter blur-xl pointer-events-none" />
                    
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-[var(--accent-from)] animate-pulse" />
                      Connected Import
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                      Sign in with GitHub to view your account repositories, search and filter easily, and analyze private or organization projects securely.
                    </p>
                    
                    <Button
                      onClick={login}
                      className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-primary)]/90 text-[var(--bg-surface)] font-extrabold text-sm flex items-center justify-center gap-2.5 py-5 shadow-sm"
                    >
                      <GithubIcon className="h-4 w-4" />
                      Sign in with GitHub
                    </Button>
                  </div>

                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 text-[11px] text-[var(--text-muted)] space-y-2">
                    <div className="font-semibold text-[var(--text-secondary)]">💡 Pro Deployment Info</div>
                    <div>By signing in, your secure session is mapped server-side. No passwords or tokens are stored in the database.</div>
                  </div>
                </div>
              )}

              {/* Right Column: Form (spacious layout) */}
              <div className={!isAuthenticated ? "lg:col-span-7" : "lg:col-span-12"}>
                <form
                  onSubmit={handleManualSubmit}
                  noValidate
                  className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-8 shadow-sm space-y-6 max-w-2xl mx-auto lg:mx-0"
                >
                  <div className="border-b border-[var(--border-subtle)] pb-4 mb-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Manual Git Analysis</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Enter any public Git repository link and your author username below to parse statistics.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Repository URL */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="repositoryUrl" className="text-xs font-bold text-[var(--text-secondary)]">
                        Repository Git URL
                      </Label>
                      <div className="relative">
                        <Link2
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <Input
                          id="repositoryUrl"
                          type="url"
                          placeholder="https://github.com/Aaditya8C/DevTrace.git"
                          value={manualUrl}
                          onChange={(e) => {
                            setManualUrl(e.target.value);
                            if (manualErrors.url) setManualErrors(prev => ({ ...prev, url: undefined }));
                          }}
                          className={`pl-10 h-11 bg-[var(--bg-surface)] text-sm border-[var(--border-subtle)] focus-visible:ring-[var(--accent-from)] ${
                            manualErrors.url ? "border-red-500/50 focus-visible:ring-red-500" : ""
                          }`}
                        />
                      </div>
                      {manualErrors.url ? (
                        <span className="text-[11px] text-red-500 font-semibold">{manualErrors.url}</span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Accepts HTTPS Git URLs (e.g. `https://github.com/username/project.git`)
                        </span>
                      )}
                    </div>

                    {/* GitHub Username */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="githubUsername" className="text-xs font-bold text-[var(--text-secondary)]">
                        Contributor Username
                      </Label>
                      <div className="relative">
                        <Code2
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <Input
                          id="githubUsername"
                          type="text"
                          placeholder="Aaditya8C"
                          value={manualUsername}
                          onChange={(e) => {
                            setManualUsername(e.target.value);
                            if (manualErrors.username) setManualErrors(prev => ({ ...prev, username: undefined }));
                          }}
                          className={`pl-10 h-11 bg-[var(--bg-surface)] text-sm border-[var(--border-subtle)] focus-visible:ring-[var(--accent-from)] ${
                            manualErrors.username ? "border-red-500/50 focus-visible:ring-red-500" : ""
                          }`}
                        />
                      </div>
                      {manualErrors.username ? (
                        <span className="text-[11px] text-red-500 font-semibold">{manualErrors.username}</span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          The exact author name or email matching your git commits.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmittingManual}
                    className="w-full h-11 mt-4 bg-[var(--accent-from)] hover:bg-[var(--accent-from)]/90 text-[#323437] font-extrabold text-sm flex items-center justify-center gap-2"
                  >
                    {isSubmittingManual ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    {isSubmittingManual ? "Submitting Request..." : "Analyze Repository"}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

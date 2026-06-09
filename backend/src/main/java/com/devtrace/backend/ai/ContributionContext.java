package com.devtrace.backend.ai;

import com.devtrace.backend.model.ContributionBreakdownItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * The fully processed contribution profile sent to the AI layer.
 * Contains pre-analyzed intelligence — the AI only polishes and enhances,
 * it never receives raw commits or diffs.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContributionContext {

    // ── Core Statistics ──────────────────────────────────────
    private String repositoryName;
    private int totalCommits;
    private int filesModified;
    private int linesAdded;
    private int linesDeleted;
    private String contributionPeriod;

    // ── Folder Intelligence ──────────────────────────────────
    private List<String> topFolders;

    // ── Commit Message Intelligence ──────────────────────────
    /** Top keywords extracted from commit messages (stop-word filtered). */
    private List<String> topKeywords;

    // ── Contribution Classification ──────────────────────────
    /** Engineering domain labels (e.g., "Frontend Development"). */
    private List<String> primaryAreas;

    /** Major activities inferred from keywords (e.g., "Refactoring"). */
    private List<String> majorActivities;

    /** Technologies derived from file extensions (e.g., "React", "Spring Boot"). */
    private List<String> technologyIndicators;

    // ── Detailed Breakdown ───────────────────────────────────
    /** Per-area contribution percentages with commit and file counts. */
    private List<ContributionBreakdownItem> contributionBreakdown;

    /** File extension frequency map (e.g., {".java": 48, ".tsx": 32}). */
    private Map<String, Integer> extensionFrequency;

    /** Keyword frequency map (e.g., {"refactor": 18, "validation": 7}). */
    private Map<String, Integer> keywordFrequency;

    /** Digest of descriptive commit messages. */
    private List<String> commitMessages;
}


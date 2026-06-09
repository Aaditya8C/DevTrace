package com.devtrace.backend.git;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Extracts and normalizes meaningful keywords from commit messages.
 * Filters stop words and low-signal tokens to surface the contributor's
 * primary activities (e.g., "refactoring", "authentication", "optimization").
 */
@Component
public class KeywordAnalyzer {

    // ── Stop words — filtered out from keyword extraction ────
    private static final Set<String> STOP_WORDS = Set.of(
            // Generic actions
            "fix", "fixed", "fixes", "fixing",
            "add", "added", "adds", "adding",
            "remove", "removed", "removes", "removing",
            "update", "updated", "updates", "updating",
            "change", "changed", "changes", "changing",
            "move", "moved", "moves", "moving",
            "use", "used", "uses", "using",
            "make", "made", "makes", "making",
            "set", "get", "create", "delete",
            // Low-signal commit noise
            "test", "tests", "testing",
            "merge", "merged", "merging",
            "temp", "tmp", "wip",
            "minor", "small", "initial", "first",
            "commit", "push", "pull",
            // Common English stop words
            "the", "a", "an", "and", "or", "but", "in", "on", "at",
            "to", "for", "of", "with", "by", "from", "as", "is", "was",
            "are", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "will", "would", "could", "should",
            "may", "might", "can", "shall",
            "not", "no", "nor", "so", "if", "then", "else",
            "this", "that", "these", "those", "it", "its",
            "all", "each", "every", "some", "any", "few", "more",
            "new", "old", "up", "out", "into", "over"
    );

    // ── Keyword normalization (past tense → base form) ───────
    private static final Map<String, String> NORMALIZATION_MAP = Map.ofEntries(
            Map.entry("refactored", "refactoring"),
            Map.entry("refactor", "refactoring"),
            Map.entry("refactors", "refactoring"),
            Map.entry("optimized", "optimization"),
            Map.entry("optimize", "optimization"),
            Map.entry("optimizes", "optimization"),
            Map.entry("optimizing", "optimization"),
            Map.entry("authenticated", "authentication"),
            Map.entry("authenticate", "authentication"),
            Map.entry("authenticating", "authentication"),
            Map.entry("validated", "validation"),
            Map.entry("validate", "validation"),
            Map.entry("validates", "validation"),
            Map.entry("validating", "validation"),
            Map.entry("implemented", "implementation"),
            Map.entry("implement", "implementation"),
            Map.entry("implements", "implementation"),
            Map.entry("implementing", "implementation"),
            Map.entry("configured", "configuration"),
            Map.entry("configure", "configuration"),
            Map.entry("configuring", "configuration"),
            Map.entry("integrated", "integration"),
            Map.entry("integrate", "integration"),
            Map.entry("integrating", "integration"),
            Map.entry("migrated", "migration"),
            Map.entry("migrate", "migration"),
            Map.entry("migrating", "migration"),
            Map.entry("deployed", "deployment"),
            Map.entry("deploy", "deployment"),
            Map.entry("deploying", "deployment"),
            Map.entry("responsive", "responsive-design"),
            Map.entry("documented", "documentation"),
            Map.entry("document", "documentation"),
            Map.entry("documenting", "documentation")
    );

    private final Map<String, Integer> keywordFrequency = new HashMap<>();

    /** Reset state for a new analysis run. */
    public void reset() {
        keywordFrequency.clear();
    }

    /**
     * Process a single commit message and accumulate keyword frequencies.
     */
    public void processCommitMessage(String message) {
        if (message == null || message.isBlank()) {
            return;
        }

        // Tokenize: split on non-alphanumeric characters, lowercase
        String[] tokens = message.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s-]", " ")
                .split("\\s+");

        for (String token : tokens) {
            String trimmed = token.trim();
            if (trimmed.length() < 3) continue;         // Skip very short tokens
            if (STOP_WORDS.contains(trimmed)) continue;  // Skip stop words

            // Normalize to canonical form if mapping exists
            String normalized = NORMALIZATION_MAP.getOrDefault(trimmed, trimmed);
            keywordFrequency.merge(normalized, 1, Integer::sum);
        }
    }

    /** Return the full keyword frequency map (unmodifiable copy). */
    public Map<String, Integer> getKeywordFrequency() {
        return Collections.unmodifiableMap(keywordFrequency);
    }

    /** Return the top N keywords sorted by frequency descending. */
    public List<String> getTopKeywords(int limit) {
        return keywordFrequency.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}

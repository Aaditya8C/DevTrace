package com.devtrace.backend.git;

import com.devtrace.backend.model.ContributionBreakdownItem;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Maps repository folder paths to engineering domain labels using
 * configurable pattern rules. Computes contribution percentages
 * and assigns distinct colors for dashboard chart rendering.
 */
@Component
public class ContributionClassifier {

    // ── Color palette for breakdown chart ────────────────────
    private static final String[] AREA_COLORS = {
            "#6366f1", // Indigo
            "#8b5cf6", // Violet
            "#06b6d4", // Cyan
            "#10b981", // Emerald
            "#f59e0b", // Amber
            "#ef4444", // Red
            "#ec4899", // Pink
            "#14b8a6", // Teal
            "#64748b", // Slate
    };

    /**
     * Classification rule: a set of folder path keywords that map to a domain label.
     */
    private record ClassificationRule(String label, List<String> patterns) {}

    // ── Classification rules (evaluated in order) ────────────
    private static final List<ClassificationRule> RULES = List.of(
            new ClassificationRule("Frontend Development",
                    List.of("components", "pages", "views", "layouts", "ui", "frontend", "app", "screens")),
            new ClassificationRule("Dashboard Development",
                    List.of("dashboard")),
            new ClassificationRule("REST API Development",
                    List.of("controller", "controllers", "api", "routes", "endpoints", "handler", "handlers")),
            new ClassificationRule("Backend Business Logic",
                    List.of("service", "services", "business", "domain", "usecase", "usecases")),
            new ClassificationRule("Data Modeling",
                    List.of("model", "models", "entity", "entities", "dto", "dtos", "schema", "schemas")),
            new ClassificationRule("Authentication & Security",
                    List.of("auth", "security", "oauth", "login", "session", "jwt")),
            new ClassificationRule("Testing",
                    List.of("test", "tests", "spec", "specs", "__tests__", "testing")),
            new ClassificationRule("Documentation",
                    List.of("docs", "documentation", "doc", "wiki")),
            new ClassificationRule("DevOps & CI/CD",
                    List.of(".github", "ci", "cd", "deploy", "deployment", "docker", "k8s", "kubernetes", "infra", "infrastructure")),
            new ClassificationRule("Configuration & Infrastructure",
                    List.of("config", "configuration", "settings", "gradle", "maven"))
    );

    /**
     * Classify folder frequencies into engineering domains and compute breakdown percentages.
     *
     * @param folderFrequency folder → change count map from {@link FolderAnalyzer}
     * @param totalCommits total contributor commits (used for percentage calculation)
     * @return ordered list of breakdown items sorted by percentage descending
     */
    public List<ContributionBreakdownItem> classify(Map<String, Integer> folderFrequency, int totalCommits) {
        Map<String, Integer> domainCommits = new LinkedHashMap<>();
        Map<String, Integer> domainFiles = new LinkedHashMap<>();

        for (Map.Entry<String, Integer> entry : folderFrequency.entrySet()) {
            String folder = entry.getKey().toLowerCase();
            int count = entry.getValue();
            String label = classifyFolder(folder);

            domainCommits.merge(label, count, Integer::sum);
            domainFiles.merge(label, count, Integer::sum);
        }

        if (domainCommits.isEmpty()) {
            return List.of();
        }

        // Calculate percentages
        int totalWeight = domainCommits.values().stream().mapToInt(Integer::intValue).sum();

        List<ContributionBreakdownItem> items = new ArrayList<>();
        int colorIndex = 0;

        List<Map.Entry<String, Integer>> sorted = domainCommits.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .collect(Collectors.toList());

        for (Map.Entry<String, Integer> entry : sorted) {
            int percentage = Math.round((float) entry.getValue() / totalWeight * 100);
            if (percentage < 1) continue; // skip negligible areas

            items.add(new ContributionBreakdownItem(
                    entry.getKey(),
                    percentage,
                    Math.min(entry.getValue(), totalCommits), // cap at total commits
                    domainFiles.getOrDefault(entry.getKey(), 0),
                    AREA_COLORS[colorIndex % AREA_COLORS.length]
            ));
            colorIndex++;
        }

        return items;
    }

    /** Return the top N domain labels from the classification. */
    public List<String> getPrimaryAreas(List<ContributionBreakdownItem> breakdown, int limit) {
        return breakdown.stream()
                .limit(limit)
                .map(ContributionBreakdownItem::getArea)
                .collect(Collectors.toList());
    }

    /**
     * Match a folder path against classification rules.
     * Returns the first matching domain label, or "Other" if none match.
     */
    private String classifyFolder(String folderPath) {
        String[] segments = folderPath.split("/");
        for (String segment : segments) {
            for (ClassificationRule rule : RULES) {
                if (rule.patterns().contains(segment)) {
                    return rule.label();
                }
            }
        }
        return "Other";
    }
}

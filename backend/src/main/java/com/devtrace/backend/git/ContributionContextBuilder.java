package com.devtrace.backend.git;

import com.devtrace.backend.ai.ContributionContext;
import com.devtrace.backend.model.ContributionBreakdownItem;
import com.devtrace.backend.model.RawContributionData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Assembles the final {@link ContributionContext} from raw analyzer outputs.
 * This is a pure transformation step — no I/O, no JGit calls.
 */
@Component
public class ContributionContextBuilder {
    private static final Logger log = LoggerFactory.getLogger(ContributionContextBuilder.class);

    private final ContributionClassifier classifier;
    private final KeywordAnalyzer keywordAnalyzer;
    private final FolderAnalyzer folderAnalyzer;

    public ContributionContextBuilder(
            ContributionClassifier classifier,
            KeywordAnalyzer keywordAnalyzer,
            FolderAnalyzer folderAnalyzer
    ) {
        this.classifier = classifier;
        this.keywordAnalyzer = keywordAnalyzer;
        this.folderAnalyzer = folderAnalyzer;
    }

    /**
     * Build the enriched contribution context from raw aggregated data.
     *
     * @param raw the output of {@link ContributionAggregator#aggregate}
     * @return fully populated {@link ContributionContext}
     */
    public ContributionContext build(RawContributionData raw) {
        log.info("Building ContributionContext for repository: {}", raw.repositoryName());

        // ── Contribution period ──────────────────────────────
        String contributionPeriod = formatContributionPeriod(raw.firstCommitDate(), raw.lastCommitDate());

        // ── Folder analysis ──────────────────────────────────
        List<String> topFolders = folderAnalyzer.getTopFolders(10);

        // ── Keyword analysis ─────────────────────────────────
        List<String> topKeywords = keywordAnalyzer.getTopKeywords(15);

        // ── Contribution classification ──────────────────────
        List<ContributionBreakdownItem> breakdown = classifier.classify(
                raw.folderFrequency(), raw.totalCommits()
        );
        List<String> primaryAreas = classifier.getPrimaryAreas(breakdown, 5);

        // ── Major activities from keywords ───────────────────
        List<String> majorActivities = deriveMajorActivities(raw.keywordFrequency());

        // ── Technology indicators ────────────────────────────
        List<String> technologyIndicators = raw.fileChangeResult().technologyIndicators();

        // ── Assemble ─────────────────────────────────────────
        ContributionContext context = new ContributionContext();
        context.setRepositoryName(raw.repositoryName());
        context.setTotalCommits(raw.totalCommits());
        context.setFilesModified(raw.totalFilesModified());
        context.setLinesAdded(raw.totalLinesAdded());
        context.setLinesDeleted(raw.totalLinesDeleted());
        context.setContributionPeriod(contributionPeriod);
        context.setTopFolders(topFolders);
        context.setTopKeywords(topKeywords);
        context.setPrimaryAreas(primaryAreas);
        context.setMajorActivities(majorActivities);
        context.setTechnologyIndicators(technologyIndicators);
        context.setContributionBreakdown(breakdown);
        context.setExtensionFrequency(new HashMap<>(raw.extensionFrequency()));
        context.setKeywordFrequency(new HashMap<>(raw.keywordFrequency()));

        log.info("ContributionContext built: {} commits, {} areas, {} technologies, {} keywords",
                context.getTotalCommits(), primaryAreas.size(),
                technologyIndicators.size(), topKeywords.size());

        return context;
    }

    /**
     * Derive major activities from keyword frequency.
     * Capitalizes and formats keywords into human-readable activity labels.
     */
    private List<String> deriveMajorActivities(Map<String, Integer> keywordFrequency) {
        // Activity-class keywords we want to surface
        Set<String> activityKeywords = Set.of(
                "refactoring", "optimization", "authentication", "validation",
                "implementation", "configuration", "integration", "migration",
                "deployment", "documentation", "responsive-design",
                "api", "dashboard", "security", "testing", "database",
                "styling", "routing", "logging", "caching", "monitoring",
                "debugging", "performance", "accessibility", "pagination",
                "localization", "internationalization", "search", "filtering",
                "sorting", "notification", "analytics", "error-handling"
        );

        return keywordFrequency.entrySet().stream()
                .filter(e -> activityKeywords.contains(e.getKey()))
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(6)
                .map(e -> formatActivity(e.getKey()))
                .collect(Collectors.toList());
    }

    /** Convert "responsive-design" → "Responsive Design", "api" → "API" */
    private String formatActivity(String keyword) {
        if (keyword.equalsIgnoreCase("api")) return "API Development";
        if (keyword.equalsIgnoreCase("css")) return "Styling";
        if (keyword.equalsIgnoreCase("ui")) return "UI Development";

        return Arrays.stream(keyword.split("-"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                .collect(Collectors.joining(" "));
    }

    private String formatContributionPeriod(LocalDate firstDate, LocalDate lastDate) {
        if (firstDate == null || lastDate == null) {
            return "0 days";
        }
        long days = ChronoUnit.DAYS.between(firstDate, lastDate);
        if (days < 30) {
            return days + " days";
        }
        long months = ChronoUnit.MONTHS.between(firstDate, lastDate);
        if (months == 0) {
            return days + " days";
        }
        return months + " months";
    }
}

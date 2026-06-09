package com.devtrace.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResult {
    private GitStatistics statistics;
    private AiContributionReport aiReport;

    // ── Enriched fields from Contribution Intelligence Engine ──
    private List<ContributionBreakdownItem> contributionBreakdown;
    private Map<String, Integer> fileExtensions;
    private List<String> topKeywords;
    private List<String> technologyIndicators;
}

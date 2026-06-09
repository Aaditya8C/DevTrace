package com.devtrace.backend.model;

import java.util.List;
import java.util.Map;

/**
 * Holds the output of {@link com.devtrace.backend.git.FileChangeAnalyzer}.
 * Captures file extension frequencies, change-type counts, and technology indicators
 * derived from file extensions.
 */
public record FileChangeResult(
        Map<String, Integer> extensionFrequency,
        int filesAdded,
        int filesModified,
        int filesDeleted,
        List<String> technologyIndicators
) {}

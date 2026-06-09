package com.devtrace.backend.model;

import com.devtrace.backend.git.CommitStats;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Internal transfer object that aggregates the raw outputs of all analyzers
 * after a single-pass commit traversal. This is consumed by
 * {@link com.devtrace.backend.git.ContributionContextBuilder} to assemble
 * the final {@link com.devtrace.backend.ai.ContributionContext}.
 */
public record RawContributionData(
        String repositoryName,
        int totalCommits,
        int totalFilesModified,
        int totalLinesAdded,
        int totalLinesDeleted,
        LocalDate firstCommitDate,
        LocalDate lastCommitDate,
        List<String> commitMessages,
        Map<String, Integer> folderFrequency,
        Map<String, Integer> extensionFrequency,
        Map<String, Integer> keywordFrequency,
        FileChangeResult fileChangeResult
) {}

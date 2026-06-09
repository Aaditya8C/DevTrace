package com.devtrace.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GitStatistics {
    private int totalCommits;
    private int filesModified;
    private int linesAdded;
    private int linesDeleted;
    private String contributionPeriod;
}

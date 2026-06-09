package com.devtrace.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisJob {
    private String jobId;
    private AnalysisStatus status;
    private int progress;
    private String repositoryUrl;
    private String githubUsername;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private AnalysisResult result;
    private String errorMessage;
}

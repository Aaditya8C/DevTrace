package com.devtrace.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AnalysisRequestDto {
    @NotBlank(message = "Repository URL is required")
    @Pattern(regexp = "^https?://github\\.com/[^/]+/[^/]+$", message = "Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)")
    private String repositoryUrl;

    @NotBlank(message = "GitHub username is required")
    private String githubUsername;
}

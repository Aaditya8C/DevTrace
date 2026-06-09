package com.devtrace.backend.ai.provider;

import com.devtrace.backend.ai.ContributionContext;
import java.util.List;

public interface AiProvider {
    List<String> generateContributionSummary(ContributionContext context);
    List<String> generateResumeBullets(ContributionContext context);
    String generateLinkedInSummary(ContributionContext context);
    List<String> generateInterviewTopics(ContributionContext context);
}

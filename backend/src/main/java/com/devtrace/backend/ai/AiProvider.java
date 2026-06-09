package com.devtrace.backend.ai;

import com.devtrace.backend.model.AiContributionReport;

public interface AiProvider {
    AiContributionReport generateReport(ContributionContext context);
}

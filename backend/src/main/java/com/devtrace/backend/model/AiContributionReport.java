package com.devtrace.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiContributionReport {
    private List<String> contributionSummary;
    private List<String> resumeBullets;
    private String linkedInSummary;
    private List<String> interviewTopics;
}

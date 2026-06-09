package com.devtrace.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContributionBreakdownItem {
    private String area;        // e.g. "Frontend Development"
    private int percentage;     // e.g. 48
    private int commits;        // e.g. 61
    private int filesChanged;   // e.g. 70
    private String color;       // e.g. "#6366f1"
}

package com.devtrace.backend.dto;

import com.devtrace.backend.model.AnalysisStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobStatusDto {
    private String jobId;
    private AnalysisStatus status;
    private int progress;
}

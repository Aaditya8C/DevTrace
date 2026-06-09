package com.devtrace.backend.dto;

import com.devtrace.backend.model.AnalysisResult;
import com.devtrace.backend.model.AnalysisStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobResultDto {
    private AnalysisStatus status;
    private AnalysisResult result;
    private String errorMessage;
}

package com.devtrace.backend.controller;

import com.devtrace.backend.dto.AnalysisRequestDto;
import com.devtrace.backend.dto.AnalysisResponseDto;
import com.devtrace.backend.dto.JobResultDto;
import com.devtrace.backend.dto.JobStatusDto;
import com.devtrace.backend.model.AnalysisJob;
import com.devtrace.backend.service.AnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;

    // Constructor Injection
    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/start")
    public ResponseEntity<AnalysisResponseDto> startAnalysis(@Valid @RequestBody AnalysisRequestDto request) {
        String jobId = analysisService.submitAnalysis(request);
        return ResponseEntity.ok(new AnalysisResponseDto(jobId));
    }

    @GetMapping("/{jobId}/status")
    public ResponseEntity<JobStatusDto> getJobStatus(@PathVariable String jobId) {
        AnalysisJob job = analysisService.getJob(jobId);
        return ResponseEntity.ok(new JobStatusDto(job.getJobId(), job.getStatus(), job.getProgress()));
    }

    @GetMapping("/{jobId}/result")
    public ResponseEntity<JobResultDto> getJobResult(@PathVariable String jobId) {
        AnalysisJob job = analysisService.getJob(jobId);
        return ResponseEntity.ok(new JobResultDto(job.getStatus(), job.getResult(), job.getErrorMessage()));
    }

    @GetMapping("/verify")
    public ResponseEntity<com.devtrace.backend.model.RepositoryAccessState> verifyRepositoryAccess(
            @org.springframework.web.bind.annotation.RequestParam String repositoryUrl
    ) {
        com.devtrace.backend.model.RepositoryAccessState state = analysisService.verifyRepositoryAccess(repositoryUrl);
        return ResponseEntity.ok(state);
    }
}

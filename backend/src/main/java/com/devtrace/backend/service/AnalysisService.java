package com.devtrace.backend.service;

import com.devtrace.backend.ai.AiProvider;
import com.devtrace.backend.ai.ContributionContext;
import com.devtrace.backend.config.DevTraceProperties;
import com.devtrace.backend.dto.AnalysisRequestDto;
import com.devtrace.backend.exception.JobNotFoundException;
import com.devtrace.backend.git.ContributionAggregator;
import com.devtrace.backend.git.ContributionContextBuilder;
import com.devtrace.backend.git.RepositoryCloner;
import com.devtrace.backend.model.AnalysisJob;
import com.devtrace.backend.model.AnalysisResult;
import com.devtrace.backend.model.AnalysisStatus;
import com.devtrace.backend.model.AiContributionReport;
import com.devtrace.backend.model.GitStatistics;
import com.devtrace.backend.model.RawContributionData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AnalysisService {
    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private final Map<String, AnalysisJob> jobStore = new ConcurrentHashMap<>();
    private final RepositoryCloner repositoryCloner;
    private final ContributionAggregator contributionAggregator;
    private final ContributionContextBuilder contributionContextBuilder;
    private final AiProvider aiProvider;
    private final DevTraceProperties devTraceProperties;
    private final com.devtrace.backend.security.SessionService sessionService;
    private final java.util.concurrent.Executor taskExecutor;

    // Constructor Injection
    public AnalysisService(
            RepositoryCloner repositoryCloner,
            ContributionAggregator contributionAggregator,
            ContributionContextBuilder contributionContextBuilder,
            AiProvider aiProvider,
            DevTraceProperties devTraceProperties,
            com.devtrace.backend.security.SessionService sessionService,
            @org.springframework.beans.factory.annotation.Qualifier("taskExecutor") java.util.concurrent.Executor taskExecutor
    ) {
        this.repositoryCloner = repositoryCloner;
        this.contributionAggregator = contributionAggregator;
        this.contributionContextBuilder = contributionContextBuilder;
        this.aiProvider = aiProvider;
        this.devTraceProperties = devTraceProperties;
        this.sessionService = sessionService;
        this.taskExecutor = taskExecutor;
    }

    public String submitAnalysis(AnalysisRequestDto request) {
        String jobId = UUID.randomUUID().toString();
        log.info("Submitting analysis job {} for repo {} by username {}", jobId, request.getRepositoryUrl(), request.getGithubUsername());

        AnalysisJob job = new AnalysisJob(
                jobId,
                AnalysisStatus.PENDING,
                0,
                request.getRepositoryUrl(),
                request.getGithubUsername(),
                LocalDateTime.now(),
                null,
                null,
                null
        );

        jobStore.put(jobId, job);
        
        // Resolve OAuth token on the request thread before entering async execution context
        String token = sessionService.getOAuthToken();
        
        // Trigger async execution directly in the thread pool to avoid self-invocation proxy bypass
        taskExecutor.execute(() -> processAnalysis(jobId, token));

        return jobId;
    }

    public AnalysisJob getJob(String jobId) {
        AnalysisJob job = jobStore.get(jobId);
        if (job == null) {
            throw new JobNotFoundException("Job with ID " + jobId + " not found");
        }
        return job;
    }

    public void processAnalysis(String jobId, String token) {
        AnalysisJob job = jobStore.get(jobId);
        if (job == null) {
            log.error("Async execution failed: Job {} not found in store", jobId);
            return;
        }

        log.info("Starting analysis async process for job {}", jobId);
        job.setStatus(AnalysisStatus.RUNNING);
        job.setProgress(10);
        
        Path tempRepoDir = Paths.get(devTraceProperties.getTempDirectory(), jobId);
        
        try {
            // Ensure temp directory parent directory exists
            Files.createDirectories(tempRepoDir.getParent());

            // 1. Clone repository
            job.setProgress(20);
            repositoryCloner.cloneRepository(job.getRepositoryUrl(), tempRepoDir, token);
            job.setProgress(40);

            // 2. Single-pass contribution aggregation (all analyzers run simultaneously)
            RawContributionData rawData = contributionAggregator.aggregate(tempRepoDir, job.getGithubUsername());
            job.setProgress(60);

            // 3. Build enriched ContributionContext from raw analyzer outputs
            ContributionContext context = contributionContextBuilder.build(rawData);
            job.setProgress(70);

            // 4. Derive GitStatistics from the context
            GitStatistics stats = new GitStatistics(
                    context.getTotalCommits(),
                    context.getFilesModified(),
                    context.getLinesAdded(),
                    context.getLinesDeleted(),
                    context.getContributionPeriod()
            );

            // 5. Generate AI report (safely decoupled from statistics)
            AiContributionReport aiReport = null;
            try {
                log.info("Requesting AI report generation for job {}", jobId);
                aiReport = aiProvider.generateReport(context);
                log.info("AI report generation completed for job {}", jobId);
            } catch (Exception aiException) {
                log.error("AI report generation failed for job {}, returning statistics only", jobId, aiException);
                // AI failure does not crash the overall job
            }
            job.setProgress(90);

            // 6. Build enriched AnalysisResult with breakdown data
            AnalysisResult result = new AnalysisResult(
                    stats,
                    aiReport,
                    context.getContributionBreakdown(),
                    context.getExtensionFrequency(),
                    context.getTopKeywords(),
                    context.getTechnologyIndicators()
            );

            job.setResult(result);
            job.setStatus(AnalysisStatus.COMPLETED);
            job.setCompletedAt(LocalDateTime.now());
            job.setProgress(100);
            log.info("Job {} completed successfully", jobId);

        } catch (Exception e) {
            log.error("Job {} failed with error during Git analysis", jobId, e);
            job.setStatus(AnalysisStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setProgress(100);
        } finally {
            // Clean up cloned repository folder
            try {
                repositoryCloner.deleteRepository(tempRepoDir);
            } catch (IOException ioException) {
                log.error("Failed to clean up cloned repository at {}", tempRepoDir, ioException);
            }
        }
    }

    public com.devtrace.backend.model.RepositoryAccessState verifyRepositoryAccess(String repositoryUrl) {
        log.info("Verifying access state for repository: {}", repositoryUrl);
        
        // Try anonymous ls-remote first
        try {
            org.eclipse.jgit.api.Git.lsRemoteRepository()
                    .setRemote(repositoryUrl)
                    .call();
            log.info("Repository {} is PUBLIC", repositoryUrl);
            return com.devtrace.backend.model.RepositoryAccessState.PUBLIC;
        } catch (org.eclipse.jgit.api.errors.TransportException te) {
            String msg = te.getMessage();
            log.warn("Anonymous check failed for {}: {}", repositoryUrl, msg);
            
            // Access denied/auth required implies private repository
            if (msg != null && (msg.contains("Authentication is required") 
                    || msg.contains("not authorized") 
                    || msg.contains("CredentialsProvider"))) {
                
                if (sessionService.isAuthenticated()) {
                    String oauthToken = sessionService.getOAuthToken();
                    if (oauthToken != null) {
                        try {
                            org.eclipse.jgit.api.Git.lsRemoteRepository()
                                    .setRemote(repositoryUrl)
                                    .setCredentialsProvider(new org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider(oauthToken, ""))
                                    .call();
                            log.info("Repository {} is PRIVATE_ACCESSIBLE", repositoryUrl);
                            return com.devtrace.backend.model.RepositoryAccessState.PRIVATE_ACCESSIBLE;
                        } catch (Exception ex) {
                            log.warn("Authenticated check failed for {}: {}", repositoryUrl, ex.getMessage());
                            return com.devtrace.backend.model.RepositoryAccessState.PRIVATE_NOT_ACCESSIBLE;
                        }
                    }
                }
                return com.devtrace.backend.model.RepositoryAccessState.PRIVATE_NOT_ACCESSIBLE;
            }
            return com.devtrace.backend.model.RepositoryAccessState.NOT_FOUND;
        } catch (Exception e) {
            log.error("Error verifying repository access for {}", repositoryUrl, e);
            return com.devtrace.backend.model.RepositoryAccessState.NOT_FOUND;
        }
    }
}

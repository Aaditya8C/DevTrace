package com.devtrace.backend.ai.orchestrator;

import com.devtrace.backend.ai.ContributionContext;
import com.devtrace.backend.ai.provider.AiProvider;
import com.devtrace.backend.config.AiProperties;
import com.devtrace.backend.model.AiContributionReport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AiOrchestrator {
    private static final Logger log = LoggerFactory.getLogger(AiOrchestrator.class);

    private final Map<String, AiProvider> providerMap;
    private final AiProperties aiProperties;

    // Metrics Tracking Maps
    private final Map<String, Long> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> successCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> failureCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> accumulatedLatency = new ConcurrentHashMap<>();

    public AiOrchestrator(Map<String, AiProvider> providerMap, AiProperties aiProperties) {
        this.providerMap = providerMap;
        this.aiProperties = aiProperties;
    }

    /**
     * Resolves the order of providers to try based on the primary-provider and fallback-order properties.
     */
    public List<String> getProviderOrder() {
        List<String> order = new ArrayList<>();
        String primary = aiProperties.getPrimaryProvider();
        if (primary != null && !primary.isBlank()) {
            order.add(primary.trim().toLowerCase());
        }

        List<String> fallbacks = aiProperties.getFallbackOrder();
        if (fallbacks != null) {
            for (String fallback : fallbacks) {
                String cleanFallback = fallback.trim().toLowerCase();
                if (!order.contains(cleanFallback)) {
                    order.add(cleanFallback);
                }
            }
        }
        return order;
    }

    /**
     * Orchestrates the AI report generation across available providers, applying fallbacks in order.
     */
    public AiContributionReport generateReport(ContributionContext context) {
        List<String> order = getProviderOrder();
        Exception lastException = null;

        for (String providerKey : order) {
            String beanName = providerKey + "Provider";
            AiProvider provider = providerMap.get(beanName);

            if (provider == null) {
                log.warn("AI Provider bean '{}' not found in application context. Skipping.", beanName);
                continue;
            }

            long startTime = System.currentTimeMillis();
            incrementCounter(requestCounts, providerKey);

            try {
                log.info("Attempting AI report generation with provider: {}", providerKey);

                // These methods use the caching mechanism in AbstractAiProvider, making a single network call.
                List<String> summary = provider.generateContributionSummary(context);
                List<String> resumeBullets = provider.generateResumeBullets(context);
                String linkedInSummary = provider.generateLinkedInSummary(context);
                List<String> interviewTopics = provider.generateInterviewTopics(context);

                long latency = System.currentTimeMillis() - startTime;
                recordSuccess(providerKey, latency);

                log.info("Successfully generated AI report using provider '{}' in {} ms", providerKey, latency);
                return new AiContributionReport(summary, resumeBullets, linkedInSummary, interviewTopics);

            } catch (Exception e) {
                long latency = System.currentTimeMillis() - startTime;
                log.warn("AI Provider '{}' failed in {} ms: {}", providerKey, latency, e.getMessage());

                recordFailure(providerKey, latency);
                lastException = e;
            }
        }

        throw new RuntimeException("All configured AI providers failed to generate report. Last error: "
                + (lastException != null ? lastException.getMessage() : "No active providers"), lastException);
    }

    private void recordSuccess(String providerKey, long latency) {
        incrementCounter(successCounts, providerKey);
        accumulateTime(providerKey, latency);
    }

    private void recordFailure(String providerKey, long latency) {
        incrementCounter(failureCounts, providerKey);
        accumulateTime(providerKey, latency);
    }

    private void incrementCounter(Map<String, Long> counterMap, String key) {
        counterMap.merge(key, 1L, Long::sum);
    }

    private void accumulateTime(String key, long latency) {
        accumulatedLatency.merge(key, latency, Long::sum);
    }

    /**
     * Exposes compiled metrics snapshot for future monitoring / API access.
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        List<Map<String, Object>> providerMetrics = new ArrayList<>();

        for (String providerKey : requestCounts.keySet()) {
            long total = requestCounts.getOrDefault(providerKey, 0L);
            long success = successCounts.getOrDefault(providerKey, 0L);
            long failures = failureCounts.getOrDefault(providerKey, 0L);
            long totalTime = accumulatedLatency.getOrDefault(providerKey, 0L);
            double avgLatency = total > 0 ? (double) totalTime / total : 0.0;
            double successRate = total > 0 ? (double) success / total * 100.0 : 0.0;

            Map<String, Object> metrics = new LinkedHashMap<>();
            metrics.put("provider", providerKey);
            metrics.put("totalRequests", total);
            metrics.put("successCount", success);
            metrics.put("failureCount", failures);
            metrics.put("successRatePercentage", String.format("%.2f%%", successRate));
            metrics.put("averageLatencyMs", String.format("%.2f ms", avgLatency));

            providerMetrics.add(metrics);
        }

        snapshot.put("timestamp", new Date());
        snapshot.put("providers", providerMetrics);
        return snapshot;
    }
}

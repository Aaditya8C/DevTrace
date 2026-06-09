package com.devtrace.backend.ai.provider;

import com.devtrace.backend.ai.ContributionContext;
import com.devtrace.backend.ai.PromptBuilder;
import com.devtrace.backend.ai.AiResponseParser;
import com.devtrace.backend.model.AiContributionReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public abstract class AbstractAiProvider implements AiProvider {
    protected final Logger log = LoggerFactory.getLogger(getClass());

    protected final PromptBuilder promptBuilder;
    protected final AiResponseParser responseParser;
    protected final ObjectMapper objectMapper;
    protected final HttpClient httpClient;

    // Thread-safe LRU Cache (limited to 50 entries to avoid memory leaks)
    private final Map<ContributionContext, AiContributionReport> cache = Collections
            .synchronizedMap(new LinkedHashMap<ContributionContext, AiContributionReport>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<ContributionContext, AiContributionReport> eldest) {
                    return size() > 50;
                }
            });

    protected AbstractAiProvider(
            PromptBuilder promptBuilder,
            AiResponseParser responseParser,
            ObjectMapper objectMapper) {
        this.promptBuilder = promptBuilder;
        this.responseParser = responseParser;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    protected abstract AiContributionReport executeReportGeneration(ContributionContext context);

    private AiContributionReport getReport(ContributionContext context) {
        AiContributionReport report = cache.get(context);
        if (report != null) {
            return report;
        }
        report = executeReportGeneration(context);
        if (report != null) {
            cache.put(context, report);
        }
        return report;
    }

    @Override
    public List<String> generateContributionSummary(ContributionContext context) {
        return getReport(context).getContributionSummary();
    }

    @Override
    public List<String> generateResumeBullets(ContributionContext context) {
        return getReport(context).getResumeBullets();
    }

    @Override
    public String generateLinkedInSummary(ContributionContext context) {
        return getReport(context).getLinkedInSummary();
    }

    @Override
    public List<String> generateInterviewTopics(ContributionContext context) {
        return getReport(context).getInterviewTopics();
    }

    /**
     * Helper to perform standard OpenAI completions post requests (shared by
     * OpenRouter, Ollama)
     */
    protected String executeOpenAiCompatibleRequest(
            String url,
            String apiKey,
            String model,
            String prompt,
            Duration timeout) throws Exception {
        Map<String, Object> message = Map.of(
                "role", "user",
                "content", prompt);
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(message),
                "temperature", 0.7);

        String jsonRequest = objectMapper.writeValueAsString(requestBody);

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonRequest))
                .timeout(timeout);

        if (apiKey != null && !apiKey.isBlank()) {
            requestBuilder.header("Authorization", "Bearer " + apiKey);
        }

        if (url.contains("openrouter.ai")) {
            requestBuilder.header("HTTP-Referer", "https://devtrace.com");
            requestBuilder.header("X-Title", "DevTrace");
        }

        HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("API error for URL {}. Status: {}, Response: {}", url, response.statusCode(), response.body());
            throw new RuntimeException("API returned status code " + response.statusCode() + ": " + response.body());
        }

        Map<?, ?> responseMap = objectMapper.readValue(response.body(), Map.class);
        List<?> choices = (List<?>) responseMap.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("No choices returned in API response");
        }
        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
        Map<?, ?> messageMap = (Map<?, ?>) choice.get("message");
        if (messageMap == null) {
            throw new RuntimeException("No message found in choice");
        }
        return (String) messageMap.get("content");
    }
}

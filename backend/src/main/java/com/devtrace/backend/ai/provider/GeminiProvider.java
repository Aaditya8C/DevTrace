package com.devtrace.backend.ai.provider;

import com.devtrace.backend.ai.ContributionContext;
import com.devtrace.backend.ai.PromptBuilder;
import com.devtrace.backend.ai.AiResponseParser;
import com.devtrace.backend.config.AiProperties;
import com.devtrace.backend.model.AiContributionReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component("geminiProvider")
public class GeminiProvider extends AbstractAiProvider {

    private final AiProperties aiProperties;

    public GeminiProvider(
            AiProperties aiProperties,
            PromptBuilder promptBuilder,
            AiResponseParser responseParser,
            ObjectMapper objectMapper
    ) {
        super(promptBuilder, responseParser, objectMapper);
        this.aiProperties = aiProperties;
    }

    @Override
    protected AiContributionReport executeReportGeneration(ContributionContext context) {
        String apiKey = aiProperties.getGemini().getApiKey();
        String model = aiProperties.getGemini().getModel();

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key is not configured. Skipping Gemini AI report generation.");
            throw new IllegalStateException("Gemini API key is missing.");
        }

        String prompt = promptBuilder.buildReportPrompt(context);
        log.info("Sending request to Gemini API for model {}", model);

        try {
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    )
            );
            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequest))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error. Status: {}, Response: {}", response.statusCode(), response.body());
                throw new RuntimeException("Gemini API returned status code " + response.statusCode());
            }

            Map<?, ?> responseMap = objectMapper.readValue(response.body(), Map.class);
            List<?> candidates = (List<?>) responseMap.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("No candidates returned from Gemini API");
            }
            Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> content = (Map<?, ?>) candidate.get("content");
            List<?> parts = (List<?>) content.get("parts");
            Map<?, ?> part = (Map<?, ?>) parts.get(0);
            String rawText = (String) part.get("text");

            log.info("Successfully received response from Gemini API");
            return responseParser.parseResponse(rawText);

        } catch (Exception e) {
            log.error("Error generating report from Gemini AI Provider", e);
            throw new RuntimeException("Failed to generate AI report from Gemini: " + e.getMessage(), e);
        }
    }
}

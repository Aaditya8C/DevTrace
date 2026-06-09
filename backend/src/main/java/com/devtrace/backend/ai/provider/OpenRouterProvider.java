package com.devtrace.backend.ai.provider;

import com.devtrace.backend.ai.ContributionContext;
import com.devtrace.backend.ai.PromptBuilder;
import com.devtrace.backend.ai.AiResponseParser;
import com.devtrace.backend.config.AiProperties;
import com.devtrace.backend.model.AiContributionReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component("openrouterProvider")
public class OpenRouterProvider extends AbstractAiProvider {

    private final AiProperties aiProperties;

    public OpenRouterProvider(
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
        String apiKey = aiProperties.getOpenrouter().getApiKey();
        String model = aiProperties.getOpenrouter().getModel();
        String url = aiProperties.getOpenrouter().getUrl();

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OpenRouter API key is not configured. Skipping OpenRouter AI report generation.");
            throw new IllegalStateException("OpenRouter API key is missing.");
        }

        String prompt = promptBuilder.buildReportPrompt(context);
        log.info("Sending request to OpenRouter API (URL: {}) for model {}", url, model);

        try {
            String rawText = executeOpenAiCompatibleRequest(url, apiKey, model, prompt, Duration.ofSeconds(30));
            log.info("Successfully received response from OpenRouter API");
            return responseParser.parseResponse(rawText);

        } catch (Exception e) {
            log.error("Error generating report from OpenRouter AI Provider", e);
            throw new RuntimeException("Failed to generate AI report from OpenRouter: " + e.getMessage(), e);
        }
    }
}

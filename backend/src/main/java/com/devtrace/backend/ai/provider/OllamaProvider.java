package com.devtrace.backend.ai.provider;

import com.devtrace.backend.ai.ContributionContext;
import com.devtrace.backend.ai.PromptBuilder;
import com.devtrace.backend.ai.AiResponseParser;
import com.devtrace.backend.config.AiProperties;
import com.devtrace.backend.model.AiContributionReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component("ollamaProvider")
public class OllamaProvider extends AbstractAiProvider {

    private final AiProperties aiProperties;

    public OllamaProvider(
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
        if (!aiProperties.getOllama().isEnabled()) {
            log.warn("Ollama provider is disabled. Skipping Ollama AI report generation.");
            throw new IllegalStateException("Ollama provider is disabled in settings.");
        }

        String model = aiProperties.getOllama().getModel();
        String url = aiProperties.getOllama().getUrl();

        String prompt = promptBuilder.buildReportPrompt(context);
        log.info("Sending request to local Ollama instance (URL: {}) for model {}", url, model);

        try {
            // Ollama runs locally and does not require an API key, passing null for the apiKey
            String rawText = executeOpenAiCompatibleRequest(url, null, model, prompt, Duration.ofSeconds(60));
            log.info("Successfully received response from Ollama API");
            return responseParser.parseResponse(rawText);

        } catch (Exception e) {
            log.error("Error generating report from Ollama AI Provider", e);
            throw new RuntimeException("Failed to generate AI report from Ollama: " + e.getMessage(), e);
        }
    }
}

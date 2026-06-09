package com.devtrace.backend.ai;

import com.devtrace.backend.model.AiContributionReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AiResponseParser {
    private static final Logger log = LoggerFactory.getLogger(AiResponseParser.class);
    private final ObjectMapper objectMapper;

    public AiResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AiContributionReport parseResponse(String rawResponse) {
        log.info("Parsing AI response");
        try {
            String cleanJson = rawResponse.trim();
            // Clean markdown blocks if LLM outputted them
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            return objectMapper.readValue(cleanJson, AiContributionReport.class);
        } catch (Exception e) {
            log.error("Failed to parse AI response JSON: {}", rawResponse, e);
            throw new RuntimeException("Failed to parse AI report JSON response: " + e.getMessage(), e);
        }
    }
}

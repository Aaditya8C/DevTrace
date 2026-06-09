package com.devtrace.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Data
@Configuration
@ConfigurationProperties(prefix = "ai")
public class AiProperties {
    private String primaryProvider = "gemini";
    private List<String> fallbackOrder = new ArrayList<>(List.of("openrouter", "ollama"));
    private GeminiProperties gemini = new GeminiProperties();
    private OpenRouterProperties openrouter = new OpenRouterProperties();
    private OllamaProperties ollama = new OllamaProperties();

    @Data
    public static class GeminiProperties {
        private String apiKey;
        private String model = "gemini-2.5-flash";
    }

    @Data
    public static class OpenRouterProperties {
        private String apiKey;
        private String model = "deepseek/deepseek-r1";
        private String url = "https://openrouter.ai/api/v1/chat/completions";
    }

    @Data
    public static class OllamaProperties {
        private String url = "http://localhost:11434/v1/chat/completions";
        private String model = "llama3";
        private boolean enabled = false;
    }
}

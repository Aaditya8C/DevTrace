package com.devtrace.backend.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponse {
    private String content;
    private ProviderType providerType;
    private String modelUsed;
    private long latencyMs;
    private boolean success;
    private String errorMessage;
}

package com.devtrace.backend.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ValidationErrorResponse(
        int status,
        String error,
        Map<String, String> details,
        LocalDateTime timestamp
) {}

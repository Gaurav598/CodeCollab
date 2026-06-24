package com.collabcode.ai.model;

public record AiGatewayResult(
        String provider,
        boolean fallback,
        String text,
        long latencyMs
) {}

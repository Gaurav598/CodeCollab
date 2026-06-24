package com.collabcode.ai.dto;

import java.util.List;
import java.util.Map;

public record AiResponse(
        String feature,
        String provider,
        boolean fallback,
        String content,
        String previewCode,
        List<Map<String, String>> findings,
        List<String> strengths,
        List<String> weaknesses,
        List<String> suggestions,
        List<String> securityConcerns,
        List<String> performanceConcerns,
        List<AiContextFile> contextFiles,
        long latencyMs
) {}

package com.collabcode.ai.dto;

import java.util.List;

public record AutocompleteResponse(
        List<String> suggestions,
        String provider,
        boolean fallback,
        long latencyMs
) {}

package com.collabcode.ai.model;

import com.collabcode.ai.dto.AiContextFile;
import com.collabcode.ai.dto.AiMessage;

import java.util.List;

public record AiGatewayRequest(
        AiFeature feature,
        String language,
        String path,
        String code,
        String selection,
        String instruction,
        List<AiContextFile> contextFiles,
        List<AiMessage> conversation
) {}

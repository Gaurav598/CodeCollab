package com.collabcode.ai.provider;

import com.collabcode.ai.model.AiGatewayRequest;

public interface AiProviderAdapter {
    String name();
    boolean available();
    String generate(AiGatewayRequest request);
}

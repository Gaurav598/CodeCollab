package com.collabcode.ai.provider;

import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class GeminiProviderAdapter extends AbstractHttpAiProviderAdapter {
    public GeminiProviderAdapter(RestTemplate restTemplate, AiProperties properties) {
        super(restTemplate, properties.getGemini());
    }

    @Override
    public String name() {
        return "gemini";
    }
}

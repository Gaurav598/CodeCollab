package com.collabcode.ai.provider;

import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class OpenAiProviderAdapter extends AbstractHttpAiProviderAdapter {
    public OpenAiProviderAdapter(RestTemplate restTemplate, AiProperties properties) {
        super(restTemplate, properties.getOpenai());
    }

    @Override
    public String name() {
        return "openai";
    }
}

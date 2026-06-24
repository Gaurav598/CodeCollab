package com.collabcode.ai.provider;

import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ClaudeProviderAdapter extends AbstractHttpAiProviderAdapter {
    public ClaudeProviderAdapter(RestTemplate restTemplate, AiProperties properties) {
        super(restTemplate, properties.getClaude());
    }

    @Override
    public String name() {
        return "claude";
    }
}

package com.collabcode.ai.provider;

import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class DeepSeekProviderAdapter extends AbstractHttpAiProviderAdapter {
    public DeepSeekProviderAdapter(RestTemplate restTemplate, AiProperties properties) {
        super(restTemplate, properties.getDeepseek());
    }

    @Override
    public String name() {
        return "deepseek";
    }
}

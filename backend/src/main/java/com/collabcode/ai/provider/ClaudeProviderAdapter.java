package com.collabcode.ai.provider;

import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import com.collabcode.ai.model.AiGatewayRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.List;
import java.util.Map;

@Component
public class ClaudeProviderAdapter extends AbstractHttpAiProviderAdapter {
    public ClaudeProviderAdapter(RestTemplate restTemplate, AiProperties properties) {
        super(restTemplate, properties.getClaude());
    }

    @Override
    public String name() {
        return "claude";
    }

    @Override
    public String generate(AiGatewayRequest request) {
        if (!available()) throw new IllegalStateException("claude is not configured");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", provider.getApiKey());
        headers.set("anthropic-version", "2023-06-01");
        Map<String, Object> body = Map.of(
                "model", modelName(),
                "max_tokens", 2048,
                "messages", List.of(Map.of("role", "user", "content", renderPrompt(request)))
        );
        try {
            @SuppressWarnings("rawtypes")
            Map response = restTemplate.postForObject(provider.getBaseUrl(), new HttpEntity<>(body, headers), Map.class);
            if (response != null && response.get("content") instanceof List<?> content) {
                for (Object item : content) {
                    if (item instanceof Map<?, ?> block && "text".equals(block.get("type")) && block.get("text") != null) {
                        return block.get("text").toString();
                    }
                }
            }
            return "";
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new IllegalStateException("claude request failed", ex);
        }
    }
}

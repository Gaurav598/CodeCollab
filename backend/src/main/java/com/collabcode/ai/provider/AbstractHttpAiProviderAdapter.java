package com.collabcode.ai.provider;

import com.collabcode.ai.model.AiGatewayRequest;
import com.collabcode.config.AiProperties;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

public abstract class AbstractHttpAiProviderAdapter implements AiProviderAdapter {

    protected final RestTemplate restTemplate;
    protected final AiProperties.Provider provider;

    protected AbstractHttpAiProviderAdapter(RestTemplate restTemplate, AiProperties.Provider provider) {
        this.restTemplate = restTemplate;
        this.provider = provider;
    }

    @Override
    public boolean available() {
        return provider.hasKey() && provider.getBaseUrl() != null && !provider.getBaseUrl().isBlank();
    }

    @Override
    @SuppressWarnings("unchecked")
    public String generate(AiGatewayRequest request) {
        if (!available()) {
            throw new IllegalStateException(name() + " is not configured");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(provider.getApiKey());
        Map<String, Object> body = Map.of(
                "model", modelName(),
                "messages", List.of(Map.of("role", "user", "content", renderPrompt(request))),
                "temperature", 0.2
        );
        try {
            @SuppressWarnings("rawtypes")
            Map response = restTemplate.postForObject(provider.getBaseUrl(), new HttpEntity<>(body, headers), Map.class);
            if (response == null) return "";
            // Extract choices[0].message.content from standard OpenAI-compatible response
            Object choicesObj = response.get("choices");
            if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
                Object choice = choices.get(0);
                if (choice instanceof Map<?, ?> choiceMap) {
                    Object messageObj = choiceMap.get("message");
                    if (messageObj instanceof Map<?, ?> messageMap) {
                        Object content = messageMap.get("content");
                        return content != null ? content.toString() : "";
                    }
                }
            }
            return "";
        } catch (RestClientException ex) {
            throw new IllegalStateException(name() + " request failed", ex);
        }
    }

    protected String modelName() {
        return provider.getModel() == null || provider.getModel().isBlank() ? "default" : provider.getModel();
    }

    protected String renderPrompt(AiGatewayRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are CollabCode AI. Feature: ").append(request.feature()).append('\n');
        prompt.append("Language: ").append(request.language()).append('\n');
        prompt.append("Path: ").append(request.path()).append("\n\n");
        if (request.instruction() != null && !request.instruction().isBlank()) {
            prompt.append("Instruction:\n").append(request.instruction()).append("\n\n");
        }
        if (request.selection() != null && !request.selection().isBlank()) {
            prompt.append("Selection:\n```").append(request.language()).append('\n').append(request.selection()).append("\n```\n\n");
        }
        prompt.append("Current file:\n```").append(request.language()).append('\n').append(request.code()).append("\n```\n");
        return prompt.toString();
    }
}

package com.collabcode.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "collabcode.ai")
public class AiProperties {

    private String defaultProvider = "local";
    private List<String> fallbackOrder = new ArrayList<>(List.of("gemini", "openai", "claude", "deepseek", "local"));
    private int timeoutMs = 12000;
    private int rateLimitPerMinute = 24;
    private int autocompleteRateLimitPerMinute = 90;
    private int maxPromptChars = 24000;
    private int maxContextFiles = 8;

    private Provider gemini = new Provider();
    private Provider openai = new Provider();
    private Provider claude = new Provider();
    private Provider deepseek = new Provider();

    public String getDefaultProvider() { return defaultProvider; }
    public void setDefaultProvider(String defaultProvider) { this.defaultProvider = defaultProvider; }

    public List<String> getFallbackOrder() { return fallbackOrder; }
    public void setFallbackOrder(List<String> fallbackOrder) { this.fallbackOrder = fallbackOrder; }

    public int getTimeoutMs() { return timeoutMs; }
    public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }

    public int getRateLimitPerMinute() { return rateLimitPerMinute; }
    public void setRateLimitPerMinute(int rateLimitPerMinute) { this.rateLimitPerMinute = rateLimitPerMinute; }

    public int getAutocompleteRateLimitPerMinute() { return autocompleteRateLimitPerMinute; }
    public void setAutocompleteRateLimitPerMinute(int autocompleteRateLimitPerMinute) {
        this.autocompleteRateLimitPerMinute = autocompleteRateLimitPerMinute;
    }

    public int getMaxPromptChars() { return maxPromptChars; }
    public void setMaxPromptChars(int maxPromptChars) { this.maxPromptChars = maxPromptChars; }

    public int getMaxContextFiles() { return maxContextFiles; }
    public void setMaxContextFiles(int maxContextFiles) { this.maxContextFiles = maxContextFiles; }

    public Provider getGemini() { return gemini; }
    public void setGemini(Provider gemini) { this.gemini = gemini; }

    public Provider getOpenai() { return openai; }
    public void setOpenai(Provider openai) { this.openai = openai; }

    public Provider getClaude() { return claude; }
    public void setClaude(Provider claude) { this.claude = claude; }

    public Provider getDeepseek() { return deepseek; }
    public void setDeepseek(Provider deepseek) { this.deepseek = deepseek; }

    public static class Provider {
        private String apiKey = "";
        private String model = "";
        private String baseUrl = "";

        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }

        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

        public boolean hasKey() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}

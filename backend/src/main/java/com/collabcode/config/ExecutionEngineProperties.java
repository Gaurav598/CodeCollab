package com.collabcode.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the remote AWS Execution Engine.
 *
 * Required environment variables:
 *   EXECUTION_ENGINE_URL     — base URL of the remote execution engine (e.g. https://exec.example.com)
 *   EXECUTION_ENGINE_API_KEY — API key for the remote engine (optional, leave blank if not required)
 */
@ConfigurationProperties(prefix = "collabcode.execution")
public class ExecutionEngineProperties {

    private String engineUrl = "";
    private String apiKey = "";
    private int defaultTimeoutMs = 5000;
    private int maxTimeoutMs = 10000;
    private int rateLimitPerMinute = 30;

    public String getEngineUrl() { return engineUrl; }
    public void setEngineUrl(String engineUrl) { this.engineUrl = engineUrl; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public int getDefaultTimeoutMs() { return defaultTimeoutMs; }
    public void setDefaultTimeoutMs(int defaultTimeoutMs) { this.defaultTimeoutMs = defaultTimeoutMs; }

    public int getMaxTimeoutMs() { return maxTimeoutMs; }
    public void setMaxTimeoutMs(int maxTimeoutMs) { this.maxTimeoutMs = maxTimeoutMs; }

    public int getRateLimitPerMinute() { return rateLimitPerMinute; }
    public void setRateLimitPerMinute(int rateLimitPerMinute) { this.rateLimitPerMinute = rateLimitPerMinute; }
}

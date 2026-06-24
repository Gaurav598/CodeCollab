package com.collabcode.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "collabcode.sandbox")
public class SandboxProperties {

    private String serviceUrl = "http://localhost:3001";
    private int defaultTimeoutMs = 5000;
    private int maxTimeoutMs = 10000;
    private int rateLimitPerMinute = 30;

    public String getServiceUrl() { return serviceUrl; }
    public void setServiceUrl(String serviceUrl) { this.serviceUrl = serviceUrl; }

    public int getDefaultTimeoutMs() { return defaultTimeoutMs; }
    public void setDefaultTimeoutMs(int defaultTimeoutMs) { this.defaultTimeoutMs = defaultTimeoutMs; }

    public int getMaxTimeoutMs() { return maxTimeoutMs; }
    public void setMaxTimeoutMs(int maxTimeoutMs) { this.maxTimeoutMs = maxTimeoutMs; }

    public int getRateLimitPerMinute() { return rateLimitPerMinute; }
    public void setRateLimitPerMinute(int rateLimitPerMinute) { this.rateLimitPerMinute = rateLimitPerMinute; }
}

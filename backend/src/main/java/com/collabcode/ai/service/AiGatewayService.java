package com.collabcode.ai.service;

import com.collabcode.ai.model.AiGatewayRequest;
import com.collabcode.ai.model.AiGatewayResult;
import com.collabcode.ai.provider.AiProviderAdapter;
import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import com.collabcode.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AiGatewayService {

    private static final Logger logger = LoggerFactory.getLogger(AiGatewayService.class);

    private final Map<String, AiProviderAdapter> adapters;
    private final AiProperties properties;

    public AiGatewayService(List<AiProviderAdapter> adapters, AiProperties properties) {
        this.adapters = adapters.stream().collect(Collectors.toMap(AiProviderAdapter::name, Function.identity()));
        this.properties = properties;
    }

    public AiGatewayResult generate(AiGatewayRequest request) {
        Instant started = Instant.now();
        for (String providerName : orderedProviderNames()) {
            if (Duration.between(started, Instant.now()).toMillis() >= properties.getTimeoutMs()) break;
            AiProviderAdapter adapter = adapters.get(providerName);
            if (adapter == null || !adapter.available()) {
                continue;
            }
            int attempts = 0;
            while (attempts < 2) {
                attempts++;
                try {
                    String text = adapter.generate(request);
                    if (text != null && !text.isBlank()) {
                        long latency = Duration.between(started, Instant.now()).toMillis();
                        return new AiGatewayResult(adapter.name(), "local".equals(adapter.name()), text, latency);
                    }
                    logger.warn("AI provider {} returned an empty response", adapter.name());
                    break;
                } catch (Exception failure) {
                    boolean retryable = retryable(failure);
                    logger.warn("AI provider {} failed (attempt {}, retryable={}): {}",
                            adapter.name(), attempts, retryable, failure.getClass().getSimpleName());
                    if (!retryable || attempts >= 2) break;
                    if (Duration.between(started, Instant.now()).toMillis() + 300 >= properties.getTimeoutMs()) break;
                    try {
                        Thread.sleep(150L * attempts);
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_PROVIDERS_UNAVAILABLE",
                "No configured AI provider completed the request. Try again later.");
    }

    private boolean retryable(Throwable failure) {
        Throwable current = failure;
        while (current != null) {
            if (current instanceof ResourceAccessException) return true;
            if (current instanceof HttpStatusCodeException status) {
                return status.getStatusCode().value() == 429 || status.getStatusCode().is5xxServerError();
            }
            current = current.getCause();
        }
        return false;
    }

    private List<String> orderedProviderNames() {
        List<String> configured = properties.getFallbackOrder();
        if (configured == null || configured.isEmpty()) {
            return adapters.keySet().stream().sorted(Comparator.naturalOrder()).toList();
        }
        // Defensive copy — do not mutate the list stored inside AiProperties
        List<String> ordered = new java.util.ArrayList<>(configured);
        if (!ordered.contains(properties.getDefaultProvider())) {
            ordered.add(0, properties.getDefaultProvider());
        }
        return ordered;
    }
}

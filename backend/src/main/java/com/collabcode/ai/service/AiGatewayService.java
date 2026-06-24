package com.collabcode.ai.service;

import com.collabcode.ai.model.AiGatewayRequest;
import com.collabcode.ai.model.AiGatewayResult;
import com.collabcode.ai.provider.AiProviderAdapter;
import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AiGatewayService {

    private final Map<String, AiProviderAdapter> adapters;
    private final AiProperties properties;

    public AiGatewayService(List<AiProviderAdapter> adapters, AiProperties properties) {
        this.adapters = adapters.stream().collect(Collectors.toMap(AiProviderAdapter::name, Function.identity()));
        this.properties = properties;
    }

    public AiGatewayResult generate(AiGatewayRequest request) {
        Instant started = Instant.now();
        for (String providerName : orderedProviderNames()) {
            AiProviderAdapter adapter = adapters.get(providerName);
            if (adapter == null || !adapter.available()) {
                continue;
            }
            try {
                String text = CompletableFuture
                        .supplyAsync(() -> adapter.generate(request))
                        .get(properties.getTimeoutMs(), TimeUnit.MILLISECONDS);
                if (text != null && !text.isBlank()) {
                    long latency = Duration.between(started, Instant.now()).toMillis();
                    return new AiGatewayResult(adapter.name(), "local".equals(adapter.name()), text, latency);
                }
            } catch (Exception ignored) {
                // Try the next configured provider. AI must not block core collaboration.
            }
        }
        AiProviderAdapter local = adapters.get("local");
        String text = local.generate(request);
        long latency = Duration.between(started, Instant.now()).toMillis();
        return new AiGatewayResult("local", true, text, latency);
    }

    private List<String> orderedProviderNames() {
        List<String> configured = properties.getFallbackOrder();
        if (configured == null || configured.isEmpty()) {
            return adapters.keySet().stream().sorted(Comparator.naturalOrder()).toList();
        }
        if (!configured.contains(properties.getDefaultProvider())) {
            configured.add(0, properties.getDefaultProvider());
        }
        return configured;
    }
}

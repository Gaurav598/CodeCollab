package com.collabcode.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder, AiProperties ai, ExecutionEngineProperties execution) {
        int readTimeoutMs = Math.max(ai.getTimeoutMs(), execution.getMaxTimeoutMs() + 2000);
        return builder
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }
}

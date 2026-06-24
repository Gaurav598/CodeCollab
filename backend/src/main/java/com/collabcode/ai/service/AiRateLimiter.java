package com.collabcode.ai.service;

import com.collabcode.ai.model.AiFeature;
import com.collabcode.common.exception.ApiException;
import com.collabcode.config.AiProperties;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class AiRateLimiter {

    private static final String KEY_PREFIX = "ai:rate:";

    private final StringRedisTemplate redis;
    private final AiProperties properties;

    public AiRateLimiter(StringRedisTemplate redis, AiProperties properties) {
        this.redis = redis;
        this.properties = properties;
    }

    public void checkLimit(UUID userId, AiFeature feature) {
        int limit = feature == AiFeature.AUTOCOMPLETE
                ? properties.getAutocompleteRateLimitPerMinute()
                : properties.getRateLimitPerMinute();
        String key = KEY_PREFIX + feature.name().toLowerCase() + ":" + userId;
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, Duration.ofMinutes(1));
            }
            if (count != null && count > limit) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI_RATE_LIMIT_EXCEEDED", "AI rate limit exceeded. Try again later.");
            }
        } catch (RedisConnectionFailureException ex) {
            // AI should degrade gracefully if Redis is unavailable during local development.
        }
    }
}

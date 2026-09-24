package com.collabcode.ai.service;

import com.collabcode.ai.model.AiFeature;
import com.collabcode.common.exception.ApiException;
import com.collabcode.config.AiProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

@Service
public class AiRateLimiter {

    private static final String KEY_PREFIX = "ai:rate:";

    private final StringRedisTemplate redis;
    private final AiProperties properties;
    private final ConcurrentHashMap<String, LocalWindow> fallbackWindows = new ConcurrentHashMap<>();

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
        } catch (ApiException ex) {
            throw ex;
        } catch (org.springframework.dao.DataAccessException ex) {
            checkLocalLimit(key, limit);
        }
    }

    private void checkLocalLimit(String key, int limit) {
        long minute = Instant.now().getEpochSecond() / 60;
        LocalWindow window = fallbackWindows.compute(key, (ignored, existing) -> {
            if (existing == null || existing.minute != minute) return new LocalWindow(minute, 1);
            existing.count++;
            return existing;
        });
        if (window.count > limit) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI_RATE_LIMIT_EXCEEDED",
                    "AI rate limit exceeded. Try again later.");
        }
        if (fallbackWindows.size() > 10_000) {
            fallbackWindows.entrySet().removeIf(entry -> entry.getValue().minute < minute - 1);
        }
    }

    private static final class LocalWindow {
        private final long minute;
        private int count;

        private LocalWindow(long minute, int count) {
            this.minute = minute;
            this.count = count;
        }
    }
}

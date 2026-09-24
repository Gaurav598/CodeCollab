package com.collabcode.execution.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.config.ExecutionEngineProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

@Service
public class ExecutionRateLimiter {

    private static final String KEY_PREFIX = "execution:rate:";

    private final StringRedisTemplate redis;
    private final ExecutionEngineProperties properties;
    private final ConcurrentHashMap<String, LocalWindow> fallbackWindows = new ConcurrentHashMap<>();

    public ExecutionRateLimiter(StringRedisTemplate redis, ExecutionEngineProperties properties) {
        this.redis = redis;
        this.properties = properties;
    }

    public void checkLimit(UUID userId, UUID roomId) {
        checkRedisLimit(KEY_PREFIX + "user:" + userId, properties.getRateLimitPerMinute());
        checkRedisLimit(KEY_PREFIX + "room:" + roomId, properties.getRateLimitPerMinute() * 5);
    }

    private void checkRedisLimit(String key, int limit) {
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, Duration.ofMinutes(1));
            }
            if (count != null && count > limit) {
                throw new ApiException(
                        org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                        "RATE_LIMIT_EXCEEDED",
                        "Execution rate limit exceeded. Try again later."
                );
            }
        } catch (ApiException ex) {
            throw ex; // re-throw rate-limit exceptions
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
            throw new ApiException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                    "RATE_LIMIT_EXCEEDED", "Execution rate limit exceeded. Try again later.");
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

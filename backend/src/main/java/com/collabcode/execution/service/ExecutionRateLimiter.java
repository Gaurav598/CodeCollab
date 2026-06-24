package com.collabcode.execution.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.config.SandboxProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class ExecutionRateLimiter {

    private static final String KEY_PREFIX = "execution:rate:";

    private final StringRedisTemplate redis;
    private final SandboxProperties properties;

    public ExecutionRateLimiter(StringRedisTemplate redis, SandboxProperties properties) {
        this.redis = redis;
        this.properties = properties;
    }

    public void checkLimit(UUID userId) {
        String key = KEY_PREFIX + userId;
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, Duration.ofMinutes(1));
        }
        if (count != null && count > properties.getRateLimitPerMinute()) {
            throw new ApiException(
                    org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                    "RATE_LIMIT_EXCEEDED",
                    "Execution rate limit exceeded. Try again later."
            );
        }
    }
}

package com.collabcode;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health endpoint — lives outside /api/v1 via the server.servlet.context-path.
 * Accessible at GET /health (i.e. http://localhost:8080/health bypassed the context path
 * because the context-path applies to all servlets, so actual path is /api/v1/health).
 * Permitted without auth in SecurityConfig.
 */
@RestController
public class HealthController {

    private final MongoDatabaseFactory mongoDatabaseFactory;
    private final RedisConnectionFactory redisConnectionFactory;

    public HealthController(MongoDatabaseFactory mongoDatabaseFactory,
                            RedisConnectionFactory redisConnectionFactory) {
        this.mongoDatabaseFactory = mongoDatabaseFactory;
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> checks = new LinkedHashMap<>();
        boolean databaseUp = checkMongo();
        boolean redisUp = checkRedis();

        checks.put("service", "backend");
        checks.put("status", databaseUp && redisUp ? "UP" : "DOWN");
        checks.put("mongodb", databaseUp ? "UP" : "DOWN");
        checks.put("redis", redisUp ? "UP" : "DOWN");
        checks.put("timestamp", Instant.now().toString());

        return ResponseEntity
                .status(databaseUp && redisUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .body(checks);
    }

    private boolean checkMongo() {
        try {
            mongoDatabaseFactory.getMongoDatabase().runCommand(new org.bson.Document("ping", 1));
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean checkRedis() {
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            return "PONG".equalsIgnoreCase(connection.ping());
        } catch (Exception ignored) {
            return false;
        }
    }
}

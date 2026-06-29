package com.collabcode.execution.service;

import com.collabcode.config.ExecutionEngineProperties;
import com.collabcode.execution.dto.SandboxExecuteResult;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client for the remote AWS Execution Engine.
 *
 * Communicates via REST API: POST /execute
 * Auth: Bearer token via EXECUTION_ENGINE_API_KEY (optional — omitted if blank).
 *
 * Expected request body:
 *   { "language": "...", "sourceCode": "...", "stdin": "...", "timeoutMs": 5000 }
 *
 * Expected response body:
 *   { "stdout": "...", "stderr": "...", "exitCode": 0, "executionTimeMs": 123, "timedOut": false, "error": null }
 */
@Service
public class ExecutionEngineClient {

    private final RestTemplate restTemplate;
    private final ExecutionEngineProperties executionEngineProperties;

    public ExecutionEngineClient(RestTemplate restTemplate,
                                 ExecutionEngineProperties executionEngineProperties) {
        this.restTemplate = restTemplate;
        this.executionEngineProperties = executionEngineProperties;
    }

    public SandboxExecuteResult execute(String language, String sourceCode, String stdin, int timeoutMs) {
        String url = executionEngineProperties.getEngineUrl() + "/execute";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String apiKey = executionEngineProperties.getApiKey();
        if (apiKey != null && !apiKey.isBlank()) {
            headers.setBearerAuth(apiKey);
        }

        Map<String, Object> body = Map.of(
                "language", language,
                "sourceCode", sourceCode,
                "stdin", stdin != null ? stdin : "",
                "timeoutMs", timeoutMs
        );

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    url,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            if (response.getBody() == null) {
                return errorResult("Empty response from execution engine");
            }
            return SandboxExecuteResult.fromMap(response.getBody());
        } catch (RestClientException ex) {
            return errorResult("Execution engine unavailable: " + ex.getMessage());
        }
    }

    private SandboxExecuteResult errorResult(String message) {
        return new SandboxExecuteResult("", message, 1, 0, false, "ENGINE_UNAVAILABLE");
    }
}

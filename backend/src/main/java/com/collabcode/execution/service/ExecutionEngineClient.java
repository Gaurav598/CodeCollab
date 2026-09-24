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
        if (executionEngineProperties.getEngineUrl() == null || executionEngineProperties.getEngineUrl().isBlank()) {
            return errorResult("Execution engine is not configured");
        }
        String url = executionEngineProperties.getEngineUrl() + "/execute";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String apiKey = executionEngineProperties.getApiKey();
        if (apiKey != null && !apiKey.isBlank()) {
            headers.setBearerAuth(apiKey);
        }

        int safeTimeout = Math.min(Math.max(timeoutMs, 250), executionEngineProperties.getMaxTimeoutMs());
        Map<String, Object> body = Map.of(
                "language", language,
                "version", "*",
                "files", java.util.List.of(Map.of("content", sourceCode)),
                "stdin", stdin != null ? stdin : "",
                "run_timeout", safeTimeout,
                "compile_timeout", safeTimeout
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

            Map<String, Object> respBody = response.getBody();
            if (respBody.containsKey("message")) {
                 return errorResult("Engine Error: " + respBody.get("message"));
            }

            // Native CollabCode execution-engine contract.
            if (respBody.containsKey("stdout") || respBody.containsKey("timedOut")) {
                String stdout = stringValue(respBody.get("stdout"));
                String stderr = stringValue(respBody.get("stderr"));
                int exitCode = respBody.get("exitCode") instanceof Number number ? number.intValue() : 1;
                long executionTime = respBody.get("executionTimeMs") instanceof Number number ? number.longValue() : 0L;
                boolean timedOut = Boolean.TRUE.equals(respBody.get("timedOut"));
                String error = respBody.get("error") == null ? null : respBody.get("error").toString();
                return new SandboxExecuteResult(stdout, stderr, exitCode, executionTime, timedOut, error);
            }

            String stdout = "";
            String stderr = "";
            int exitCode = 0;

            if (respBody.containsKey("compile")) {
                Map<String, Object> compile = (Map<String, Object>) respBody.get("compile");
                if (compile.get("code") instanceof Number n && n.intValue() != 0) {
                    Object out = compile.get("output");
                    return new SandboxExecuteResult("", out != null ? out.toString() : "", n.intValue(), 0, false, null);
                }
            }

            boolean timedOut = false;
            if (respBody.containsKey("run")) {
                Map<String, Object> run = (Map<String, Object>) respBody.get("run");
                Object outObj = run.get("stdout");
                stdout = outObj != null ? outObj.toString() : "";
                
                Object errObj = run.get("stderr");
                stderr = errObj != null ? errObj.toString() : "";
                
                if (run.get("code") instanceof Number n) {
                    exitCode = n.intValue();
                } else if (run.get("signal") != null) {
                    exitCode = 1;
                    stderr += "\nTerminated by signal: " + run.get("signal");
                    timedOut = "SIGKILL".equalsIgnoreCase(run.get("signal").toString());
                }
            }

            return new SandboxExecuteResult(stdout, stderr, exitCode, 0, timedOut,
                    timedOut ? "EXECUTION_TIMEOUT" : null);
        } catch (RestClientException ex) {
            return errorResult("Execution engine unavailable: " + ex.getMessage());
        }
    }

    private SandboxExecuteResult errorResult(String message) {
        return new SandboxExecuteResult("", message, 1, 0, false, "ENGINE_UNAVAILABLE");
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }
}

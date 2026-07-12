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

        int safeTimeout = Math.min(timeoutMs, 3000);
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
                }
            }

            return new SandboxExecuteResult(stdout, stderr, exitCode, 0, false, null);
        } catch (RestClientException ex) {
            return errorResult("Execution engine unavailable: " + ex.getMessage());
        }
    }

    private SandboxExecuteResult errorResult(String message) {
        return new SandboxExecuteResult("", message, 1, 0, false, "ENGINE_UNAVAILABLE");
    }
}

package com.collabcode.execution.service;

import com.collabcode.config.SandboxProperties;
import com.collabcode.config.SecurityProperties;
import com.collabcode.execution.dto.SandboxExecuteResult;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class SandboxClient {

    private final RestTemplate restTemplate;
    private final SandboxProperties sandboxProperties;
    private final SecurityProperties securityProperties;

    public SandboxClient(RestTemplate restTemplate,
                         SandboxProperties sandboxProperties,
                         SecurityProperties securityProperties) {
        this.restTemplate = restTemplate;
        this.sandboxProperties = sandboxProperties;
        this.securityProperties = securityProperties;
    }

    public SandboxExecuteResult execute(String language, String sourceCode, String stdin, int timeoutMs) {
        String url = sandboxProperties.getServiceUrl() + "/execute";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(securityProperties.getServiceJwtSecret());

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
                return errorResult("Empty response from sandbox service");
            }
            return SandboxExecuteResult.fromMap(response.getBody());
        } catch (RestClientException ex) {
            return errorResult("Sandbox service unavailable");
        }
    }

    private SandboxExecuteResult errorResult(String message) {
        return new SandboxExecuteResult("", message, 1, 0, false, "SANDBOX_UNAVAILABLE");
    }
}

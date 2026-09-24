package com.collabcode.ai.service;

import com.collabcode.ai.dto.AiRequest;
import com.collabcode.ai.dto.AiResponse;
import com.collabcode.ai.dto.AutocompleteResponse;
import com.collabcode.ai.model.AiFeature;
import com.collabcode.ai.model.AiGatewayRequest;
import com.collabcode.ai.model.AiGatewayResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.collabcode.config.AiProperties;
import com.collabcode.ai.dto.AiMessage;

@Service
public class AiFeatureService {

    private static final Pattern FINDING = Pattern.compile("\\[(HIGH|MEDIUM|LOW|INFO)]\\s*(.*)", Pattern.CASE_INSENSITIVE);

    private final AiContextService contextService;
    private final AiGatewayService gatewayService;
    private final AiRateLimiter rateLimiter;
    private final AiPromptSanitizer sanitizer;
    private final AiProperties properties;

    public AiFeatureService(AiContextService contextService, AiGatewayService gatewayService,
                            AiRateLimiter rateLimiter, AiPromptSanitizer sanitizer, AiProperties properties) {
        this.contextService = contextService;
        this.gatewayService = gatewayService;
        this.rateLimiter = rateLimiter;
        this.sanitizer = sanitizer;
        this.properties = properties;
    }

    public AutocompleteResponse autocomplete(AiRequest request, UUID userId) {
        AiGatewayResult result = run(AiFeature.AUTOCOMPLETE, request, userId);
        return new AutocompleteResponse(List.of(result.text()), result.provider(), result.fallback(), result.latencyMs());
    }

    public AiResponse runFeature(AiFeature feature, AiRequest request, UUID userId) {
        AiGatewayResult result = run(feature, request, userId);
        var context = contextService.load(request, userId, feature);
        String text = result.text();
        return switch (feature) {
            case BUG_DETECTION -> base(feature, result, context).findings(parseFindings(text)).content(text).build();
            case REVIEW -> base(feature, result, context)
                    .strengths(section(text, "Strengths"))
                    .weaknesses(section(text, "Weaknesses"))
                    .suggestions(section(text, "Suggestions"))
                    .securityConcerns(section(text, "Security concerns"))
                    .performanceConcerns(section(text, "Performance concerns"))
                    .content(text)
                    .build();
            case REFACTOR -> base(feature, result, context).previewCode(extractCodeFence(text)).content(text).build();
            default -> base(feature, result, context).content(text).build();
        };
    }

    private AiGatewayResult run(AiFeature feature, AiRequest request, UUID userId) {
        rateLimiter.checkLimit(userId, feature);
        var context = contextService.load(request, userId, feature);
        AiGatewayRequest gatewayRequest = new AiGatewayRequest(
                feature,
                context.language(),
                context.path(),
                context.code(),
                context.selection(),
                context.instruction(),
                context.contextFiles(),
                sanitizeConversation(request.conversation(), context)
        );
        return gatewayService.generate(gatewayRequest);
    }

    private List<AiMessage> sanitizeConversation(List<AiMessage> conversation,
                                                 AiContextService.ContextEnvelope context) {
        if (conversation == null || conversation.isEmpty()) return List.of();
        int used = context.language().length() + context.path().length() + context.code().length()
                + context.selection().length() + context.instruction().length()
                + context.contextFiles().stream().mapToInt(file -> file.content().length()).sum();
        int remaining = Math.max(0, properties.getMaxPromptChars() - used);
        List<AiMessage> safe = new ArrayList<>();
        int start = Math.max(0, conversation.size() - 12);
        for (int index = start; index < conversation.size() && remaining > 0; index++) {
            AiMessage message = conversation.get(index);
            if (message == null || !("user".equals(message.role()) || "assistant".equals(message.role()))) continue;
            String content = sanitizer.sanitize(message.content());
            if (content.length() > remaining) content = content.substring(0, remaining) + "\n[TRUNCATED]";
            safe.add(new AiMessage(message.role(), content));
            remaining -= Math.min(remaining, content.length());
        }
        return safe;
    }

    private Builder base(AiFeature feature, AiGatewayResult result, AiContextService.ContextEnvelope context) {
        return new Builder(feature.name(), result.provider(), result.fallback(), result.latencyMs(), context.contextFiles());
    }

    private List<Map<String, String>> parseFindings(String text) {
        List<Map<String, String>> findings = new ArrayList<>();
        for (String line : text.split("\\R")) {
            Matcher matcher = FINDING.matcher(line.trim());
            if (matcher.matches()) {
                findings.add(Map.of("severity", matcher.group(1).toUpperCase(), "message", matcher.group(2)));
            }
        }
        return findings;
    }

    private List<String> section(String text, String heading) {
        List<String> values = new ArrayList<>();
        boolean inSection = false;
        for (String rawLine : text.split("\\R")) {
            String line = rawLine.trim();
            if (line.equalsIgnoreCase(heading + ":")) {
                inSection = true;
                continue;
            }
            if (inSection && line.endsWith(":")) break;
            if (inSection && line.startsWith("- ")) values.add(line.substring(2));
        }
        return values;
    }

    private String extractCodeFence(String text) {
        int start = text.indexOf("```");
        if (start < 0) return "";
        int lineEnd = text.indexOf('\n', start);
        int end = text.indexOf("```", lineEnd + 1);
        if (lineEnd < 0 || end < 0) return "";
        return text.substring(lineEnd + 1, end).strip();
    }

    private static class Builder {
        private final String feature;
        private final String provider;
        private final boolean fallback;
        private final long latencyMs;
        private final List<com.collabcode.ai.dto.AiContextFile> contextFiles;
        private String content = "";
        private String previewCode = "";
        private List<Map<String, String>> findings = List.of();
        private List<String> strengths = List.of();
        private List<String> weaknesses = List.of();
        private List<String> suggestions = List.of();
        private List<String> securityConcerns = List.of();
        private List<String> performanceConcerns = List.of();

        Builder(String feature, String provider, boolean fallback, long latencyMs, List<com.collabcode.ai.dto.AiContextFile> contextFiles) {
            this.feature = feature;
            this.provider = provider;
            this.fallback = fallback;
            this.latencyMs = latencyMs;
            this.contextFiles = contextFiles;
        }

        Builder content(String content) { this.content = content; return this; }
        Builder previewCode(String previewCode) { this.previewCode = previewCode; return this; }
        Builder findings(List<Map<String, String>> findings) { this.findings = findings; return this; }
        Builder strengths(List<String> strengths) { this.strengths = strengths; return this; }
        Builder weaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; return this; }
        Builder suggestions(List<String> suggestions) { this.suggestions = suggestions; return this; }
        Builder securityConcerns(List<String> securityConcerns) { this.securityConcerns = securityConcerns; return this; }
        Builder performanceConcerns(List<String> performanceConcerns) { this.performanceConcerns = performanceConcerns; return this; }

        AiResponse build() {
            return new AiResponse(feature, provider, fallback, content, previewCode, findings, strengths, weaknesses,
                    suggestions, securityConcerns, performanceConcerns, contextFiles, latencyMs);
        }
    }
}

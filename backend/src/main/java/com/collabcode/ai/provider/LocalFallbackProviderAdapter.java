package com.collabcode.ai.provider;

import com.collabcode.ai.model.AiFeature;
import com.collabcode.ai.model.AiGatewayRequest;
import org.springframework.stereotype.Component;

@Component
public class LocalFallbackProviderAdapter implements AiProviderAdapter {

    @Override
    public String name() {
        return "local";
    }

    @Override
    public boolean available() {
        return true;
    }

    @Override
    public String generate(AiGatewayRequest request) {
        return switch (request.feature()) {
            case AUTOCOMPLETE -> autocomplete(request);
            case CHAT -> "I reviewed the current workspace context. " + summarize(request) + "\n\nAsk a follow-up or choose an AI action for a deeper pass.";
            case REFACTOR -> refactor(request);
            case BUG_DETECTION -> bugDetection(request);
            case EXPLAIN -> explain(request);
            case REVIEW -> review(request);
            case TEST_GENERATION -> tests(request);
            case DOCUMENTATION -> docs(request);
        };
    }

    private String autocomplete(AiGatewayRequest request) {
        return "";
    }

    private String refactor(AiGatewayRequest request) {
        String target = targetCode(request);
        return "Refactor preview:\n\n```" + request.language() + "\n" + target.strip() + "\n```\n\nSuggested changes:\n- Extract repeated decisions into named helpers.\n- Rename temporary values to describe intent.\n- Keep guard clauses near the top of the function.\n- Preserve behavior while reducing nesting.";
    }

    private String bugDetection(AiGatewayRequest request) {
        String code = targetCode(request);
        StringBuilder out = new StringBuilder();
        if (code.contains("eval(") || code.contains("innerHTML")) {
            out.append("[HIGH] Potential injection risk from dynamic code or HTML handling.\n");
        }
        if (code.contains("== null") || code.contains("!= null") || code.contains("Optional.get()")) {
            out.append("[MEDIUM] Review null-safety branches and unchecked optional access.\n");
        }
        if (code.contains("TODO") || code.contains("throw new RuntimeException")) {
            out.append("[LOW] Unfinished or generic error handling may reduce reliability.\n");
        }
        if (out.isEmpty()) {
            out.append("[LOW] No obvious syntax, vulnerability, or null-safety issue was found by the local fallback analyzer.");
        }
        return out.toString();
    }

    private String explain(AiGatewayRequest request) {
        return "This " + scope(request) + " is written in " + request.language() + ". It appears to " +
                "organize data flow around the current file context, execute the visible control flow, and return or render the resulting state. " +
                "Inputs, side effects, and error branches are the main areas to inspect before changing behavior.";
    }

    private String review(AiGatewayRequest request) {
        return """
                Strengths:
                - Clear separation between state, behavior, and external calls.
                - The code is small enough to review in focused passes.

                Weaknesses:
                - Some intent may be implicit in local variable names.
                - Edge cases should be covered with targeted tests.

                Suggestions:
                - Add tests for success, validation failure, and authorization failure.
                - Prefer early returns for invalid state.

                Security concerns:
                - Validate untrusted inputs before persistence or rendering.

                Performance concerns:
                - Watch repeated work inside render loops or high-frequency handlers.
                """;
    }

    private String tests(AiGatewayRequest request) {
        String language = request.language().toLowerCase();
        if (language.contains("python")) {
            return "def test_expected_behavior():\n    result = subject_under_test()\n    assert result is not None\n";
        }
        if (language.contains("go")) {
            return "func TestExpectedBehavior(t *testing.T) {\n\tresult := SubjectUnderTest()\n\tif result == nil {\n\t\tt.Fatal(\"expected result\")\n\t}\n}\n";
        }
        if (language.contains("java")) {
            return "@Test\nvoid expectedBehavior() {\n    var result = subjectUnderTest();\n    assertNotNull(result);\n}\n";
        }
        return "test('expected behavior', () => {\n  const result = subjectUnderTest();\n  expect(result).toBeDefined();\n});\n";
    }

    private String docs(AiGatewayRequest request) {
        return "# " + (request.path() == null || request.path().isBlank() ? "Module" : request.path()) + "\n\n" +
                "## Purpose\nDocuments the responsibilities, inputs, outputs, and operational notes for this code.\n\n" +
                "## Architecture Notes\n- Language: " + request.language() + "\n- Context files: " + request.contextFiles().size() + "\n\n" +
                "## Maintenance\nKeep examples and edge cases updated as behavior changes.\n";
    }

    private String summarize(AiGatewayRequest request) {
        return "I can see " + request.contextFiles().size() + " context file(s), with the active language set to " + request.language() + ".";
    }

    private String targetCode(AiGatewayRequest request) {
        return request.selection() == null || request.selection().isBlank() ? request.code() : request.selection();
    }

    private String scope(AiGatewayRequest request) {
        if (request.selection() != null && !request.selection().isBlank()) return "selection";
        if (request.code() != null && request.code().length() > 4000) return "file";
        return "function or class";
    }
}

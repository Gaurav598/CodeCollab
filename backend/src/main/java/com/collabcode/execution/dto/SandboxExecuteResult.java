package com.collabcode.execution.dto;

import java.util.Map;

public record SandboxExecuteResult(
        String stdout,
        String stderr,
        int exitCode,
        long executionTimeMs,
        boolean timedOut,
        String error
) {
    @SuppressWarnings("unchecked")
    public static SandboxExecuteResult fromMap(Map<String, Object> body) {
        return new SandboxExecuteResult(
                stringVal(body.get("stdout")),
                stringVal(body.get("stderr")),
                intVal(body.get("exitCode")),
                longVal(body.get("executionTimeMs")),
                boolVal(body.get("timedOut")),
                body.get("error") != null ? body.get("error").toString() : null
        );
    }

    private static String stringVal(Object v) {
        return v == null ? "" : v.toString();
    }

    private static int intVal(Object v) {
        if (v instanceof Number n) return n.intValue();
        return 1;
    }

    private static long longVal(Object v) {
        if (v instanceof Number n) return n.longValue();
        return 0L;
    }

    private static boolean boolVal(Object v) {
        if (v instanceof Boolean b) return b;
        return false;
    }
}

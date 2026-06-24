package com.collabcode.ai.model;

public enum AiFeature {
    AUTOCOMPLETE(false),
    CHAT(false),
    REFACTOR(true),
    BUG_DETECTION(false),
    EXPLAIN(false),
    REVIEW(false),
    TEST_GENERATION(false),
    DOCUMENTATION(false);

    private final boolean writeIntent;

    AiFeature(boolean writeIntent) {
        this.writeIntent = writeIntent;
    }

    public boolean isWriteIntent() {
        return writeIntent;
    }
}

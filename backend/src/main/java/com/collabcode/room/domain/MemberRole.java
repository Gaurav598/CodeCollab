package com.collabcode.room.domain;

public enum MemberRole {
    owner,
    editor,
    viewer;

    public boolean canEdit() {
        return this == owner || this == editor;
    }

    public boolean isOwner() {
        return this == owner;
    }
}

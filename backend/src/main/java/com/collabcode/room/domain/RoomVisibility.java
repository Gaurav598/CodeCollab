package com.collabcode.room.domain;

public enum RoomVisibility {
    public_room,
    private_room;

    /** Maps to the DB enum values 'public' and 'private'. */
    public static RoomVisibility fromString(String value) {
        return switch (value) {
            case "public" -> public_room;
            case "private" -> private_room;
            default -> throw new IllegalArgumentException("Unknown visibility: " + value);
        };
    }

    public String toDbValue() {
        return this == public_room ? "public" : "private";
    }
}

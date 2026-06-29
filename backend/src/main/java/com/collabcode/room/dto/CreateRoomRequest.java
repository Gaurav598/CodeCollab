package com.collabcode.room.dto;

public record CreateRoomRequest(
    String name
) {
    // name is optional — room code serves as the identifier
    public CreateRoomRequest() {
        this(null);
    }
}

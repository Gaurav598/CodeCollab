package com.collabcode.room.dto;

public record PatchFileRequest(
    String path,
    String language
) {}

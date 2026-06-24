package com.collabcode.common.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Serializes all exceptions into the standard error envelope:
 * { "error": { "code": "...", "message": "...", "details": {} } }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex) {
        return buildResponse(ex.getStatus(), ex.getCode(), ex.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        fe -> fe.getField(),
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid",
                        (a, b) -> a));
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Validation failed", fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraint(ConstraintViolationException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage(), null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", null);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status, String code, String message, Object details) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", code);
        error.put("message", message);
        error.put("details", details != null ? details : Map.of());
        return ResponseEntity.status(status).body(Map.of("error", error));
    }
}

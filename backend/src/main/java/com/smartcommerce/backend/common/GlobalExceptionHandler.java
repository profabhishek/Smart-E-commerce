package com.smartcommerce.backend.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<?> handleSec(SecurityException e) {
        return ResponseEntity.status(401).body(e.getMessage());
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBad(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRun(RuntimeException e) {
        return ResponseEntity.status(500).body(e.getMessage());
    }
}

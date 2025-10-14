package org.example.learniversebe.exception;

import org.example.learniversebe.model.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ApiResponse<?> response = new ApiResponse<>(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                null,
                "NOT_FOUND"
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<?>> handleBadRequestException(BadRequestException ex) {
        ApiResponse<?> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                null,
                "BAD_REQUEST"
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((first, second) -> first + ", " + second)
                .orElse("Validation error");

        ApiResponse <?> apiResponse = new ApiResponse<>(
                HttpStatus.BAD_REQUEST,
                errorMessage,
                null,
                "VALIDATION_ERROR"
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(apiResponse);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleUnauthorized(BadCredentialsException ex) {
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                null,
                "UNAUTHORIZED"
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(apiResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred: " + ex.getMessage(),
                null,
                "INTERNAL_SERVER_ERROR"
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(apiResponse);
    }
}
package org.example.learniversebe.exception;

import org.example.learniversebe.model.ApiResponse;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<?>> handleUnauthorizedException(UnauthorizedException ex) {
        ApiResponse<?> response = new ApiResponse<>(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                null,
                "UNAUTHORIZED"
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ApiResponse<?>> handleEmailNotVerifiedException(EmailNotVerifiedException ex) {
        ApiResponse<?> response = new ApiResponse<>(
                HttpStatus.FORBIDDEN,
                ex.getMessage(),
                null,
                "EMAIL_NOT_VERIFIED"
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(InvalidVerificationCodeException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidVerificationCodeException(InvalidVerificationCodeException ex) {
        ApiResponse<?> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                null,
                "INVALID_VERIFICATION_CODE"
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleUserNotFoundException(UserNotFoundException ex) {
        ApiResponse<?> response = new ApiResponse<>(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                null,
                "USER_NOT_FOUND"
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ApiResponse<?> response = new ApiResponse<>(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                null,
                "RESOURCE_NOT_FOUND"
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
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .reduce((first, second) -> first + ". " + second)
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
    public ResponseEntity<ApiResponse<?>> handleBadCredentialsException(BadCredentialsException ex) {
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                null,
                "BAD_CREDENTIALS"
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(apiResponse);
    }

    @ExceptionHandler(UserAlreadyExistException.class)
    public ResponseEntity<ApiResponse<?>> handleEmailAlreadyInUseException(UserAlreadyExistException ex) {
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.CONFLICT,
                ex.getMessage(),
                null,
                "USER_ALREADY_EXISTS"
        );

        return ResponseEntity.status(HttpStatus.CONFLICT)
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
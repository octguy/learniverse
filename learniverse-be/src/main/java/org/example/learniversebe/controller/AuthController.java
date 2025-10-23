package org.example.learniversebe.controller;

import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.*;
import org.example.learniversebe.dto.response.AuthResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/v1/auth")
@RestController
@CrossOrigin(origins = "*")
public class AuthController {

    private final IAuthService authService;

    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody @Valid RegisterRequest registerRequest) {
        AuthResponse authResponse = authService.register(registerRequest);

        ApiResponse<AuthResponse> apiResponse = new ApiResponse<>(
                HttpStatus.CREATED,
                "User registered successfully",
                authResponse,
                null
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);

        ApiResponse<AuthResponse> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "User logged in successfully",
                authResponse,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyUser(@RequestBody @Valid VerifyUserRequest request) {
        authService.verifyUser(request);

        ApiResponse<String> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "User verified successfully",
                "User verified successfully",
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<String>> resendVerificationCode(@RequestParam String email) {
        authService.resendVerificationCode(email);

        ApiResponse<String> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Verification code resent successfully",
                "Verification code resent successfully",
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody @Valid RefreshTokenRequest refreshTokenRequest) {
        AuthResponse authResponse = authService.refreshToken(refreshTokenRequest);

        ApiResponse<AuthResponse> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Token refreshed successfully",
                authResponse,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgetPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);

        ApiResponse<String> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Password reset link sent successfully",
                "Password reset link sent successfully",
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);

        ApiResponse<String> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Password reset successfully",
                "Password reset successfully",
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        authService.logout();

        ApiResponse<String> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "User logged out successfully",
                "User logged out successfully",
                null
        );

        return ResponseEntity.ok(apiResponse);
    }
}

package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Authentication", description = "Endpoints for user authentication and registration")
public class AuthController {

    private final IAuthService authService;

    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Login a user", description = "Authenticate a user and send email verification")
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

    @Operation(summary = "Register an admin", description = "Authenticate a user and send email verification")
    @PostMapping("/register-admin")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(@RequestBody @Valid RegisterRequest registerRequest) {
        AuthResponse authResponse = authService.createAdmin(registerRequest);

        ApiResponse<AuthResponse> apiResponse = new ApiResponse<>(
                HttpStatus.CREATED,
                "Admin registered successfully",
                authResponse,
                null
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @Operation(summary = "Login a user", description = "Authenticate a user and return auth tokens")
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

    @Operation(summary = "Verify user account", description = "Verify a user's account using a verification code sent via email")
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

    @Operation(summary = "Resend verification code", description = "Resend the verification code to the user's email")
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

    @Operation(summary = "Refresh authentication token", description = "Refresh the user's authentication token using a refresh token")
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

    @Operation(summary = "Forgot password", description = "Request a password reset link to be sent to the user's email")
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

    @Operation(summary = "Reset password", description = "Reset the user's password using a valid reset token")
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

    @Operation(summary="Change password", description = "Change the password of the currently authenticated user")
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);

        ApiResponse<String> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Password changed successfully",
                "Password changed successfully",
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Logout user", description = "Logout the currently authenticated user")
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

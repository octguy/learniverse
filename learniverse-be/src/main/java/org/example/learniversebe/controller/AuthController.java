package org.example.learniversebe.controller;

import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.LoginRequest;
import org.example.learniversebe.dto.request.RegisterRequest;
import org.example.learniversebe.dto.request.VerifyUserRequest;
import org.example.learniversebe.dto.response.AuthResponse;
import org.example.learniversebe.service.IAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/v1/auth")
@RestController
public class AuthController {

    private final IAuthService authService;

    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest registerRequest) {
        AuthResponse authResponse = authService.register(registerRequest);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verifyUser(@RequestBody @Valid VerifyUserRequest request) {
        authService.verifyUser(request);
        return ResponseEntity.ok("User verified successfully");
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerificationCode(@RequestParam String email) {
        authService.resendVerificationCode(email);
        return ResponseEntity.ok("Verification code resent successfully");
    }
}

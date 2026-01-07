package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.*;
import org.example.learniversebe.dto.response.AuthResponse;

public interface IAuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    void initAdmin(RegisterRequest request);

    AuthResponse registerAdmin(RegisterRequest request);

    void verifyUser(VerifyUserRequest request);

    void resendVerificationCode(String email);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void requestPasswordReset(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(ChangePasswordRequest request);

    void logout();
}


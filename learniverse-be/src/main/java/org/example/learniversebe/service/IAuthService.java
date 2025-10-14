package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.LoginRequest;
import org.example.learniversebe.dto.request.RegisterRequest;
import org.example.learniversebe.dto.request.VerifyUserRequest;
import org.example.learniversebe.dto.response.AuthResponse;
import org.example.learniversebe.model.User;

public interface IAuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    void verifyUser(VerifyUserRequest request);

    void resendVerificationCode(String email);
}


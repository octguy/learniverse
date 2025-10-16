package org.example.learniversebe.service;

import org.example.learniversebe.model.PasswordResetToken;
import org.example.learniversebe.model.User;

import java.util.UUID;

public interface IPasswordResetTokenService {

    PasswordResetToken findById(UUID id);

    PasswordResetToken create(User user);

    PasswordResetToken validateToken(String token);

    void markTokenAsUsed(PasswordResetToken token);
}

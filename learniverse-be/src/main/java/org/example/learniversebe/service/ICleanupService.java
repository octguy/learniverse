package org.example.learniversebe.service;

public interface ICleanupService {

    void cleanupPendingUsers();

    void cleanupExpiredRefreshTokens();

    void cleanupExpiredPasswordResetTokens();
}

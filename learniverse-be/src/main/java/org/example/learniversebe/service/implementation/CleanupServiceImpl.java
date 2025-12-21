package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.model.AuthCredential;
import org.example.learniversebe.model.PasswordResetToken;
import org.example.learniversebe.model.RefreshToken;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.AuthCredentialRepository;
import org.example.learniversebe.repository.PasswordResetTokenRepository;
import org.example.learniversebe.repository.RefreshTokenRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.ICleanupService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class CleanupServiceImpl implements ICleanupService {

    private final UserRepository userRepository;

    private final AuthCredentialRepository authCredentialRepository;

    private final RefreshTokenRepository refreshTokenRepository;

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public CleanupServiceImpl(UserRepository userRepository,
                              AuthCredentialRepository authCredentialRepository,
                              RefreshTokenRepository refreshTokenRepository,
                              PasswordResetTokenRepository passwordResetTokenRepository) {
        this.authCredentialRepository = authCredentialRepository;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 0 * * *") // runs every 1 day at midnight
    public void cleanupPendingUsers() {
        LocalDateTime now = LocalDateTime.now();
        List<User> users = userRepository.findPendingUserExceedOneDay();

        if (users.isEmpty()) {
            log.info("No unverified users to clean up.");
        } else {
            List<AuthCredential> authCredentials = authCredentialRepository.findAllByUserIn(users);

            // Soft delete by setting deletedAt timestamp
            users.forEach(user -> user.setDeletedAt(now));
            authCredentials.forEach(credential -> credential.setDeletedAt(now));

            userRepository.saveAll(users);
            authCredentialRepository.saveAll(authCredentials);

            log.info("Cleaned up {} unverified users and their credentials.", users.size());
        }
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 0 * * *") // runs every 1 day at midnight
    public void cleanupExpiredRefreshTokens() {
        List<RefreshToken> expiredTokens = refreshTokenRepository.findAllTokenExpiredAfter24Hours();

        if (expiredTokens.isEmpty()) {
            log.info("No expired refresh tokens to clean up.");
        } else {
            refreshTokenRepository.deleteAll(expiredTokens);
            log.info("Cleaned up {} expired refresh tokens.", expiredTokens.size());
        }
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 0 * * *") // runs every 1 day at midnight
    public void cleanupExpiredPasswordResetTokens() {
        List<PasswordResetToken> expiredTokens = passwordResetTokenRepository.findAllTokenExpiredAfter24Hours();

        if (expiredTokens.isEmpty()) {
            log.info("No expired password reset tokens to clean up.");
        } else {
            passwordResetTokenRepository.deleteAll(expiredTokens);
            log.info("Cleaned up {} expired password reset tokens.", expiredTokens.size());
        }
    }
}

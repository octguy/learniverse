package org.example.learniversebe.service.implementation;

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
    @Scheduled(fixedRate = 60000) // runs every 1 minute
    public void cleanupPendingUsers() {
        LocalDateTime now = LocalDateTime.now();
        List<User> users = userRepository.findPendingUserExceedOneDay();

        if (users.isEmpty()) {
            System.out.println("🧹 No unverified users to clean up.");
        } else {
            List<AuthCredential> authCredentials = authCredentialRepository.findAllByUserIn(users);

            // Soft delete by setting deletedAt timestamp
            users.forEach(user -> user.setDeletedAt(now));
            authCredentials.forEach(credential -> credential.setDeletedAt(now));

            userRepository.saveAll(users);
            authCredentialRepository.saveAll(authCredentials);

            System.out.println("🧹 Cleaned up " + users.size() + " unverified users and their credentials.");
        }

        // Clean up expired tokens that expired more than 1 day ago
        LocalDateTime threshold = now.minusDays(1);

        List<RefreshToken> expiredRefreshTokens = refreshTokenRepository.findAllByExpiryDateBefore(threshold);
        if (!expiredRefreshTokens.isEmpty()) {
            refreshTokenRepository.deleteAll(expiredRefreshTokens);
            System.out.println("🧹 Deleted " + expiredRefreshTokens.size() + " expired refresh tokens.");
        } else {
            System.out.println("🧹 No expired refresh tokens to delete.");
        }

        List<PasswordResetToken> expiredResetTokens = passwordResetTokenRepository.findAllByExpiryDateBefore(threshold);
        if (!expiredResetTokens.isEmpty()) {
            passwordResetTokenRepository.deleteAll(expiredResetTokens);
            System.out.println("🧹 Deleted " + expiredResetTokens.size() + " expired password reset tokens.");
        } else {
            System.out.println("🧹 No expired password reset tokens to delete.");
        }
    }
}

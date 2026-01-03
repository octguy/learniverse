package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.model.PasswordResetToken;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.PasswordResetTokenRepository;
import org.example.learniversebe.service.IPasswordResetTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
public class PasswordResetTokenImpl implements IPasswordResetTokenService {

    @Value("${spring.reset-password-token.expiration}")
    private Long expiration;

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public PasswordResetTokenImpl(PasswordResetTokenRepository passwordResetTokenRepository) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Override
    public PasswordResetToken findById(UUID id) {
        return passwordResetTokenRepository.findById(id).orElseThrow(() -> new RuntimeException("Password reset token not found"));
    }

    @Override
    public PasswordResetToken create(User user) { // reset or create new
        log.info("Creating password reset token for user: {}", user.getUsername());
        if (passwordResetTokenRepository.findByUser(user).isPresent()) {
            log.debug("Updating existing password reset token for user: {}", user.getUsername());
            PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByUser(user).get();
            passwordResetToken.setToken(UUID.randomUUID().toString());
            passwordResetToken.setExpiration(LocalDateTime.now().plusMinutes(expiration));
            passwordResetToken.setUpdatedAt(LocalDateTime.now());
            return passwordResetTokenRepository.save(passwordResetToken);
        } else {
            PasswordResetToken passwordResetToken = new PasswordResetToken();
            passwordResetToken.setId(UUID.randomUUID());
            passwordResetToken.setUser(user);
            passwordResetToken.setToken(UUID.randomUUID().toString());
            passwordResetToken.setExpiration(LocalDateTime.now().plusMinutes(expiration));
            passwordResetToken.setCreatedAt(LocalDateTime.now());
            passwordResetToken.setUpdatedAt(LocalDateTime.now());
            return passwordResetTokenRepository.save(passwordResetToken);
        }
    }

    @Override
    public PasswordResetToken validateToken(String token) {
        log.debug("Validating password reset token");
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid token"));

        if (resetToken.getExpiration().isBefore(LocalDateTime.now())) {
            log.warn("Password reset token expired for user: {}", resetToken.getUser().getUsername());
            throw new BadRequestException("Token expired");
        }

        return resetToken;
    }

    @Override
    public void markTokenAsUsed(PasswordResetToken token) {
        passwordResetTokenRepository.delete(token);
    }
}

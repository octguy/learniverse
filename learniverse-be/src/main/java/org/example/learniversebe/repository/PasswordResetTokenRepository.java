package org.example.learniversebe.repository;

import org.example.learniversebe.model.PasswordResetToken;
import org.example.learniversebe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByUser(User user);

    Optional<PasswordResetToken> findByToken(String token);

    // Find all password reset tokens whose expiry date is before the given time.
    @Query(value = "select * from password_reset_token " +
            "where (expiration + INTERVAL '24 hours') <= NOW()", nativeQuery = true)
    List<PasswordResetToken> findAllTokenExpiredAfter24Hours();
}

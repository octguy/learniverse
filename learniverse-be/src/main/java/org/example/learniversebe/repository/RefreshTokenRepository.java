package org.example.learniversebe.repository;

import org.example.learniversebe.model.RefreshToken;
import org.example.learniversebe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUser(User user);

    void deleteByUser(User user);

    // Find all refresh tokens whose expiry date is before the given time.
    // Ensure your RefreshToken entity exposes a field named 'expiryDate' (LocalDateTime).
    List<RefreshToken> findAllByExpiryDateBefore(LocalDateTime time);
}

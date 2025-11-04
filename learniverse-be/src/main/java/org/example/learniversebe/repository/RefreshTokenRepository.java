package org.example.learniversebe.repository;

import org.example.learniversebe.model.RefreshToken;
import org.example.learniversebe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUser(User user);

    void deleteByUser(User user);

    // Find all refresh tokens whose expiry date plus 24 hours is before the current time.
    @Query(value = "select * from refresh_token " +
            "where (expiration + INTERVAL '24 hours') <= NOW()", nativeQuery = true)
    List<RefreshToken> findAllTokenExpiredAfter24Hours();
}

package org.example.learniversebe.service.implementation;

import org.example.learniversebe.model.RefreshToken;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.RefreshTokenRepository;
import org.example.learniversebe.service.IRefreshTokenService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements IRefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token).orElseThrow(() -> new RuntimeException("Refresh token not found"));
    }

    @Override
    public RefreshToken createRefreshToken(User user) {
        Optional<RefreshToken> existingToken = refreshTokenRepository.findByUser(user);

        if (existingToken.isPresent()) { // if a token already exists for the user, update it
            RefreshToken refreshToken = existingToken.get();
            refreshToken.setToken(UUID.randomUUID().toString());
            refreshToken.setExpiration(LocalDateTime.now().plusDays(10)); // Extend expiration to 7 days
            refreshToken.setUpdatedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);
            return refreshToken;
        }

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(UUID.randomUUID());
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiration(LocalDateTime.now().plusMinutes(10)); // Set after 7 days instead of 10 minutes
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshToken.setUpdatedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);

        return refreshToken;
    }
}

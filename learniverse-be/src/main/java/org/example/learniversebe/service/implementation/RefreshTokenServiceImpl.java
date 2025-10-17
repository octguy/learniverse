package org.example.learniversebe.service.implementation;

import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.model.RefreshToken;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.RefreshTokenRepository;
import org.example.learniversebe.service.IRefreshTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements IRefreshTokenService {

    @Value("${spring.refresh-token.expiration}")
    private Long expiration;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public RefreshToken findByToken(String token) {
        // Return 401 http, frontend should catch this and redirect to login
        return refreshTokenRepository.findByToken(token).orElseThrow(() -> new UnauthorizedException("Refresh token not found"));
    }

    @Override
    public RefreshToken createRefreshToken(User user) {
        Optional<RefreshToken> existingToken = refreshTokenRepository.findByUser(user);

        if (existingToken.isPresent()) { // if a token already exists for the user, update it
            RefreshToken refreshToken = existingToken.get();
            refreshToken.setToken(UUID.randomUUID().toString());
            refreshToken.setExpiration(LocalDateTime.now().plusMinutes(expiration)); // Extend expiration to 7 days
            refreshToken.setUpdatedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);
            return refreshToken;
        }

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(UUID.randomUUID());
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiration(LocalDateTime.now().plusMinutes(expiration));
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshToken.setUpdatedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);

        return refreshToken;
    }

    @Override
    public boolean verifyExpiration(RefreshToken token) {
        return token.getExpiration().isBefore(LocalDateTime.now());
    }

    @Override
    public void delete(RefreshToken token) {
        refreshTokenRepository.deleteById(token.getId());
    }

    @Override
    public void deleteByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
}

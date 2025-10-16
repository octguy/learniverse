package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.RefreshTokenRequest;
import org.example.learniversebe.model.RefreshToken;
import org.example.learniversebe.model.User;

public interface IRefreshTokenService {

    RefreshToken findByToken(String token);

    RefreshToken createRefreshToken(User user);

    boolean verifyExpiration(RefreshToken token);

    void delete(RefreshToken token);
}

package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.model.UserProfile;

import java.util.UUID;

public interface IUserProfileService {
    UserProfile onboardProfile(UserProfileRequest request);
    UserProfile viewProfile(UUID userId);

    UserProfile updateProfile(UUID userId, UserProfileRequest request);
}

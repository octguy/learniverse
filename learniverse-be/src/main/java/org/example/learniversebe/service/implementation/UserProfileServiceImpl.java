package org.example.learniversebe.service.implementation;

import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.service.IUserProfileService;

import java.util.UUID;

public class UserProfileServiceImpl implements IUserProfileService {

    @Override
    public UserProfile onboardProfile(UserProfileRequest request) {
        return null;
    }

    @Override
    public UserProfile viewProfile(UUID userId) {
        return null;
    }

    @Override
    public UserProfile updateProfile(UUID userId, UserProfileRequest request) {
        return null;
    }
}

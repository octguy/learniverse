package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.dto.response.UserTagResponse;
import org.example.learniversebe.model.UserProfile;

import java.util.List;
import java.util.UUID;

public interface IUserProfileService {
    UserProfileResponse onboardProfile(UUID userId, UserProfileRequest request);
    UserProfileResponse viewProfile(UUID userId);
    UserProfileResponse updateProfile(UUID userId, UserProfileRequest request);
}

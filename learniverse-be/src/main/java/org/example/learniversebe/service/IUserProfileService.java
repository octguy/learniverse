package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface IUserProfileService {
    UserProfileResponse onboardProfile(UUID userId, UserProfileRequest request, MultipartFile avatar, MultipartFile cover);
    UserProfileResponse viewProfile(UUID userId);
    UserProfileResponse updateProfile(UUID userId, UserProfileRequest request, MultipartFile avatar, MultipartFile cover);
}

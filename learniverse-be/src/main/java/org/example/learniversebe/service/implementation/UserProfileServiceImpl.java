package org.example.learniversebe.service.implementation;

import jakarta.persistence.EntityNotFoundException;
import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.dto.request.UserProfileTagRequest;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.model.UserProfileTag;
import org.example.learniversebe.model.UserTag;
import org.example.learniversebe.repository.UserProfileRepository;
import org.example.learniversebe.repository.UserProfileTagRepository;
import org.example.learniversebe.repository.UserTagRepository;
import org.example.learniversebe.service.IUserProfileService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserProfileServiceImpl implements IUserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserTagRepository userTagRepository;
    private final UserProfileTagRepository userProfileTagRepository;

    public UserProfileServiceImpl(UserProfileRepository userProfileRepository, UserTagRepository userTagRepository, UserProfileTagRepository userProfileTagRepository){
        this.userProfileRepository = userProfileRepository;
        this.userTagRepository = userTagRepository;
        this.userProfileTagRepository = userProfileTagRepository;
    }

    @Override
    public UserProfile onboardProfile(UserProfileRequest request) {
        UserProfile profile = new UserProfile();
        profile.setDisplayName(request.getDisplayName());
        profile.setBio(request.getBio());
        profile.setAvatarUrl(request.getAvatarUrl());

        // Lưu profile để có ID
        userProfileRepository.save(profile);

        // Gắn tag (nếu có)
        if (request.getUserTags() != null && !request.getUserTags().isEmpty()) {
            for (UserProfileTagRequest tagRequest : request.getUserTags()) {
                UserTag tag = userTagRepository.findById(tagRequest.getUserTagId())
                        .orElseThrow(() -> new RuntimeException("Tag not found: " + tagRequest.getUserTagId()));

                UserProfileTag relation = new UserProfileTag();
                relation.setUserProfile(profile);
                relation.setUserTag(tag);

                userProfileTagRepository.save(relation);
            }
        }

        return userProfileRepository.findById(profile.getId()) .orElseThrow(() -> new RuntimeException("User profile not found with ID: " + profile.getId()));
    }

    @Override
    public UserProfile viewProfile(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found with ID: " + userId));
    }

    @Override
    public UserProfile updateProfile(UUID userId, UserProfileRequest request) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found with ID: " + userId));

        // Cập nhật thông tin cơ bản
        if (request.getDisplayName() != null)
            profile.setDisplayName(request.getDisplayName());
        if (request.getBio() != null)
            profile.setBio(request.getBio());
        if (request.getAvatarUrl() != null)
            profile.setAvatarUrl(request.getAvatarUrl());

        userProfileRepository.save(profile);

        // Cập nhật tags (xóa cũ, thêm mới)
        if (request.getUserTags() != null) {
            userProfileTagRepository.deleteAllByUserProfile(profile);

            for (UserProfileTagRequest tagRequest : request.getUserTags()) {
                UserTag tag = userTagRepository.findById(tagRequest.getUserTagId())
                        .orElseThrow(() -> new RuntimeException("Tag not found: " + tagRequest.getUserTagId()));

                UserProfileTag relation = new UserProfileTag();
                relation.setUserProfile(profile);
                relation.setUserTag(tag);

                userProfileTagRepository.save(relation);
            }
        }

        return userProfileRepository.findById(userId).orElseThrow(
                () -> new EntityNotFoundException("User not found with ID: " + userId)
        );
    }
}

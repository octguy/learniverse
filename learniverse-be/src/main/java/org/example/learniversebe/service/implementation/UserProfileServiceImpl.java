package org.example.learniversebe.service.implementation;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.dto.request.UserProfileTagRequest;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.model.UserProfileTag;
import org.example.learniversebe.model.UserTag;
import org.example.learniversebe.repository.UserProfileRepository;
import org.example.learniversebe.repository.UserProfileTagRepository;
import org.example.learniversebe.repository.UserTagRepository;
import org.example.learniversebe.service.IUserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UserProfileServiceImpl implements IUserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserTagRepository userTagRepository;
    private final UserProfileTagRepository userProfileTagRepository;

    private final Cloudinary cloudinary;
    private final String cloudinaryFolder;

    public UserProfileServiceImpl(UserProfileRepository userProfileRepository,
                                  UserTagRepository userTagRepository,
                                  UserProfileTagRepository userProfileTagRepository,
                                  Cloudinary cloudinary,
                                  String cloudinaryFolder) {
        this.userProfileRepository = userProfileRepository;
        this.userTagRepository = userTagRepository;
        this.userProfileTagRepository = userProfileTagRepository;
        this.cloudinary = cloudinary;
        this.cloudinaryFolder = cloudinaryFolder;
    }

    @Override
    public UserProfile onboardProfile(UserProfileRequest request) {
        UserProfile profile = new UserProfile();
        profile.setDisplayName(request.getDisplayName());
        profile.setBio(request.getBio());

        // Upload avatar nếu có
        String avatarUrl = uploadAvatar(request.getAvatar());
        if (avatarUrl != null) profile.setAvatarUrl(avatarUrl);

        userProfileRepository.save(profile);

        // Gắn tags
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

        return profile;
    }

    @Override
    public UserProfileResponse viewProfile(UUID userId) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found with ID: " + userId));
        return toResponse(profile);
    }

    @Override
    public UserProfileResponse updateProfile(UUID userId, UserProfileRequest request) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found with ID: " + userId));

        if (request.getDisplayName() != null)
            profile.setDisplayName(request.getDisplayName());
        if (request.getBio() != null)
            profile.setBio(request.getBio());

        // Nếu có avatar mới thì upload và cập nhật
        String avatarUrl = uploadAvatar(request.getAvatar());
        if (avatarUrl != null)
            profile.setAvatarUrl(avatarUrl);

        userProfileRepository.save(profile);

        // Cập nhật tags
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

        return toResponse(profile);
    }

    // Help function
    private String uploadAvatar(MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) return null;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader()
                    .upload(avatar.getBytes(),
                            ObjectUtils.asMap(
                                    "folder", cloudinaryFolder,
                                    "resource_type", "image",
                                    "use_filename", true,
                                    "unique_filename", true
                            )
                    );

            Object secureUrl = uploadResult.get("secure_url");
            return secureUrl != null ? secureUrl.toString() : null;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload avatar to Cloudinary", e);
        }
    }

    private UserProfileResponse toResponse(UserProfile profile) {
        List<String> tagNames = profile.getUserTags().stream()
                .map(rel -> rel.getUserTag().getName())
                .toList();

        return UserProfileResponse.builder()
                .id(profile.getId())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .postCount(profile.getPostCount())
                .answeredQuestionCount(profile.getAnsweredQuestionCount())
                .tags(tagNames)
                .build();
    }
}

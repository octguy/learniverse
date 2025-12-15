package org.example.learniversebe.service.implementation;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.transaction.Transactional;
import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.dto.response.UserTagResponse;
import org.example.learniversebe.mapper.UserMapper;
import org.example.learniversebe.model.User;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.model.UserProfileTag;
import org.example.learniversebe.model.UserTag;
import org.example.learniversebe.model.composite_key.UserProfileTagId;
import org.example.learniversebe.repository.UserProfileRepository;
import org.example.learniversebe.repository.UserProfileTagRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.repository.UserTagRepository;
import org.example.learniversebe.service.IUserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.example.learniversebe.enums.UserTagType;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserProfileServiceImpl implements IUserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserTagRepository userTagRepository;
    private final UserProfileTagRepository userProfileTagRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final String cloudinaryFolder;
    private final UserMapper userMapper;

    public UserProfileServiceImpl(UserProfileRepository userProfileRepository,
                                  UserTagRepository userTagRepository,
                                  UserProfileTagRepository userProfileTagRepository,
                                  UserRepository userRepository,
                                  Cloudinary cloudinary,
                                  String cloudinaryFolder,
                                  UserMapper userMapper) {
        this.userProfileRepository = userProfileRepository;
        this.userTagRepository = userTagRepository;
        this.userProfileTagRepository = userProfileTagRepository;
        this.userRepository = userRepository;
        this.cloudinary = cloudinary;
        this.cloudinaryFolder = cloudinaryFolder;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public UserProfileResponse onboardProfile(UUID userId, UserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(userId);
        if (profile == null) {
            profile = new UserProfile();
            profile.setId(UUID.randomUUID());
            profile.setUser(user);
        }

        if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName());
        if (request.getBio() != null) profile.setBio(request.getBio());

        String avatarUrl = uploadImage(request.getAvatar());
        if (avatarUrl != null) profile.setAvatarUrl(avatarUrl);

        String coverUrl = uploadImage(request.getCover());
        if (coverUrl != null) profile.setCoverUrl(coverUrl);

        synchronizeUserTags(profile, request.getInterestTagIds(), request.getSkillTagIds());

        if (!user.isOnboarded()) {
            user.setOnboarded(true);
            userRepository.save(user);
        }

        UserProfile savedProfile = userProfileRepository.save(profile);
        return toResponse(savedProfile);
    }

    @Override
    public UserProfileResponse viewProfile(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId);

        if (profile == null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            profile = new UserProfile();
            profile.setId(UUID.randomUUID());
            profile.setUser(user);
            profile.setDisplayName(user.getUsername());
            profile.setBio("Thành viên mới của Learniverse");
            profile.setPostCount(0);
            profile.setAnsweredQuestionCount(0);
            profile.setCreatedAt(LocalDateTime.now());
            profile.setUpdatedAt(LocalDateTime.now());
            profile = userProfileRepository.save(profile);
        }

        return toResponse(profile);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UserProfileRequest request) {
        UserProfile profile = userProfileRepository.findByUserId(userId);
        if (profile == null) throw new RuntimeException("Profile not found");

        if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName());
        if (request.getBio() != null) profile.setBio(request.getBio());

        String avatarUrl = uploadImage(request.getAvatar());
        if (avatarUrl != null) profile.setAvatarUrl(avatarUrl);

        String coverUrl = uploadImage(request.getCover());
        if (coverUrl != null) profile.setCoverUrl(coverUrl);

        synchronizeUserTags(profile, request.getInterestTagIds(), request.getSkillTagIds());

        return toResponse(userProfileRepository.save(profile));
    }

    private void synchronizeUserTags(UserProfile profile, Set<UUID> interestIds, Set<UUID> skillIds) {
        if (profile.getUserTags() == null) profile.setUserTags(new HashSet<>());
        Set<UserProfileTag> currentTags = profile.getUserTags();
        currentTags.clear();

        addTagsByType(profile, currentTags, interestIds, UserTagType.INTEREST);

        addTagsByType(profile, currentTags, skillIds, UserTagType.SKILL_IMPROVE);
    }

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

    private void addTagsByType(UserProfile profile, Set<UserProfileTag> currentTags, Set<UUID> tagIds, UserTagType type) {
        if (tagIds == null) return;
        for (UUID tagId : tagIds) {
            UserTag tag = userTagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Tag not found: " + tagId));

            UserProfileTag relation = new UserProfileTag();

            UserProfileTagId id = new UserProfileTagId(profile.getId(), tag.getId(), type);
            relation.setUserProfileTagId(id);

            relation.setUserProfile(profile);
            relation.setUserTag(tag);

            currentTags.add(relation);
        }
    }

    private String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader()
                    .upload(file.getBytes(),
                            ObjectUtils.asMap(
                                    "folder", cloudinaryFolder,
                                    "resource_type", "image"
                            )
                    );
            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    private UserProfileResponse toResponse(UserProfile profile) {
        List<UserTagResponse> interestTags = new ArrayList<>();
        List<UserTagResponse> skillTags = new ArrayList<>();

        if (profile.getUserTags() != null) {
            for (UserProfileTag pt : profile.getUserTags()) {
                UserTagResponse dto = UserTagResponse.builder()
                        .id(pt.getUserTag().getId())
                        .name(pt.getUserTag().getName())
                        .build();

                if (pt.getType() == org.example.learniversebe.enums.UserTagType.INTEREST) {
                    interestTags.add(dto);
                } else if (pt.getType() == org.example.learniversebe.enums.UserTagType.SKILL_IMPROVE) {
                    skillTags.add(dto);
                }
            }
        }

        return UserProfileResponse.builder()
                .id(profile.getId())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .coverUrl(profile.getCoverUrl())
                .postCount(profile.getPostCount())
                .answeredQuestionCount(profile.getAnsweredQuestionCount())
                .user(userMapper.toUserResponse(profile.getUser()))
                .interestTags(interestTags)
                .skillTags(skillTags)
                .build();
    }
}
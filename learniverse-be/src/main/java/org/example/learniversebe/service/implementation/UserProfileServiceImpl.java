package org.example.learniversebe.service.implementation;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.TagResponse;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.model.User;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.model.UserProfileTag;
import org.example.learniversebe.model.Tag;
import org.example.learniversebe.model.composite_key.UserProfileTagId;
import org.example.learniversebe.repository.UserProfileRepository;
import org.example.learniversebe.repository.UserProfileTagRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.repository.TagRepository;
import org.example.learniversebe.service.IUserProfileService;
import org.example.learniversebe.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.example.learniversebe.enums.UserTagType;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class UserProfileServiceImpl implements IUserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final TagRepository userTagRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final String cloudinaryFolder;

    public UserProfileServiceImpl(UserProfileRepository userProfileRepository,
                                  TagRepository userTagRepository,
                                  UserProfileTagRepository userProfileTagRepository,
                                  UserRepository userRepository,
                                  Cloudinary cloudinary,
                                  String cloudinaryFolder) {
        this.userProfileRepository = userProfileRepository;
        this.userTagRepository = userTagRepository;
        this.userRepository = userRepository;
        this.cloudinary = cloudinary;
        this.cloudinaryFolder = cloudinaryFolder;
    }

    @Override
    @Transactional
    public UserProfileResponse onboardProfile(UUID userId, UserProfileRequest request, MultipartFile avatar, MultipartFile cover) {
        log.info("Onboarding profile for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(userId);
        if (profile == null) {
            profile = new UserProfile();
            profile.setId(UUID.randomUUID());
            profile.setUser(user);
        }

        profile.setDisplayName(request.getDisplayName());
        profile.setBio(request.getBio());

        String avatarUrl = uploadImage(avatar);
        if (avatarUrl != null) profile.setAvatarUrl(avatarUrl);

        String coverUrl = uploadImage(cover);
        if (coverUrl != null) profile.setCoverUrl(coverUrl);

        synchronizeUserTags(profile, request.getInterestTagIds(), request.getSkillTagIds());

        if (!user.isOnboarded()) {
            user.setOnboarded(true);
            userRepository.save(user);
        }

        UserProfile savedProfile = userProfileRepository.save(profile);
        log.info("Profile onboarded successfully for user ID: {}", userId);
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
    public UserProfileResponse updateProfile(UUID userId, UserProfileRequest request, MultipartFile avatar, MultipartFile cover) {
        log.info("Updating profile for user ID: {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId);
        if (profile == null) throw new RuntimeException("Profile not found");

        if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName());
        if (request.getBio() != null) profile.setBio(request.getBio());

        String avatarUrl = uploadImage(avatar);
        if (avatarUrl != null) profile.setAvatarUrl(avatarUrl);

        String coverUrl = uploadImage(cover);
        if (coverUrl != null) profile.setCoverUrl(coverUrl);

        synchronizeUserTags(profile, request.getInterestTagIds(), request.getSkillTagIds());

        return toResponse(userProfileRepository.save(profile));
    }

    public PageResponse<UserProfileResponse> searchUserExcludeAdmin(Pageable pageable, String search){
        if (search == null) {
            search = "";
        }
        search = search.trim();

        Page<User> page =
                userProfileRepository.searchUserExcludeAdmin(search, pageable);

        List<UserProfileResponse> content = page.getContent()
                .stream()
                .map(user -> {
                    UserProfile profile = user.getUserProfile();
                    if (profile != null) {
                        return toResponse(profile);
                    }
                    return toResponse(user);
                })
                .toList();

        PageResponse<UserProfileResponse> response = new PageResponse<>();
        response.setContent(content);
        response.setCurrentPage(page.getNumber());
        response.setPageSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());

        return response;
    }

    private void synchronizeUserTags(UserProfile userProfile,
                                     Set<UUID> interestIds,
                                     Set<UUID> skillIds) {
        if (userProfile.getUserProfileTags() == null)
            userProfile.setUserProfileTags(new HashSet<>());

        Set<UserProfileTag> currentTags = userProfile.getUserProfileTags();
        currentTags.clear();

        addTagsByType(userProfile, currentTags, interestIds, UserTagType.INTEREST);

        addTagsByType(userProfile, currentTags, skillIds, UserTagType.SKILL_IMPROVE);
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
            Tag tag = userTagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Tag not found: " + tagId));

            UserProfileTag relation = new UserProfileTag();

            UserProfileTagId id = new UserProfileTagId(profile.getId(), tag.getId(), type);

            relation.setUserProfileTagId(id);
            relation.setUserProfile(profile);
            relation.setTag(tag);

            currentTags.add(relation);
        }
    }

    private String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader()
                    .upload(file.getBytes(),
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
        List<TagResponse> interestTags = new ArrayList<>();
        List<TagResponse> skillTags = new ArrayList<>();

        for (UserProfileTag relation : profile.getUserProfileTags()) {
            if (relation.getType() == UserTagType.INTEREST) {
                TagResponse response = TagResponse.builder()
                                .id(relation.getTag().getId())
                                .name(relation.getTag().getName())
                                .slug(relation.getTag().getSlug())
                                .description(relation.getTag().getSlug())
                                .build();

                interestTags.add(response);
            } else if (relation.getType() == UserTagType.SKILL_IMPROVE) {
                TagResponse response = TagResponse.builder()
                        .id(relation.getTag().getId())
                        .name(relation.getTag().getName())
                        .slug(relation.getTag().getSlug())
                        .description(relation.getTag().getSlug())
                        .build();

                skillTags.add(response);
            }
        }

        UserRole role = profile.getUser().getRoleUsers().stream()
                .findFirst()
                .map(roleUser -> roleUser.getRole().getName())
                .orElse(UserRole.ROLE_USER);

        return UserProfileResponse.builder()
                .id(profile.getId())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .coverUrl(profile.getCoverUrl())
                .postCount(profile.getPostCount())
                .answeredQuestionCount(profile.getAnsweredQuestionCount())
                .interestTags(interestTags)
                .skillTags(skillTags)
                .role(role)
                .build();
    }

    // Mapper for user without user profile
    private UserProfileResponse toResponse(User user) {

        UserRole role = user.getRoleUsers().stream()
                .findFirst()
                .map(roleUser -> roleUser.getRole().getName())
                .orElse(UserRole.ROLE_USER);

        return UserProfileResponse.builder()
                .id(null) // chưa có profile
                .displayName(user.getUsername()) // fallback
                .bio(null)
                .avatarUrl(null)
                .coverUrl(null)
                .postCount(0)
                .answeredQuestionCount(0)
                .interestTags(List.of())
                .skillTags(List.of())
                .role(role)
                .build();
    }

}
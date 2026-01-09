package org.example.learniversebe.service.implementation;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.request.BroadcastNotificationRequest;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.SendNotificationRequest;
import org.example.learniversebe.dto.request.UpdateUserRoleRequest;
import org.example.learniversebe.dto.request.UpdateUserStatusRequest;
import org.example.learniversebe.dto.request.BroadcastNotificationRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.*;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.mapper.NotificationMapper;
import org.example.learniversebe.model.Content;
import org.example.learniversebe.mapper.NotificationMapper;
import org.example.learniversebe.model.Notification;
import org.example.learniversebe.model.Role;
import org.example.learniversebe.model.RoleUser;
import org.example.learniversebe.mapper.NotificationMapper;
import org.example.learniversebe.model.Notification;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ContentRepository;
import org.example.learniversebe.repository.NotificationRepository;
import org.example.learniversebe.repository.NotificationRepository;
import org.example.learniversebe.repository.RoleRepository;
import org.example.learniversebe.repository.RoleUserRepository;
import org.example.learniversebe.repository.NotificationRepository;
import org.example.learniversebe.repository.TagRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IDashboardService;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.service.IPostService;
import org.example.learniversebe.service.IQuestionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements IDashboardService {

    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final TagRepository tagRepository;
    private final RoleRepository roleRepository;
    private final RoleUserRepository roleUserRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final ContentMapper contentMapper;

    private final INotificationService notificationService;
    private final IPostService postService;
    private final IQuestionService questionService;
    private static final int PAGE_SIZE = 20;

    @Override
    public DashboardStatsResponse getStats() {
        long totalUsers = userRepository.count();
        
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long newUsersToday = userRepository.countNewUsersInRange(startOfDay, endOfDay);
        
        long totalPosts = contentRepository.countByContentType(ContentType.POST);
        long totalQuestions = contentRepository.countByContentType(ContentType.QUESTION);

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .totalPosts(totalPosts)
                .totalQuestions(totalQuestions)
                .build();
    }

    @Override
    public UserGrowthResponse getUserGrowth(DashboardPeriod period) {
        List<Object[]> results = switch (period) {
            case DAY -> userRepository.findUserGrowthByDay();
            case MONTH -> userRepository.findUserGrowthByMonth();
            case YEAR -> userRepository.findUserGrowthByYear();
        };

        List<UserGrowthResponse.GrowthDataPoint> dataPoints = mapToGrowthDataPoints(results);

        return UserGrowthResponse.builder()
                .period(period.name())
                .data(dataPoints)
                .build();
    }

    private List<UserGrowthResponse.GrowthDataPoint> mapToGrowthDataPoints(List<Object[]> results) {
        List<UserGrowthResponse.GrowthDataPoint> dataPoints = new ArrayList<>();
        for (Object[] row : results) {
            dataPoints.add(UserGrowthResponse.GrowthDataPoint.builder()
                    .label((String) row[0])
                    .count(((Number) row[1]).longValue())
                    .build());
        }
        return dataPoints;
    }

    @Override
    public ContentComparisonResponse getContentComparison(DashboardPeriod period) {
        List<Object[]> results = switch (period) {
            case DAY -> contentRepository.findContentComparisonByDay();
            case MONTH -> contentRepository.findContentComparisonByMonth();
            case YEAR -> contentRepository.findContentComparisonByYear();
        };

        List<ContentComparisonResponse.ComparisonDataPoint> dataPoints = mapToComparisonDataPoints(results);

        return ContentComparisonResponse.builder()
                .period(period.name())
                .data(dataPoints)
                .build();
    }

    private List<ContentComparisonResponse.ComparisonDataPoint> mapToComparisonDataPoints(List<Object[]> results) {
        List<ContentComparisonResponse.ComparisonDataPoint> dataPoints = new ArrayList<>();
        for (Object[] row : results) {
            dataPoints.add(ContentComparisonResponse.ComparisonDataPoint.builder()
                    .label((String) row[0])
                    .postCount(((Number) row[1]).longValue())
                    .questionCount(((Number) row[2]).longValue())
                    .build());
        }
        return dataPoints;
    }

    @Override
    public List<TopTagResponse> getTopTags() {
        List<Object[]> results = tagRepository.findTop5MostUsedTags();

        List<TopTagResponse> topTags = new ArrayList<>();
        for (Object[] row : results) {
            topTags.add(TopTagResponse.builder()
                    .id((UUID) row[0])
                    .name((String) row[1])
                    .slug((String) row[2])
                    .usageCount(((Number) row[3]).longValue())
                    .build());
        }

        return topTags;
    }

    @Override
    public PageResponse<NewUserResponse> getNewestUsers(int page) {
        Pageable pageable = PageRequest.of(page, PAGE_SIZE, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findAll(pageable);

        List<NewUserResponse> users = userPage.getContent().stream()
                .map(user -> NewUserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .createdAt(user.getCreatedAt())
                        .status(user.getStatus())
                        .build())
                .toList();

        return PageResponse.<NewUserResponse>builder()
                .content(users)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .pageSize(userPage.getSize())
                .last(userPage.isLast())
                .first(userPage.isFirst())
                .numberOfElements(userPage.getNumberOfElements())
                .build();
    }

    @Override
    public PageResponse<NewUserResponse> getAllUsers(int page, int size, String search) {
        log.info("Getting all users with page: {}, size: {}, search: {}", page, size, search);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage;

        if (search != null && !search.isBlank()) {
            userPage = userRepository.searchByEmailOrUsername(search.trim(), pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<NewUserResponse> users = userPage.getContent().stream()
                .map(user -> NewUserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .createdAt(user.getCreatedAt())
                        .status(user.getStatus())
                        .build())
                .toList();

        return PageResponse.<NewUserResponse>builder()
                .content(users)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .pageSize(userPage.getSize())
                .last(userPage.isLast())
                .first(userPage.isFirst())
                .numberOfElements(userPage.getNumberOfElements())
                .build();
    }

    @Override
    @Transactional
    public NewUserResponse updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
        log.info("Updating user status for userId: {} to status: {}", userId, request.getStatus());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));

        user.setStatus(request.getStatus());
        
        // Update enabled flag based on status
        if (request.getStatus() != UserStatus.ACTIVE) {
            user.setEnabled(false);
            log.info("User enabled set to false for userId: {} due to status: {}", userId, request.getStatus());
        } else {
            user.setEnabled(true);
            log.info("User enabled set to true for userId: {} due to status: {}", userId, request.getStatus());
        }
        
        User updatedUser = userRepository.save(user);

        log.info("User status updated successfully for userId: {}", userId);

        return NewUserResponse.builder()
                .id(updatedUser.getId())
                .username(updatedUser.getUsername())
                .email(updatedUser.getEmail())
                .createdAt(updatedUser.getCreatedAt())
                .status(updatedUser.getStatus())
                .build();
    }

    @Override
    @Transactional
    public NewUserResponse updateUserRole(UUID userId, UpdateUserRoleRequest request) {
        log.info("Updating user role for userId: {} to role: {}", userId, request.getRole());

        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));

        Role newRole = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRole().name()));

        // Clear existing roles and add the new one
        user.getRoleUsers().clear();

        RoleUser roleUser = new RoleUser();
        roleUser.setUser(user);
        roleUser.setRole(newRole);
        roleUser.setCreatedAt(LocalDateTime.now());
        roleUser.setUpdatedAt(LocalDateTime.now());
        user.getRoleUsers().add(roleUser);

        User updatedUser = userRepository.save(user);

        log.info("User role updated successfully for userId: {}", userId);

        return NewUserResponse.builder()
                .id(updatedUser.getId())
                .username(updatedUser.getUsername())
                .email(updatedUser.getEmail())
                .createdAt(updatedUser.getCreatedAt())
                .status(updatedUser.getStatus())
                .build();
    }

    @Override
    @Transactional
    public PageResponse<NotificationResponse> getAllNotifications(int page, int size) {
        log.info("Getting all notifications with page: {}, size: {}", page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage = notificationRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<NotificationResponse> notifications = notificationPage.getContent().stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<NotificationResponse>builder()
                .content(notifications)
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .currentPage(notificationPage.getNumber())
                .pageSize(notificationPage.getSize())
                .last(notificationPage.isLast())
                .first(notificationPage.isFirst())
                .numberOfElements(notificationPage.getNumberOfElements())
                .build();
    }

    @Override
    @Transactional
    public int sendNotification(SendNotificationRequest request) {
        log.info("Sending notification: {}", request);

        List<User> recipients;
        NotificationType notificationType;

        if (request.getRecipientIds() == null || request.getRecipientIds().isEmpty()) {
            // Broadcast to all users
            recipients = userRepository.findAll();
            notificationType = NotificationType.BROADCAST;
            log.info("Broadcasting notification to all {} users", recipients.size());
        } else {
            // Send to specific users
            recipients = userRepository.findAllById(request.getRecipientIds());
            notificationType = NotificationType.SYSTEM;
            log.info("Sending notification to {} specific users", recipients.size());
        }

        LocalDateTime now = LocalDateTime.now();
        int sentCount = 0;

        for (User recipient : recipients) {
            Notification notification = new Notification();
            notification.setId(UUID.randomUUID());
            notification.setRecipient(recipient);
            notification.setSender(null); // System notification, no sender
            notification.setNotificationType(notificationType);
            notification.setContent(request.getContent());
            notification.setRelatedEntityId(request.getRelatedEntityId());
            notification.setRelatedEntityType(request.getRelatedEntityType());
            notification.setIsRead(false);
            notification.setCreatedAt(now);
            notification.setUpdatedAt(now);

            notificationRepository.save(notification);
            sentCount++;
        }

        log.info("Successfully sent {} notifications", sentCount);
        return sentCount;
    }
    @Override
    @Transactional
    public int broadcastNotification(BroadcastNotificationRequest request) {
        // Lấy tất cả users đang active
        List<User> allUsers = userRepository.findAll().stream()
                .filter(User::isEnabled)
                .toList();

        // Gửi thông báo cho từng user
        for (User user : allUsers) {
            notificationService.createNotification(
                    user.getId(),
                    null,
                    request.getNotificationType(),
                    request.getContent(),
                    request.getRelatedEntityId(),
                    request.getRelatedEntityType()
            );
        }

        return allUsers.size();
    }

    @Override
    public PageResponse<PostSummaryResponse> getAllPosts(ContentStatus status, UUID ownerId, String keyword, Pageable pageable) {
        log.info("Getting all posts with filters - status: {}, ownerId: {}, keyword: {}", status, ownerId, keyword);
        
        Page<Content> contentPage = contentRepository.findAllByContentTypeWithFilters(
                ContentType.POST,
                status,
                ownerId,
                keyword,
                pageable
        );
        
        List<PostSummaryResponse> posts = contentPage.getContent().stream()
                .map(contentMapper::contentToPostSummaryResponse)
                .collect(Collectors.toList());
        
        return PageResponse.<PostSummaryResponse>builder()
                .content(posts)
                .totalElements(contentPage.getTotalElements())
                .totalPages(contentPage.getTotalPages())
                .currentPage(contentPage.getNumber())
                .pageSize(contentPage.getSize())
                .last(contentPage.isLast())
                .first(contentPage.isFirst())
                .numberOfElements(contentPage.getNumberOfElements())
                .build();
    }

    @Override
    public PageResponse<QuestionSummaryResponse> getAllQuestions(ContentStatus status, UUID ownerId, String keyword, Pageable pageable) {
        log.info("Getting all questions with filters - status: {}, ownerId: {}, keyword: {}", status, ownerId, keyword);
        
        Page<Content> contentPage = contentRepository.findAllByContentTypeWithFilters(
                ContentType.QUESTION,
                status,
                ownerId,
                keyword,
                pageable
        );
        
        List<QuestionSummaryResponse> questions = contentPage.getContent().stream()
                .map(contentMapper::contentToQuestionSummaryResponse)
                .collect(Collectors.toList());
        
        return PageResponse.<QuestionSummaryResponse>builder()
                .content(questions)
                .totalElements(contentPage.getTotalElements())
                .totalPages(contentPage.getTotalPages())
                .currentPage(contentPage.getNumber())
                .pageSize(contentPage.getSize())
                .last(contentPage.isLast())
                .first(contentPage.isFirst())
                .numberOfElements(contentPage.getNumberOfElements())
                .build();
    }

    @Override
    @Transactional
    public int deleteMultiplePosts(List<UUID> postIds) {
        log.info("Deleting {} posts", postIds.size());
        int deletedCount = 0;
        for (UUID postId : postIds) {
            try {
                postService.deletePost(postId);
                deletedCount++;
            } catch (Exception e) {
                log.warn("Failed to delete post {}: {}", postId, e.getMessage());
            }
        }
        log.info("Successfully deleted {} out of {} posts", deletedCount, postIds.size());
        return deletedCount;
    }

    @Override
    @Transactional
    public int deleteMultipleQuestions(List<UUID> questionIds) {
        log.info("Deleting {} questions", questionIds.size());
        int deletedCount = 0;
        for (UUID questionId : questionIds) {
            try {
                questionService.deleteQuestion(questionId);
                deletedCount++;
            } catch (Exception e) {
                log.warn("Failed to delete question {}: {}", questionId, e.getMessage());
            }
        }
        log.info("Successfully deleted {} out of {} questions", deletedCount, questionIds.size());
        return deletedCount;
    }

    @Override
    @Transactional
    public PostSummaryResponse updatePostStatus(UUID postId, ContentStatus newStatus) {
        log.info("Admin updating post {} status to {}", postId, newStatus);
        
        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        content.setStatus(newStatus);
        content.setUpdatedAt(LocalDateTime.now());
        
        if (newStatus == ContentStatus.PUBLISHED && content.getPublishedAt() == null) {
            content.setPublishedAt(LocalDateTime.now());
        }
        
        Content saved = contentRepository.save(content);
        return contentMapper.contentToPostSummaryResponse(saved);
    }

    @Override
    @Transactional
    public QuestionSummaryResponse updateQuestionStatus(UUID questionId, ContentStatus newStatus) {
        log.info("Admin updating question {} status to {}", questionId, newStatus);
        
        Content content = contentRepository.findByIdAndContentType(questionId, ContentType.QUESTION)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        
        content.setStatus(newStatus);
        content.setUpdatedAt(LocalDateTime.now());
        
        if (newStatus == ContentStatus.PUBLISHED && content.getPublishedAt() == null) {
            content.setPublishedAt(LocalDateTime.now());
        }
        
        Content saved = contentRepository.save(content);
        return contentMapper.contentToQuestionSummaryResponse(saved);
    }
}

package org.example.learniversebe.service.implementation;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.enums.FriendStatus;
import org.example.learniversebe.enums.NotificationType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.mapper.UserMapper;
import org.example.learniversebe.model.Friend;
import org.example.learniversebe.model.User;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.repository.FriendRepository;
import org.example.learniversebe.repository.UserProfileRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IFriendService;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.util.ServiceHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements IFriendService {

    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final INotificationService notificationService;
    private final ServiceHelper serviceHelper;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public Friend sendFriendRequest(UUID recipientId) {
        UUID senderId = serviceHelper.getCurrentUserId();

        validateFriendRequest(senderId, recipientId);

        UUID[] ids = getNormalizedIds(senderId, recipientId);
        Optional<Friend> existingFriendship = friendRepository.findByUserId1AndUserId2(ids[0], ids[1]);

        if (existingFriendship.isPresent()) {
            return handleExistingFriendship(existingFriendship.get(), senderId, recipientId);
        }

        Friend newFriend = createFriendRequest(ids[0], ids[1], senderId);
        sendFriendRequestNotification(recipientId, senderId);

        return newFriend;
    }

    @Override
    @Transactional
    public Friend acceptFriendRequest(UUID senderId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        UUID[] ids = getNormalizedIds(senderId, currentUserId);

        Friend friend = friendRepository.findByUserId1AndUserId2(ids[0], ids[1])
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        validateAcceptRequest(friend, currentUserId);

        friend.setStatus(FriendStatus.ACCEPTED);
        friend.setActionUserId(currentUserId);
        friend.setUpdatedAt(LocalDateTime.now());

        Friend savedFriend = friendRepository.save(friend);

        notificationService.createNotification(
                senderId, currentUserId, NotificationType.FRIEND_ACCEPT,
                "accepted your friend request.", currentUserId, "USER"
        );

        return savedFriend;
    }

    @Override
    @Transactional
    public void declineFriendRequest(UUID senderId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        UUID[] ids = getNormalizedIds(senderId, currentUserId);

        Friend friend = friendRepository.findByUserId1AndUserId2(ids[0], ids[1])
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (friend.getStatus() != FriendStatus.PENDING || friend.getActionUserId().equals(currentUserId)) {
            throw new BadRequestException("Invalid request status for decline.");
        }

        friendRepository.delete(friend);
    }

    @Override
    @Transactional
    public void cancelFriendRequest(UUID recipientId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        UUID[] ids = getNormalizedIds(currentUserId, recipientId);

        Friend friend = friendRepository.findByUserId1AndUserId2(ids[0], ids[1])
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (friend.getStatus() != FriendStatus.PENDING || !friend.getActionUserId().equals(currentUserId)) {
            throw new BadRequestException("Cannot cancel this request.");
        }

        friendRepository.delete(friend);
    }

    @Override
    @Transactional
    public void unfriend(UUID friendId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        UUID[] ids = getNormalizedIds(currentUserId, friendId);

        Friend friend = friendRepository.findByUserId1AndUserId2(ids[0], ids[1])
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        if (friend.getStatus() != FriendStatus.ACCEPTED) {
            throw new BadRequestException("You are not friends with this user.");
        }

        friendRepository.delete(friend);
    }

    @Override
    public List<UserProfileResponse> getFriends() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        List<Friend> acceptedFriends = friendRepository.findAcceptedFriends(currentUserId, FriendStatus.ACCEPTED);

        if (acceptedFriends.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> friendUserIds = extractFriendUserIds(acceptedFriends, currentUserId);
        return getUserProfileResponses(friendUserIds);
    }

    @Override
    public List<UserProfileResponse> getPendingFriendRequests() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        List<Friend> pendingRequests = friendRepository.findPendingRequestsToUser(currentUserId, FriendStatus.PENDING);

        if (pendingRequests.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> senderUserIds = extractFriendUserIds(pendingRequests, currentUserId);
        return getUserProfileResponses(senderUserIds);
    }

    @Override
    public List<UserProfileResponse> getSentFriendRequests() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        List<Friend> sentRequests = friendRepository.findPendingRequestsFromUser(currentUserId, FriendStatus.PENDING);

        if (sentRequests.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> recipientUserIds = extractFriendUserIds(sentRequests, currentUserId);
        return getUserProfileResponses(recipientUserIds);
    }

    @Override
    public List<UserProfileResponse> getSuggestedFriends(int limit) {
        UUID currentUserId = serviceHelper.getCurrentUserId();

        // Lấy tất cả user IDs có quan hệ với current user (friends + pending requests)
        List<UUID> relatedUserIds = friendRepository.findAllRelatedUserIds(
                currentUserId,
                FriendStatus.ACCEPTED,
                FriendStatus.PENDING
        );

        // Thêm chính mình vào danh sách loại trừ
        List<UUID> excludedIds = new ArrayList<>(relatedUserIds);
        excludedIds.add(currentUserId);

        // Lấy random users
        List<User> suggestedUsers;
        if (excludedIds.size() == 1) {
            // Chỉ có mình → dùng query đơn giản hơn
            suggestedUsers = userRepository.findRandomUsersExcludingCurrent(currentUserId, limit);
        } else {
            // Có nhiều IDs cần loại trừ
            suggestedUsers = userRepository.findRandomUsersExcluding(excludedIds, limit);
        }

        if (suggestedUsers.isEmpty()) {
            return Collections.emptyList();
        }

        // Lấy user IDs và map sang UserProfileResponse
        List<UUID> userIds = suggestedUsers.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        return getUserProfileResponses(userIds);
    }

    @Override
    public List<UserProfileResponse> searchFriends(String keyword) {
        UUID currentUserId = serviceHelper.getCurrentUserId();

        // Validate keyword nếu cần (trim, check rỗng...)
        if (keyword == null) keyword = "";
        keyword = keyword.trim();

        List<Object[]> rows =
                userProfileRepository.searchFriendsRaw(currentUserId, keyword);

        return rows.stream()
                .map(this::mapToUserProfileResponse)
                .toList();
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private UUID[] getNormalizedIds(UUID id1, UUID id2) {
        return id1.compareTo(id2) < 0 ? new UUID[]{id1, id2} : new UUID[]{id2, id1};
    }

    private void validateUserExists(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId.toString());
        }
    }

    private void validateFriendRequest(UUID senderId, UUID recipientId) {
        if (senderId.equals(recipientId)) {
            throw new BadRequestException("Cannot send friend request to yourself.");
        }
        validateUserExists(recipientId);
    }

    private Friend handleExistingFriendship(Friend friend, UUID senderId, UUID recipientId) {
        switch (friend.getStatus()) {
            case ACCEPTED:
                throw new BadRequestException("You are already friends.");
            case PENDING:
                if (friend.getActionUserId().equals(senderId)) {
                    throw new BadRequestException("You already sent a request.");
                } else {
                    return acceptFriendRequest(recipientId);
                }
            case BLOCKED:
                throw new BadRequestException("Unable to send friend request.");
            default:
                throw new BadRequestException("Invalid friendship status.");
        }
    }

    private Friend createFriendRequest(UUID userId1, UUID userId2, UUID senderId) {
        Friend newFriend = new Friend();
        newFriend.setUserId1(userId1);
        newFriend.setUserId2(userId2);
        newFriend.setActionUserId(senderId);
        newFriend.setStatus(FriendStatus.PENDING);

        LocalDateTime now = LocalDateTime.now();
        newFriend.setCreatedAt(now);
        newFriend.setUpdatedAt(now);

        return friendRepository.save(newFriend);
    }

    private void sendFriendRequestNotification(UUID recipientId, UUID senderId) {
        notificationService.createNotification(
                recipientId, senderId, NotificationType.FRIEND_REQUEST,
                "sent you a friend request.", senderId, "USER"
        );
    }

    private void validateAcceptRequest(Friend friend, UUID currentUserId) {
        if (friend.getStatus() == FriendStatus.ACCEPTED) {
            throw new BadRequestException("You are already friends.");
        }
        if (friend.getStatus() != FriendStatus.PENDING) {
            throw new BadRequestException("No pending request found.");
        }
        if (friend.getActionUserId().equals(currentUserId)) {
            throw new BadRequestException("You cannot accept your own request.");
        }
    }

    private List<UUID> extractFriendUserIds(List<Friend> friends, UUID currentUserId) {
        return friends.stream()
                .map(f -> f.getUserId1().equals(currentUserId) ? f.getUserId2() : f.getUserId1())
                .collect(Collectors.toList());
    }
    }

    private List<UserProfileResponse> getUserProfileResponses(List<UUID> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Lấy tất cả UserProfiles có sẵn
        List<UserProfile> profiles = userProfileRepository.findByUserIdIn(userIds);
        Map<UUID, UserProfile> profileMap = profiles.stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));

        // Tìm các userId không có profile
        Set<UUID> missingProfileUserIds = userIds.stream()
                .filter(userId -> !profileMap.containsKey(userId))
                .collect(Collectors.toSet());

        // Nếu có user thiếu profile, lấy thông tin từ User entity
        Map<UUID, User> userFallbackMap = new HashMap<>();
        if (!missingProfileUserIds.isEmpty()) {
            List<User> users = userRepository.findAllById(missingProfileUserIds);
            userFallbackMap = users.stream()
                    .collect(Collectors.toMap(User::getId, u -> u));
        }

    private List<UserProfileResponse> getUserProfileResponses(List<UUID> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Lấy tất cả UserProfiles có sẵn
        List<UserProfile> profiles = userProfileRepository.findByUserIdIn(userIds);
        Map<UUID, UserProfile> profileMap = profiles.stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));

        // Tìm các userId không có profile
        Set<UUID> missingProfileUserIds = userIds.stream()
                .filter(userId -> !profileMap.containsKey(userId))
                .collect(Collectors.toSet());

        // Nếu có user thiếu profile, lấy thông tin từ User entity
        Map<UUID, User> userFallbackMap = new HashMap<>();
        if (!missingProfileUserIds.isEmpty()) {
            List<User> users = userRepository.findAllById(missingProfileUserIds);
            userFallbackMap = users.stream()
                    .collect(Collectors.toMap(User::getId, u -> u));
        }

        // Map kết quả với thứ tự ban đầu
        List<UserProfileResponse> responses = new ArrayList<>();
        for (UUID userId : userIds) {
            if (profileMap.containsKey(userId)) {
                // Có UserProfile → dùng mapper bình thường
                responses.add(userMapper.toProfileResponse(profileMap.get(userId)));
            } else if (userFallbackMap.containsKey(userId)) {
                // Không có UserProfile → tạo response từ User
                User user = userFallbackMap.get(userId);
                responses.add(createFallbackProfileResponse(user));
            }
            // Nếu cả User cũng không tồn tại, bỏ qua (không thêm vào list)
        }

        return responses;
        // Map kết quả với thứ tự ban đầu
        List<UserProfileResponse> responses = new ArrayList<>();
        for (UUID userId : userIds) {
            if (profileMap.containsKey(userId)) {
                // Có UserProfile → dùng mapper bình thường
                responses.add(userMapper.toProfileResponse(profileMap.get(userId)));
            } else if (userFallbackMap.containsKey(userId)) {
                // Không có UserProfile → tạo response từ User
                User user = userFallbackMap.get(userId);
                responses.add(createFallbackProfileResponse(user));
            }
            // Nếu cả User cũng không tồn tại, bỏ qua (không thêm vào list)
        }

        return responses;
    }

    private UserProfileResponse createFallbackProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(null);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setDisplayName(user.getUsername());
        response.setAvatarUrl(null);
        response.setCoverUrl(null);
        response.setBio(null);
        response.setPostCount(0);
        response.setAnsweredQuestionCount(0);
        response.setInterestTags(null);
        response.setSkillTags(null);
        return response;
    }

    private UserProfileResponse createFallbackProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(null);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setDisplayName(user.getUsername());
        response.setAvatarUrl(null);
        response.setCoverUrl(null);
        response.setBio(null);
        response.setPostCount(0);
        response.setAnsweredQuestionCount(0);
        response.setInterestTags(null);
        response.setSkillTags(null);
        return response;
    }

    private UserProfileResponse mapToUserProfileResponse(Object[] r) {

        UUID userId = (UUID) r[0];
        String username = (String) r[1];

        UUID profileId = (UUID) r[2];
        String displayName = (String) r[3];
        String bio = (String) r[4];
        String avatarUrl = (String) r[5];
        String coverUrl = (String) r[6];
        Integer postCount = (Integer) r[7];
        Integer answeredCount = (Integer) r[8];

        UserProfileResponse res = new UserProfileResponse();

        res.setUserId(userId);
        res.setUsername(username);

        if (profileId != null) {
            // Có profile
            res.setId(profileId);
            res.setDisplayName(
                    displayName != null ? displayName : username
            );
            res.setBio(bio);
            res.setAvatarUrl(avatarUrl);
            res.setCoverUrl(coverUrl);
            res.setPostCount(postCount != null ? postCount : 0);
            res.setAnsweredQuestionCount(
                    answeredCount != null ? answeredCount : 0
            );

            // TODO: load tags nếu cần
            res.setInterestTags(List.of());
            res.setSkillTags(List.of());

        } else {
            // Không có profile
            res.setId(null);
            res.setDisplayName(username);
            res.setBio(null);
            res.setAvatarUrl(null);
            res.setCoverUrl(null);
            res.setPostCount(0);
            res.setAnsweredQuestionCount(0);
            res.setInterestTags(List.of());
            res.setSkillTags(List.of());
        }

        // role nếu cần → lấy từ user
        // res.setRole(...)

        return res;
    }

}
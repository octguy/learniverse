package org.example.learniversebe.service.implementation;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.enums.FriendStatus;
import org.example.learniversebe.enums.NotificationType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.mapper.UserMapper;
import org.example.learniversebe.model.Friend;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.repository.FriendRepository;
import org.example.learniversebe.repository.UserProfileRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IFriendService;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.util.ServiceHelper;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements IFriendService {

    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final INotificationService notificationService;
    private final ServiceHelper serviceHelper;
    private final UserMapper userMapper;

    // Helper: Normalize IDs để luôn lưu userId1 < userId2
    private UUID[] getNormalizedIds(UUID id1, UUID id2) {
        if (id1.compareTo(id2) < 0) {
            return new UUID[]{id1, id2};
        } else {
            return new UUID[]{id2, id1};
        }
    }

    private void validateUserExists(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId.toString());
        }
    }

    // UC5.1: Gửi yêu cầu kết bạn
    @Override
    @Transactional
    public Friend sendFriendRequest(UUID recipientId) {
        UUID senderId = serviceHelper.getCurrentUserId();

        if (senderId.equals(recipientId)) {
            throw new BadRequestException("Cannot send friend request to yourself.");
        }
        validateUserExists(recipientId);

        UUID[] ids = getNormalizedIds(senderId, recipientId);
        Optional<Friend> existingFriendship = friendRepository.findByUserId1AndUserId2(ids[0], ids[1]);

        if (existingFriendship.isPresent()) {
            Friend friend = existingFriendship.get();
            if (friend.getStatus() == FriendStatus.ACCEPTED) {
                throw new BadRequestException("You are already friends.");
            }
            if (friend.getStatus() == FriendStatus.PENDING) {
                if (friend.getActionUserId().equals(senderId)) {
                    throw new BadRequestException("You already sent a request.");
                } else {
                    // Nếu đối phương đã gửi request cho mình -> Tự động chấp nhận (Edge case)
                    return acceptFriendRequest(recipientId); // Gọi hàm accept logic
                }
            }
            if (friend.getStatus() == FriendStatus.BLOCKED) {
                throw new BadRequestException("Unable to send friend request.");
            }
        }

        // Tạo mới request
        Friend newFriend = new Friend();
        newFriend.setUserId1(ids[0]);
        newFriend.setUserId2(ids[1]);
        newFriend.setActionUserId(senderId);
        newFriend.setStatus(FriendStatus.PENDING);
        Friend savedFriend = friendRepository.save(newFriend);

        // Gửi thông báo
        notificationService.createNotification(
                recipientId, senderId, NotificationType.FRIEND_REQUEST,
                "sent you a friend request.", senderId, "USER"
        );

        return savedFriend;
    }

    // UC5.2 (Accept): Chấp nhận yêu cầu
    @Override
    @Transactional
    public Friend acceptFriendRequest(UUID senderId) { // senderId ở đây là người đã gửi request cho mình
        UUID currentUserId = serviceHelper.getCurrentUserId();

        UUID[] ids = getNormalizedIds(senderId, currentUserId);
        Friend friend = friendRepository.findByUserId1AndUserId2(ids[0], ids[1])
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        // Kiểm tra logic
        if (friend.getStatus() == FriendStatus.ACCEPTED) {
            throw new BadRequestException("You are already friends.");
        }
        if (friend.getStatus() != FriendStatus.PENDING) {
            throw new BadRequestException("No pending request found.");
        }
        // Chỉ người nhận (không phải actionUserId) mới được accept
        if (friend.getActionUserId().equals(currentUserId)) {
            throw new BadRequestException("You cannot accept your own request.");
        }

        friend.setStatus(FriendStatus.ACCEPTED);
        friend.setActionUserId(currentUserId); // Cập nhật người hành động cuối cùng
        Friend savedFriend = friendRepository.save(friend);

        // Gửi thông báo cho người đã gửi request
        notificationService.createNotification(
                senderId, currentUserId, NotificationType.FRIEND_ACCEPT,
                "accepted your friend request.", currentUserId, "USER"
        );

        return savedFriend;
    }

    // UC5.2 (Decline): Từ chối yêu cầu -> Xóa bản ghi
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

        // Xóa cứng bản ghi để sau này có thể gửi lại, hoặc update status = DECLINED tùy nghiệp vụ
        friendRepository.delete(friend);
    }

    // UC5.4: Hủy yêu cầu đã gửi
    @Override
    @Transactional
    public void cancelFriendRequest(UUID recipientId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        UUID[] ids = getNormalizedIds(currentUserId, recipientId);

        Friend friend = friendRepository.findByUserId1AndUserId2(ids[0], ids[1])
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        // Chỉ hủy được khi đang Pending và mình là người gửi (actionUserId == currentUserId)
        if (friend.getStatus() == FriendStatus.PENDING && friend.getActionUserId().equals(currentUserId)) {
            friendRepository.delete(friend);
        } else {
            throw new BadRequestException("Cannot cancel this request.");
        }
    }

    // UC5.5: Hủy kết bạn (Unfriend)
    @Override
    @Transactional
    public void unfriend(UUID friendId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        UUID[] ids = getNormalizedIds(currentUserId, friendId);

        Friend friend = friendRepository.findByUserId1AndUserId2(ids[0], ids[1])
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        if (friend.getStatus() == FriendStatus.ACCEPTED) {
            friendRepository.delete(friend);
        } else {
            throw new BadRequestException("You are not friends with this user.");
        }
    }

    // UC5.3: Lấy danh sách bạn bè
    @Override
    public List<UserProfileResponse> getFriends() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        List<Friend> acceptedFriends = friendRepository.findAcceptedFriends(currentUserId);

        if (acceptedFriends.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> friendIds = acceptedFriends.stream()
                .map(f -> f.getUserId1().equals(currentUserId) ? f.getUserId2() : f.getUserId1())
                .collect(Collectors.toList());

        List<UserProfile> profiles = userProfileRepository.findAllById(friendIds);
        return profiles.stream().map(userMapper::toProfileResponse).collect(Collectors.toList());
    }

    // Lấy danh sách lời mời kết bạn (người khác gửi cho mình)
    @Override
    public List<UserProfileResponse> getPendingFriendRequests() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        List<Friend> pendingRequests = friendRepository.findPendingRequestsToUser(currentUserId);

        if (pendingRequests.isEmpty()) {
            return Collections.emptyList();
        }

        // Lấy ID người gửi (người không phải là currentUserId)
        List<UUID> senderIds = pendingRequests.stream()
                .map(f -> f.getUserId1().equals(currentUserId) ? f.getUserId2() : f.getUserId1())
                .collect(Collectors.toList());

        List<UserProfile> profiles = userProfileRepository.findAllById(senderIds);
        return profiles.stream().map(userMapper::toProfileResponse).collect(Collectors.toList());
    }

    // Lấy danh sách lời mời mình đã gửi (để hiển thị UI "Đã gửi")
    @Override
    public List<UserProfileResponse> getSentFriendRequests() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        List<Friend> sentRequests = friendRepository.findPendingRequestsFromUser(currentUserId);

        if (sentRequests.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> recipientIds = sentRequests.stream()
                .map(f -> f.getUserId1().equals(currentUserId) ? f.getUserId2() : f.getUserId1())
                .collect(Collectors.toList());

        List<UserProfile> profiles = userProfileRepository.findAllById(recipientIds);
        return profiles.stream().map(userMapper::toProfileResponse).collect(Collectors.toList());
    }
}
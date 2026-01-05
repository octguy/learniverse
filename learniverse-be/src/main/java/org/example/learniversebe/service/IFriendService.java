package org.example.learniversebe.service;

import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.model.Friend;
import java.util.List;
import java.util.UUID;

public interface IFriendService {
    Friend sendFriendRequest(UUID recipientId);
    Friend acceptFriendRequest(UUID senderId);
    void declineFriendRequest(UUID senderId);
    void cancelFriendRequest(UUID recipientId);
    void unfriend(UUID friendId);

    List<UserProfileResponse> getFriends();
    List<UserProfileResponse> getPendingFriendRequests(); // Received
    List<UserProfileResponse> getSentFriendRequests();    // Sent
    List<UserProfileResponse> getSuggestedFriends(int limit); // Suggest friend

    List<UserProfileResponse> searchFriends(String keyword);
}
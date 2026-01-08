package org.example.learniversebe.repository;

import org.example.learniversebe.enums.GroupJoinRequestStatus;
import org.example.learniversebe.model.GroupJoinRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupJoinRequestRepository extends JpaRepository<GroupJoinRequest, UUID> {

    // Find pending request for user
    Optional<GroupJoinRequest> findByGroupIdAndUserIdAndStatus(UUID groupId, UUID userId, GroupJoinRequestStatus status);

    // Check if user has pending request
    boolean existsByGroupIdAndUserIdAndStatus(UUID groupId, UUID userId, GroupJoinRequestStatus status);

    // Get all pending requests for a group
    Page<GroupJoinRequest> findByGroupIdAndStatus(UUID groupId, GroupJoinRequestStatus status, Pageable pageable);

    // Get requests by user
    Page<GroupJoinRequest> findByUserId(UUID userId, Pageable pageable);

    // Delete all requests for a group (for group deletion)
    void deleteAllByGroupId(UUID groupId);
}

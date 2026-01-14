package org.example.learniversebe.repository;

import org.example.learniversebe.enums.GroupMemberRole;
import org.example.learniversebe.model.GroupMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    // Find member by group and user
    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);

    // Check if user is member of group
    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);

    // Check if user is member and not banned
    boolean existsByGroupIdAndUserIdAndIsBannedFalse(UUID groupId, UUID userId);

    // Get all members of a group
    Page<GroupMember> findByGroupId(UUID groupId, Pageable pageable);

    // Get all groups for a user (my groups)
    @Query("SELECT gm FROM GroupMember gm WHERE gm.user.id = :userId AND gm.isBanned = false")
    Page<GroupMember> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    // Get members by role
    List<GroupMember> findByGroupIdAndRole(UUID groupId, GroupMemberRole role);

    // Count members in group (excluding banned)
    long countByGroupIdAndIsBannedFalse(UUID groupId);

    // Find first member by role (e.g., owner)
    Optional<GroupMember> findFirstByGroupIdAndRole(UUID groupId, GroupMemberRole role);

    // Find member including soft-deleted (for rejoin check)
    @Query(value = "SELECT * FROM group_members WHERE group_id = :groupId AND user_id = :userId", nativeQuery = true)
    Optional<GroupMember> findByGroupIdAndUserIdIncludeDeleted(@Param("groupId") UUID groupId, @Param("userId") UUID userId);

    // Delete all members of a group (for group deletion)
    void deleteAllByGroupId(UUID groupId);


    /**
     * Check if user is member of group (not banned)
     */
    @Query("SELECT COUNT(gm) > 0 FROM GroupMember gm " +
            "WHERE gm.group.id = :groupId " +
            "AND gm.user.id = :userId " +
            "AND gm.isBanned = false " +
            "AND gm.deletedAt IS NULL")
    boolean isUserMemberOfGroup(@Param("userId") UUID userId, @Param("groupId") UUID groupId);
}

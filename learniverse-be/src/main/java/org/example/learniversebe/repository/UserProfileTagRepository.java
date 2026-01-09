package org.example.learniversebe.repository;

import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.model.UserProfileTag;
import org.example.learniversebe.model.composite_key.UserProfileTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserProfileTagRepository extends JpaRepository<UserProfileTag, UserProfileTagId> {
    List<UserProfileTag> findAllByUserProfileId(UUID userProfileId);
    void deleteByUserProfileId(UUID userProfileId);

    void deleteAllByUserProfile(UserProfile profile);

    // Count how many user profiles are using this tag
    @Query("SELECT COUNT(upt) FROM UserProfileTag upt WHERE upt.userProfileTagId.tagId = :tagId AND upt.deletedAt IS NULL")
    long countByTagId(@Param("tagId") UUID tagId);

    // Soft delete all UserProfileTag records by tag ID
    @Modifying
    @Query("UPDATE UserProfileTag upt SET upt.deletedAt = CURRENT_TIMESTAMP WHERE upt.userProfileTagId.tagId = :tagId AND upt.deletedAt IS NULL")
    void softDeleteByTagId(@Param("tagId") UUID tagId);
}

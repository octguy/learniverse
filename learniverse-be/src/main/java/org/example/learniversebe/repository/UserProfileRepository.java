package org.example.learniversebe.repository;

import org.example.learniversebe.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    UserProfile findByUserId(UUID userId);
    @Query("SELECT up FROM UserProfile up WHERE up.user.id IN :userIds")
    List<UserProfile> findByUserIdIn(@Param("userIds") List<UUID> userIds);
}

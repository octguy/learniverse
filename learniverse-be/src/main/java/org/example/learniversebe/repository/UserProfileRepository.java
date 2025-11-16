package org.example.learniversebe.repository;

import org.example.learniversebe.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    UserProfile findByUserId(UUID userId);
}

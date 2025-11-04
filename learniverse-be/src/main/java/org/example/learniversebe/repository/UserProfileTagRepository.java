package org.example.learniversebe.repository;

import org.example.learniversebe.model.UserProfileTag;
import org.example.learniversebe.model.composite_key.UserProfileTagId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserProfileTagRepository extends JpaRepository<UserProfileTag, UserProfileTagId> {
    List<UserProfileTag> findAllByUserProfileId(UUID userProfileId);
    void deleteByUserProfileId(UUID userProfileId);
}

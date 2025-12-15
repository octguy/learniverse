package org.example.learniversebe.repository;

import org.example.learniversebe.model.UserTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserTagRepository extends JpaRepository<UserTag, UUID> {
    UserTag findByName(String name);
    boolean existsByName(String name);
}

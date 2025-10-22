package org.example.learniversebe.repository;

import org.example.learniversebe.model.RoleUser;
import org.example.learniversebe.model.composite_key.RoleUserId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleUserRepository extends JpaRepository<RoleUser, RoleUserId> {
}

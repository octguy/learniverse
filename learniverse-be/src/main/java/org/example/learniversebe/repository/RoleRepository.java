package org.example.learniversebe.repository;

import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(UserRole name);
}

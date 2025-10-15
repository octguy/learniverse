package org.example.learniversebe.repository;

import org.example.learniversebe.model.AuthCredential;
import org.example.learniversebe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuthCredentialRepository extends JpaRepository<AuthCredential, UUID> {

    Optional<AuthCredential> findByUser(User user);
}

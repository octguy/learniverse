package org.example.learniversebe.repository;

import org.example.learniversebe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    @Query(value = "select * from \"user\" where status = 'PENDING_VERIFICATION' and created_at + INTERVAL '24 hours' <= NOW();", nativeQuery = true)
    List<User> findPendingUserExceedOneDay();
}

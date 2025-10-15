package org.example.learniversebe.repository;

import org.example.learniversebe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    // eager fetch roles with user, to avoid lazy loading issues (default fetch type for @ManyToMany is LAZY)
    @Query("select u from User u left join fetch u.roleUsers ru left join fetch ru.role where u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    Boolean existsByEmail(String email);

    @Query(value = "select * from \"user\" where status = 'PENDING_VERIFICATION' and created_at + INTERVAL '24 hours' <= NOW();", nativeQuery = true)
    List<User> findPendingUserExceedOneDay();
}

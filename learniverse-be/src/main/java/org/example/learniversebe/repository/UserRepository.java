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

    Boolean existsByUsername(String username);

    @Query(value = "select * from \"user\" where status = 'PENDING_VERIFICATION' and created_at + INTERVAL '24 hours' <= NOW();", nativeQuery = true)
    List<User> findPendingUserExceedOneDay();

    // Lấy random users, loại trừ danh sách IDs cho trước
    @Query(value = "SELECT * FROM \"user\" u " +
            "WHERE u.id NOT IN :excludedIds " +
            "AND u.deleted_at IS NULL " +
            "ORDER BY RANDOM() " +
            "LIMIT :limit",
            nativeQuery = true)
    List<User> findRandomUsersExcluding(@Param("excludedIds") List<UUID> excludedIds,
                                        @Param("limit") int limit);

    // Trường hợp không có excludedIds (chỉ loại trừ chính mình)
    @Query(value = "SELECT * FROM \"user\" u " +
            "WHERE u.id <> :currentUserId " +
            "AND u.deleted_at IS NULL " +
            "ORDER BY RANDOM() " +
            "LIMIT :limit",
            nativeQuery = true)
    List<User> findRandomUsersExcludingCurrent(@Param("currentUserId") UUID currentUserId,
                                               @Param("limit") int limit);
}

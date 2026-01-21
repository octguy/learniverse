package org.example.learniversebe.repository;

import org.example.learniversebe.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    // Dashboard queries
    @Query(value = "SELECT COUNT(*) FROM \"user\" WHERE deleted_at IS NULL AND created_at >= :startOfDay AND created_at < :endOfDay", nativeQuery = true)
    long countNewUsersInRange(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query(value = """
            SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as label, COUNT(*) as count
            FROM "user"
            WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> findUserGrowthByDay();

    @Query(value = """
            SELECT TO_CHAR(created_at, 'YYYY-MM') as label, COUNT(*) as count
            FROM "user"
            WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> findUserGrowthByMonth();

    @Query(value = """
            SELECT TO_CHAR(created_at, 'YYYY') as label, COUNT(*) as count
            FROM "user"
            WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '5 years'
            GROUP BY TO_CHAR(created_at, 'YYYY')
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> findUserGrowthByYear();

    /**
     * Search users by email or username with pagination
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchByEmailOrUsername(@Param("search") String search, Pageable pageable);

    /**
     * Find user by ID with roles eagerly fetched
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roleUsers ru LEFT JOIN FETCH ru.role WHERE u.id = :userId")
    Optional<User> findByIdWithRoles(@Param("userId") UUID userId);

    /**
     * Find all users with ADMIN or MODERATOR roles for auto-flag notifications
     */
    @Query("SELECT DISTINCT u FROM User u JOIN u.roleUsers ru JOIN ru.role r WHERE r.name IN ('ROLE_ADMIN', 'ROLE_MODERATOR') AND u.deletedAt IS NULL")
    List<User> findAllModeratorsAndAdmins();
}

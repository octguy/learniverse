package org.example.learniversebe.repository;

import org.example.learniversebe.model.User;
import org.example.learniversebe.model.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    UserProfile findByUserId(UUID userId);
    @Query("SELECT up FROM UserProfile up WHERE up.user.id IN :userIds")
    List<UserProfile> findByUserIdIn(@Param("userIds") List<UUID> userIds);

    @Query(value = """
    SELECT DISTINCT
        u.id             AS user_id,
        u.username       AS username,
        up.id            AS profile_id,
        up.display_name  AS display_name,
        up.bio           AS bio,
        up.avatar_url    AS avatar_url,
        up.cover_url     AS cover_url,
        up.post_count    AS post_count,
        up.answered_question_count AS answered_question_count
    FROM friend f
    JOIN "user" u
      ON (
           (f.user_id_1 = :currentUserId AND u.id = f.user_id_2)
        OR (f.user_id_2 = :currentUserId AND u.id = f.user_id_1)
      )
    LEFT JOIN user_profile up
      ON up.user_id = u.id
    WHERE f.status = 'ACCEPTED'
      AND (
            (up.id IS NOT NULL AND up.display_name IS NOT NULL\s
                AND LOWER(up.display_name) LIKE LOWER(CONCAT('%', :keyword, '%')))
         OR (up.id IS NOT NULL AND up.display_name IS NULL
                AND LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')))
         OR (up.id IS NULL
                AND LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')))
      )
    """, nativeQuery = true)
    Page<Object[]> searchFriendsRaw(
            @Param("currentUserId") UUID currentUserId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

@Query("""
SELECT DISTINCT u
FROM User u
LEFT JOIN u.userProfile up
WHERE u.deletedAt IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM RoleUser ru
      JOIN ru.role r
      WHERE ru.user = u
        AND r.name = 'ADMIN'
  )
  AND (
        (up IS NOT NULL
        AND LOWER(up.displayName) LIKE LOWER(CONCAT('%', :search, '%')))
     OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
  )
""")
    Page<User> searchUserExcludeAdmin(
            @Param("search") String search,
            Pageable pageable
    );


}

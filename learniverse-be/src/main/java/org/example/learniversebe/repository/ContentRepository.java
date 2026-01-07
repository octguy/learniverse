package org.example.learniversebe.repository;

import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.model.Content;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentRepository extends JpaRepository<Content, UUID> {

    /**
     * Find by content types and status (exclude soft deleted)
     */
    @Query("SELECT DISTINCT c FROM Content c " +
            "LEFT JOIN FETCH c.author a " +
            "LEFT JOIN FETCH a.userProfile " +
            "WHERE c.contentType IN :types " +
            "AND c.status = :status " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.publishedAt DESC")
    Page<Content> findByContentTypeInAndStatus(
            @Param("types") List<ContentType> types,
            @Param("status") ContentStatus status,
            Pageable pageable);

    /**
     * Find by ID and content type (exclude soft deleted)
     */
    @Query("SELECT c FROM Content c WHERE c.id = :id AND c.contentType = :type AND c.deletedAt IS NULL")
    Optional<Content> findByIdAndContentType(
            @Param("id") UUID id,
            @Param("type") ContentType type);

    Optional<Content> findByIdAndContentTypeAndStatus(UUID postId, ContentType contentType, ContentStatus contentStatus);

    /**
     * Find by slug, content type and status (exclude soft deleted)
     */
    @Query("SELECT c FROM Content c WHERE c.slug = :slug " +
            "AND c.contentType = :type " +
            "AND c.status = :status " +
            "AND c.deletedAt IS NULL")
    Optional<Content> findBySlugAndContentTypeAndStatus(
            @Param("slug") String slug,
            @Param("type") ContentType type,
            @Param("status") ContentStatus status);

    /**
     * Find published posts by tag ID
     */
    @Query("SELECT DISTINCT c FROM Content c " +
            "LEFT JOIN FETCH c.author a " +
            "LEFT JOIN FETCH a.userProfile " +
            "JOIN c.contentTags ct " +
            "WHERE ct.tag.id = :tagId " +
            "AND c.contentType = 'POST' " +
            "AND c.status = 'PUBLISHED' " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.publishedAt DESC")
    Page<Content> findPublishedPostsByTagId(
            @Param("tagId") UUID tagId,
            Pageable pageable);

    /**
     * Full-text search for published posts
     */
    @Query("SELECT DISTINCT c FROM Content c " +
            "LEFT JOIN FETCH c.author a " +
            "LEFT JOIN FETCH a.userProfile " +
            "WHERE (LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(c.body) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND c.contentType = 'POST' " +
            "AND c.status = 'PUBLISHED' " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.publishedAt DESC")
    Page<Content> searchPublishedPosts(
            @Param("query") String query,
            Pageable pageable);

    /**
     * Find by author, content types and status (sorted by published date)
     */
    @Query("SELECT DISTINCT c FROM Content c " +
            "LEFT JOIN FETCH c.author a " +
            "LEFT JOIN FETCH a.userProfile " +
            "WHERE c.author.id = :authorId " +
            "AND c.contentType IN :types " +
            "AND c.status = :status " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.publishedAt DESC")
    Page<Content> findByAuthorIdAndContentTypeInAndStatusOrderByPublishedAtDesc(
            @Param("authorId") UUID authorId,
            @Param("types") List<ContentType> types,
            @Param("status") ContentStatus status,
            Pageable pageable);


    @Query("SELECT c FROM Content c JOIN c.contentTags ct WHERE c.contentType = 'QUESTION' AND c.status = 'PUBLISHED' AND ct.tag.id = :tagId")
    Page<Content> findPublishedQuestionsByTagId(@Param("tagId") UUID tagId, Pageable pageable);

    @Query(value = "SELECT * FROM contents c WHERE c.deleted_at IS NULL AND c.content_type = 'QUESTION' AND c.status = 'PUBLISHED' AND c.search_vector @@ plainto_tsquery('simple', :query)",
            countQuery = "SELECT count(*) FROM contents c WHERE c.deleted_at IS NULL AND c.content_type = 'QUESTION' AND c.status = 'PUBLISHED' AND c.search_vector @@ plainto_tsquery('simple', :query)",
            nativeQuery = true)
    Page<Content> searchPublishedQuestions(@Param("query") String query, Pageable pageable);

    /**
     * Check if content exists (exclude soft deleted)
     */
    @Query("SELECT COUNT(c) > 0 FROM Content c WHERE c.id = :id AND c.deletedAt IS NULL")
    boolean existsById(@Param("id") UUID id);

    boolean existsByIdAndContentType(UUID questionId, ContentType contentType);

    long countByContentType(ContentType contentType);

    @Query(value = """
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM-DD') as label,
                SUM(CASE WHEN content_type = 'POST' THEN 1 ELSE 0 END) as post_count,
                SUM(CASE WHEN content_type = 'QUESTION' THEN 1 ELSE 0 END) as question_count
            FROM contents
            WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> findContentComparisonByDay();

    @Query(value = """
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as label,
                SUM(CASE WHEN content_type = 'POST' THEN 1 ELSE 0 END) as post_count,
                SUM(CASE WHEN content_type = 'QUESTION' THEN 1 ELSE 0 END) as question_count
            FROM contents
            WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> findContentComparisonByMonth();

    @Query(value = """
            SELECT 
                TO_CHAR(created_at, 'YYYY') as label,
                SUM(CASE WHEN content_type = 'POST' THEN 1 ELSE 0 END) as post_count,
                SUM(CASE WHEN content_type = 'QUESTION' THEN 1 ELSE 0 END) as question_count
            FROM contents
            WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '5 years'
            GROUP BY TO_CHAR(created_at, 'YYYY')
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> findContentComparisonByYear();

    /**
     * Find by author, content type and status (sorted by updated date)
     */
    @Query("SELECT DISTINCT c FROM Content c " +
            "LEFT JOIN FETCH c.author a " +
            "LEFT JOIN FETCH a.userProfile " +
            "WHERE c.author.id = :authorId " +
            "AND c.contentType = :type " +
            "AND c.status = :status " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.updatedAt DESC")
    Page<Content> findByAuthorIdAndContentTypeAndStatusOrderByUpdatedAtDesc(
            @Param("authorId") UUID authorId,
            @Param("type") ContentType type,
            @Param("status") ContentStatus status,
            Pageable pageable);

    Page<Content> findByContentTypeAndStatus(ContentType contentType, ContentStatus status, Pageable pageable);

    Page<Content> findByAuthorIdAndContentTypeAndStatusOrderByPublishedAtDesc(UUID authorId, ContentType contentType, ContentStatus status, Pageable pageable);

    /**
     * Find by author, content types and status (sorted by updated date)
     */
    /**
     * Find by author, content types and status (sorted by updated date)
     * JOIN FETCH userProfile to avoid N+1 query
     */
    @Query("SELECT DISTINCT c FROM Content c " +
            "LEFT JOIN FETCH c.author a " +
            "LEFT JOIN FETCH a.userProfile " +
            "WHERE c.author.id = :authorId " +
            "AND c.contentType IN :types " +
            "AND c.status = :status " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.updatedAt DESC")
    Page<Content> findByAuthorIdAndContentTypeInAndStatusOrderByUpdatedAtDesc(
            @Param("authorId") UUID authorId,
            @Param("types") List<ContentType> types,
            @Param("status") ContentStatus status,
            Pageable pageable);

    // ==================== SOFT DELETE METHODS ====================

    /**
     * Soft delete content by ID
     * Set deleted_at = CURRENT_TIMESTAMP
     */
    @Modifying
    @Query("UPDATE Content c SET c.deletedAt = CURRENT_TIMESTAMP, c.updatedAt = CURRENT_TIMESTAMP " +
            "WHERE c.id = :contentId AND c.deletedAt IS NULL")
    int softDeleteById(@Param("contentId") UUID contentId);

    /**
     * Soft delete all content by author
     */
    @Modifying
    @Query("UPDATE Content c SET c.deletedAt = CURRENT_TIMESTAMP, c.updatedAt = CURRENT_TIMESTAMP " +
            "WHERE c.author.id = :authorId AND c.deletedAt IS NULL")
    int softDeleteByAuthorId(@Param("authorId") UUID authorId);

    /**
     * Find by ID (exclude soft deleted)
     */
    @Query("SELECT c FROM Content c WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Content> findById(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Content c SET c.deletedAt = CURRENT_TIMESTAMP, c.updatedAt = CURRENT_TIMESTAMP " +
            "WHERE c.originalContent.id = :originalId AND c.deletedAt IS NULL")
    void softDeleteSharedPosts(@Param("originalId") UUID originalId);

    // ==================== STATISTICS ====================

    /**
     * Count content by author and status (exclude soft deleted)
     */
    @Query("SELECT COUNT(c) FROM Content c WHERE c.author.id = :authorId " +
            "AND c.status = :status " +
            "AND c.deletedAt IS NULL")
    long countByAuthorIdAndStatus(
            @Param("authorId") UUID authorId,
            @Param("status") ContentStatus status);

    /**
     * Count content by type and status (exclude soft deleted)
     */
    @Query("SELECT COUNT(c) FROM Content c WHERE c.contentType = :type " +
            "AND c.status = :status " +
            "AND c.deletedAt IS NULL")
    long countByContentTypeAndStatus(
            @Param("type") ContentType type,
            @Param("status") ContentStatus status);
}

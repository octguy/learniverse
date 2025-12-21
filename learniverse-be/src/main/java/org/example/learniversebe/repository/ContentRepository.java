package org.example.learniversebe.repository;

import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.model.Content;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentRepository extends JpaRepository<Content, UUID> {

    Page<Content> findByContentTypeAndStatus(ContentType contentType, ContentStatus contentStatus, Pageable pageable);

    Page<Content> findByContentTypeOrderByCreatedAtDesc(ContentType contentType, Pageable pageable);

    Page<Content> findByAuthorIdAndContentTypeOrderByCreatedAtDesc(UUID authorId, ContentType contentType, Pageable pageable);

    Optional<Content> findBySlug(String slug);

    @Query("SELECT c FROM Content c JOIN FETCH c.author WHERE c.id = :id")
    Optional<Content> findByIdWithAuthor(@Param("id") UUID id);

    // Query để tìm kiếm (sử dụng function của PostgreSQL)
    @Query(value = "SELECT * FROM contents c WHERE c.deleted_at IS NULL AND c.search_vector @@ plainto_tsquery('simple', :query)",
            countQuery = "SELECT count(*) FROM contents c WHERE c.deleted_at IS NULL AND c.search_vector @@ plainto_tsquery('simple', :query)",
            nativeQuery = true)
    Page<Content> searchByQuery(@Param("query") String query, Pageable pageable);

    Optional<Content> findByIdAndContentType(UUID postId, ContentType contentType);

    Optional<Content> findByIdAndContentTypeAndStatus(UUID postId, ContentType contentType, ContentStatus contentStatus);

    Optional<Content> findBySlugAndContentTypeAndStatus(String slug, ContentType contentType, ContentStatus contentStatus);

    @Query("SELECT c FROM Content c JOIN c.contentTags ct WHERE c.contentType = 'POST' AND c.status = 'PUBLISHED' AND ct.tag.id = :tagId")
    Page<Content> findPublishedPostsByTagId(@Param("tagId") UUID tagId, Pageable pageable);

    @Query(value = "SELECT * FROM contents c WHERE c.deleted_at IS NULL AND c.content_type = 'POST' AND c.status = 'PUBLISHED' AND c.search_vector @@ plainto_tsquery('simple', :query)",
            countQuery = "SELECT count(*) FROM contents c WHERE c.deleted_at IS NULL AND c.content_type = 'POST' AND c.status = 'PUBLISHED' AND c.search_vector @@ plainto_tsquery('simple', :query)",
            nativeQuery = true)
    Page<Content> searchPublishedPosts(@Param("query") String query, Pageable pageable);

    Page<Content> findByAuthorIdAndContentTypeAndStatusOrderByPublishedAtDesc(UUID authorId, ContentType contentType, ContentStatus contentStatus, Pageable pageable);

    Page<Content> findByContentTypeAndStatusOrderByPublishedAtDesc(ContentType contentType, ContentStatus contentStatus, Pageable pageable);

    @Query("SELECT c FROM Content c JOIN c.contentTags ct WHERE c.contentType = 'QUESTION' AND c.status = 'PUBLISHED' AND ct.tag.id = :tagId")
    Page<Content> findPublishedQuestionsByTagId(@Param("tagId") UUID tagId, Pageable pageable);

    @Query(value = "SELECT * FROM contents c WHERE c.deleted_at IS NULL AND c.content_type = 'QUESTION' AND c.status = 'PUBLISHED' AND c.search_vector @@ plainto_tsquery('simple', :query)",
            countQuery = "SELECT count(*) FROM contents c WHERE c.deleted_at IS NULL AND c.content_type = 'QUESTION' AND c.status = 'PUBLISHED' AND c.search_vector @@ plainto_tsquery('simple', :query)",
            nativeQuery = true)
    Page<Content> searchPublishedQuestions(@Param("query") String query, Pageable pageable);

    Page<Content> findByContentType(ContentType contentType, Pageable pageable);

    boolean existsByIdAndContentType(UUID questionId, ContentType contentType);
}

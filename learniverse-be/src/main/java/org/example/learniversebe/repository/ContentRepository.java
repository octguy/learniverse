package org.example.learniversebe.repository;

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
}

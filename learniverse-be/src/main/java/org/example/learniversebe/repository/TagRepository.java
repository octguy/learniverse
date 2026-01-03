package org.example.learniversebe.repository;

import org.example.learniversebe.model.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {
    Optional<Tag> findByName(String name);
    Optional<Tag> findBySlug(String slug);

    /**
     * Kiểm tra xem tag có tồn tại bằng tên (không phân biệt hoa thường).
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Tìm kiếm tag theo tên (không phân biệt hoa thường, chứa chuỗi) và phân trang.
     * Dùng để gợi ý/tìm kiếm tag.
     */
    Page<Tag> findByNameContainingIgnoreCase(String name, Pageable pageable);

    /**
     * Get top 5 most used tags by content count
     */
    @Query(value = """
            SELECT t.id, t.name, t.slug, COUNT(ct.tag_id) as usage_count
            FROM tags t
            JOIN content_tag ct ON t.id = ct.tag_id
            WHERE t.deleted_at IS NULL
            GROUP BY t.id, t.name, t.slug
            ORDER BY usage_count DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findTop5MostUsedTags();
}

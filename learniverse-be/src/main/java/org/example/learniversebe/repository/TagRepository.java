package org.example.learniversebe.repository;

import org.example.learniversebe.model.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}

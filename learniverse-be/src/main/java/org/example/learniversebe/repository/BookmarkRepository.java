package org.example.learniversebe.repository;

import org.example.learniversebe.model.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, UUID> {

    // Tìm bookmark của user cho một content cụ thể
    Optional<Bookmark> findByUserIdAndContentId(UUID userId, UUID contentId);

    // Lấy danh sách bookmark của user (có phân trang)
    Page<Bookmark> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // Đếm số bookmark của user
    long countByUserId(UUID userId);

    // Đếm số lượt bookmark cho một content
    long countByContentId(UUID contentId);
}

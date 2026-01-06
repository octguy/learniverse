package org.example.learniversebe.repository;

import org.example.learniversebe.model.ContentTag;
import org.example.learniversebe.model.composite_key.ContentTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContentTagRepository extends JpaRepository<ContentTag, ContentTagId> {

    // Tìm tất cả ContentTag cho một Content ID
    List<ContentTag> findByContentId(UUID contentId);

    // Tìm tất cả ContentTag cho một Tag ID
    List<ContentTag> findByTagId(UUID tagId);

    // Xóa tất cả các tag khỏi một content (ví dụ khi cập nhật post)
    @Modifying // Cần thiết cho các query UPDATE/DELETE
    @Query("DELETE FROM ContentTag ct WHERE ct.contentTagId.contentId = :contentId")
    void deleteByContentId(@Param("contentId") UUID contentId);

    // Đếm số lượng bài viết cho một tag (ví dụ)
    long countByTagId(UUID tagId);

    // Soft delete all ContentTag records by tag ID
    @Modifying
    @Query("UPDATE ContentTag ct SET ct.deletedAt = CURRENT_TIMESTAMP WHERE ct.contentTagId.tagId = :tagId AND ct.deletedAt IS NULL")
    void softDeleteByTagId(@Param("tagId") UUID tagId);
}

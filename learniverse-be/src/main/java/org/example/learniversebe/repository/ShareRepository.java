package org.example.learniversebe.repository;

import org.example.learniversebe.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ShareRepository extends JpaRepository<Share, UUID> {

    // Đếm số lượt share cho một content
    long countByContentId(UUID contentId);

    /**
     * Xóa mềm tất cả shares của một content
     */
    @Modifying
    @Query("UPDATE Share s SET s.deletedAt = CURRENT_TIMESTAMP WHERE s.content.id = :contentId AND s.deletedAt IS NULL")
    void softDeleteByContentId(@Param("contentId") UUID contentId);

    // Có thể thêm các query khác nếu cần phân tích hành vi chia sẻ
}

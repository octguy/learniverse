package org.example.learniversebe.repository;

import org.example.learniversebe.model.Mention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MentionRepository extends JpaRepository<Mention, UUID> {

    @Modifying
    @Query("DELETE FROM Mention m WHERE m.comment.id = :commentId")
    void deleteByCommentId(@Param("commentId") UUID commentId);

    // Tìm mentions chưa được thông báo (để gửi notification) - Ví dụ
    List<Mention> findByIsNotifiedFalseAndDeletedAtIsNull();

    // Xóa mềm tất cả mentions của một comment (khi delete comment)
    @Modifying
    @Query("UPDATE Mention m SET m.deletedAt = CURRENT_TIMESTAMP WHERE m.comment.id = :commentId AND m.deletedAt IS NULL")
    void softDeleteByCommentId(@Param("commentId") UUID commentId);

}

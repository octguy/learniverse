package org.example.learniversebe.repository;

import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    // Tìm comment gốc
    Page<Comment> findByCommentableTypeAndCommentableIdAndParentIsNullOrderByCreatedAtAsc(String commentableType, UUID commentableId, Pageable pageable);

    // Tìm các replies cho một comment cha
    Page<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId, Pageable pageable);

    List<Comment> findByParentId(UUID parentId);

    /**
     * Xóa mềm tất cả comments (và replies) của một commentable entity (Content hoặc Answer)
     */
    @Modifying
    @Query("UPDATE Comment c SET c.deletedAt = CURRENT_TIMESTAMP WHERE c.commentableType = :commentableType AND c.commentableId = :commentableId AND c.deletedAt IS NULL")
    void softDeleteByCommentable(@Param("commentableType") org.example.learniversebe.enums.ReactableType commentableType, @Param("commentableId") UUID commentableId);
}

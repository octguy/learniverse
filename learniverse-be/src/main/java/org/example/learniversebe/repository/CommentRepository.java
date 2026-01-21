package org.example.learniversebe.repository;

import org.example.learniversebe.enums.CommentableType;
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
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    /**
     * Find comment by ID (exclude soft deleted)
     */
    @Query("SELECT c FROM Comment c WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Comment> findById(@Param("id") UUID id);

    /**
     * Check if comment exists (exclude soft deleted)
     */
    @Query("SELECT COUNT(c) > 0 FROM Comment c WHERE c.id = :id AND c.deletedAt IS NULL")
    boolean existsById(@Param("id") UUID id);

    /**
     * Find all top-level comments for a commentable entity
     */
    @Query("SELECT c FROM Comment c WHERE c.commentableType = :type " +
            "AND c.commentableId = :commentableId " +
            "AND c.parent IS NULL " +
            "AND c.deletedAt IS NULL " +
            "AND c.isVisible = TRUE " +
            "ORDER BY c.createdAt DESC")
    Page<Comment> findTopLevelComments(
            @Param("type") ReactableType type,
            @Param("commentableId") UUID commentableId,
            Pageable pageable);

    /**
     * Find all replies to a parent comment
     */
    @Query("SELECT c FROM Comment c WHERE c.parent.id = :parentId " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") UUID parentId);


    // Tìm comment gốc (top-level comments for an entity)
    @Query("SELECT c FROM Comment c WHERE c.commentableType = :type " +
            "AND c.commentableId = :commentableId " +
            "AND c.parent IS NULL " +
            "AND c.deletedAt IS NULL " +
            "AND c.isVisible = TRUE " +
            "ORDER BY c.createdAt ASC")
    Page<Comment> findByCommentableTypeAndCommentableIdAndParentIsNullOrderByCreatedAtAsc(
            @Param("type") ReactableType commentableType, 
            @Param("commentableId") UUID commentableId, 
            Pageable pageable);

    // Tìm các replies cho một comment cha
    @Query("SELECT c FROM Comment c WHERE c.parent.id = :parentId " +
            "AND c.deletedAt IS NULL " +
            "AND c.isVisible = TRUE " +
            "ORDER BY c.createdAt ASC")
    Page<Comment> findByParentIdOrderByCreatedAtAsc(@Param("parentId") UUID parentId, Pageable pageable);

    List<Comment> findByParentId(UUID parentId);

    // Tìm comment theo Type và ID (có phân trang)
    @Query("SELECT c FROM Comment c WHERE c.commentableType = :type " +
            "AND c.commentableId = :id " +
            "AND c.deletedAt IS NULL " +
            "AND c.isVisible = TRUE " +
            "ORDER BY c.createdAt DESC")
    Page<Comment> findByCommentableTypeAndCommentableId(
            @Param("type") ReactableType commentableType,
            @Param("id") UUID commentableId,
            Pageable pageable
    );

    /**
     * Soft delete a comment by ID
     */
    @Modifying
    @Query("UPDATE Comment c SET c.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE c.id = :commentId AND c.deletedAt IS NULL")
    int softDeleteById(@Param("commentId") UUID commentId);

    /**
     * Soft delete all comments for a commentable entity (Content, Answer, etc.)
     */
    @Modifying
    @Query("UPDATE Comment c SET c.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE c.commentableType = :type " +
            "AND c.commentableId = :commentableId " +
            "AND c.deletedAt IS NULL")
    int softDeleteByCommentable(
            @Param("type") ReactableType type,
            @Param("commentableId") UUID commentableId);

    /**
     * Soft delete all replies to a parent comment
     */
    @Modifying
    @Query("UPDATE Comment c SET c.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE c.parent.id = :parentId " +
            "AND c.deletedAt IS NULL")
    int softDeleteRepliesByParentId(@Param("parentId") UUID parentId);

    /**
     * Soft delete all comments by a user
     */
    @Modifying
    @Query("UPDATE Comment c SET c.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE c.author.id = :userId " +
            "AND c.deletedAt IS NULL")
    int softDeleteByUserId(@Param("userId") UUID userId);

    /**
     * Count comments for a commentable entity
     */
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.commentableType = :type " +
            "AND c.commentableId = :commentableId " +
            "AND c.deletedAt IS NULL")
    long countByCommentable(
            @Param("type") ReactableType type,
            @Param("commentableId") UUID commentableId);

    /**
     * Count replies for a parent comment
     */
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.parent.id = :parentId " +
            "AND c.deletedAt IS NULL")
    long countRepliesByParentId(@Param("parentId") UUID parentId);

    /**
     * Find comments by user
     */
    @Query("SELECT c FROM Comment c WHERE c.author.id = :userId " +
            "AND c.deletedAt IS NULL " +
            "ORDER BY c.createdAt DESC")
    Page<Comment> findByUserId(
            @Param("userId") UUID userId,
            Pageable pageable);

}

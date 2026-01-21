package org.example.learniversebe.repository;

import org.example.learniversebe.model.Answer;
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
public interface AnswerRepository extends JpaRepository<Answer, UUID> {
    // Public query - filter by isVisible = true to hide auto-flagged answers
    Page<Answer> findByQuestionIdAndIsVisibleTrueOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(UUID questionId, Pageable pageable);
    
    // Internal query (includes hidden answers, for admin use)
    Page<Answer> findByQuestionId(UUID questionId, Pageable pageable);

    // Author queries - filter by isVisible = true for public access
    @Query("SELECT a FROM Answer a WHERE a.author.id = :authorId AND a.deletedAt IS NULL AND a.isVisible = TRUE")
    List<Answer> findByAuthorId(@Param("authorId") UUID authorId);

    @Query("SELECT a FROM Answer a WHERE a.author.id = :authorId AND a.deletedAt IS NULL AND a.isVisible = TRUE ORDER BY a.createdAt DESC")
    Page<Answer> findByAuthorIdOrderByCreatedAtDesc(@Param("authorId") UUID authorId, Pageable pageable);

    @Query("SELECT a.id FROM Answer a WHERE a.question.id = :questionId AND a.deletedAt IS NULL")
    List<UUID> findAllIdsByQuestionId(@Param("questionId") UUID questionId);

    /**
     * Xóa mềm tất cả Answer thuộc một Question
     */
    @Modifying
    @Query("UPDATE Answer a SET a.deletedAt = CURRENT_TIMESTAMP WHERE a.question.id = :questionId AND a.deletedAt IS NULL")
    void softDeleteByQuestionId(@Param("questionId") UUID questionId);

    /**
     * Xóa mềm một Answer bằng ID
     */
    @Modifying
    @Query("UPDATE Answer a SET a.deletedAt = CURRENT_TIMESTAMP WHERE a.id = :answerId AND a.deletedAt IS NULL")
    void softDeleteById(@Param("answerId") UUID answerId);
}

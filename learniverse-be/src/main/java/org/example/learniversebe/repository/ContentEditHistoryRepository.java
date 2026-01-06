package org.example.learniversebe.repository;

import org.example.learniversebe.model.ContentEditHistory;
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
public interface ContentEditHistoryRepository extends JpaRepository<ContentEditHistory, UUID> {

    /**
     * Find all edit history for a content
     */
    @Query("SELECT h FROM ContentEditHistory h WHERE h.content.id = :contentId ORDER BY h.editedAt DESC")
    List<ContentEditHistory> findByContentId(@Param("contentId") UUID contentId);

    /**
     * Soft delete all edit history for a content (optional - usually keep history)
     */
    @Modifying
    @Query("UPDATE ContentEditHistory h SET h.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE h.content.id = :contentId AND h.deletedAt IS NULL")
    int softDeleteByContentId(@Param("contentId") UUID contentId);

    /**
     * Count edit history for a content
     */
    @Query("SELECT COUNT(h) FROM ContentEditHistory h WHERE h.content.id = :contentId")
    long countByContentId(@Param("contentId") UUID contentId);
}

package org.example.learniversebe.repository;

import org.example.learniversebe.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    /**
     * Soft delete all attachments for a content
     */
    @Modifying
    @Query("UPDATE Attachment a SET a.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE a.content.id = :contentId AND a.deletedAt IS NULL")
    int softDeleteByContentId(@Param("contentId") UUID contentId);

    /**
     * Find all active attachments by content ID
     */
    @Query("SELECT a FROM Attachment a WHERE a.content.id = :contentId AND a.deletedAt IS NULL")
    List<Attachment> findByContentId(@Param("contentId") UUID contentId);

    /**
     * Find attachment by ID (exclude soft deleted)
     */
    @Query("SELECT a FROM Attachment a WHERE a.id = :id AND a.deletedAt IS NULL")
    java.util.Optional<Attachment> findById(@Param("id") UUID id);

    /**
     * Find all attachments by IDs (exclude soft deleted)
     */
    @Query("SELECT a FROM Attachment a WHERE a.id IN :ids AND a.deletedAt IS NULL")
    List<Attachment> findAllById(@Param("ids") Iterable<UUID> ids);
}

package org.example.learniversebe.repository;

import org.example.learniversebe.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findAllByRecipient_IdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    long countByRecipient_IdAndIsReadFalse(UUID recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.id = :recipientId AND n.isRead = false")
    void markAllAsReadByRecipientId(UUID recipientId);

    /**
     * Get all notifications ordered by creation date (for admin dashboard)
     */
    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
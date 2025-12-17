package org.example.learniversebe.repository;

import org.example.learniversebe.model.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, UUID> {

    @Modifying
    @Query("""
        update MessageReceipt mr
        set mr.deletedAt = current_timestamp
        where mr.message.chatRoom.id = :roomId
    """)
    void softDeleteMessageReceiptsByRoom(UUID roomId);
}

package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Modifying
    @Query("""
        update ChatMessage cm
        set cm.deletedAt = current_timestamp
        where cm.chatRoom.id = :roomId
    """)
    void softDeleteChatMessagesByRoom(UUID roomId);

    Page<ChatMessage> findByChatRoomId(UUID chatRoomId, Pageable pageable);
}

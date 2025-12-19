package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
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
    
    @Query(value = "SELECT * FROM chat_message WHERE chat_room_id = :chatRoomId AND deleted_at IS NULL ORDER BY created_at DESC, send_at DESC LIMIT 1", nativeQuery = true)
    Optional<ChatMessage> findLastMessageByChatRoomId(@Param("chatRoomId") UUID chatRoomId);
}

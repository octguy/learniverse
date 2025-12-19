package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
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

    @Query(value= """
        select up.display_name, cm.message_type, cm.text_content, cm.created_at
        from chat_message cm
        join user_profile up on cm.sender_id = up.user_id
        where cm.chat_room_id = :chatRoomId
            and cm.deleted_at is null
        order by cm.created_at desc
        limit 1
    """, nativeQuery = true)
    List<Object[]> findLastMessageByChatRoomId(@Param("chatRoomId") UUID chatRoomId);
}

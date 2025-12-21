package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatMessage;
import org.example.learniversebe.repository.projection.ChatMessageProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
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
        select up.user_id, up.display_name, cm.message_type, cm.text_content, cm.created_at
        from chat_message cm
        join user_profile up on cm.sender_id = up.user_id
        where cm.chat_room_id = :chatRoomId
            and cm.deleted_at is null
        order by cm.created_at desc
        limit 1
    """, nativeQuery = true)
    List<Object[]> findLastMessageByChatRoomId(@Param("chatRoomId") UUID chatRoomId);


    @Query(value = """
        select 
            cm.id as id,
            cm.chat_room_id as chatRoomId,
            cm.sender_id as senderId,
            up.display_name as senderName,
            up.avatar_url as senderAvatar,
            cm.message_type as messageType,
            cm.text_content as textContent,
            cm.metadata as metadata,
            cm.parent_message_id as parentMessageId,
            cm.created_at as sendAt
        from chat_message cm
        left join user_profile up on cm.sender_id = up.user_id
        where cm.chat_room_id = :roomId
        and (cast(:cursor as timestamp) is null or cm.created_at < :cursor)
        order by cm.created_at desc
        limit :limit
    """, nativeQuery = true)
    List<ChatMessageProjection> findMessagesByChatRoomId(
            @Param("roomId") UUID chatRoomId,
            @Param("cursor") LocalDateTime cursor,
            @Param("limit") int limit
    );

    // Query phụ để check xem còn tin nhắn cũ hơn không (để set hasNext)
    boolean existsByChatRoomIdAndCreatedAtBefore(UUID chatRoomId, LocalDateTime cursor);
}

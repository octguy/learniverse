package org.example.learniversebe.repository;

import org.example.learniversebe.enums.MessageStatus;
import org.example.learniversebe.model.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, UUID> {

    @Modifying
    @Query("""
        update MessageReceipt mr
        set mr.deletedAt = current_timestamp
        where mr.message.chatRoom.id = :roomId
    """)
    void softDeleteMessageReceiptsByRoom(UUID roomId);

    // Find receipt for a specific message and user
    @Query("SELECT mr FROM MessageReceipt mr WHERE mr.message.id = :messageId AND mr.user.id = :userId")
    Optional<MessageReceipt> findByMessageIdAndUserId(@Param("messageId") UUID messageId, @Param("userId") UUID userId);

    // Find all receipts for a message
    @Query("SELECT mr FROM MessageReceipt mr WHERE mr.message.id = :messageId")
    List<MessageReceipt> findByMessageId(@Param("messageId") UUID messageId);

    // Find all unread messages for a user in a chat room
    @Query("SELECT m.id FROM ChatMessage m " +
           "WHERE m.chatRoom.id = :chatRoomId " +
           "AND m.sender.id != :userId " +
           "AND NOT EXISTS (SELECT 1 FROM MessageReceipt mr WHERE mr.message.id = m.id AND mr.user.id = :userId AND mr.status = :readStatus)")
    List<UUID> findUnreadMessageIds(@Param("chatRoomId") UUID chatRoomId, @Param("userId") UUID userId, @Param("readStatus") MessageStatus readStatus);

    // Count unread messages for a user in a chat room
    @Query("SELECT COUNT(m) FROM ChatMessage m " +
           "WHERE m.chatRoom.id = :chatRoomId " +
           "AND m.sender.id != :userId " +
           "AND NOT EXISTS (SELECT 1 FROM MessageReceipt mr WHERE mr.message.id = m.id AND mr.user.id = :userId AND mr.status = :readStatus)")
    Long countUnreadMessages(@Param("chatRoomId") UUID chatRoomId, @Param("userId") UUID userId, @Param("readStatus") MessageStatus readStatus);

    // Find all receipts for messages in a chat room
    @Query("SELECT mr FROM MessageReceipt mr WHERE mr.message.chatRoom.id = :chatRoomId AND mr.user.id = :userId")
    List<MessageReceipt> findByChatRoomIdAndUserId(@Param("chatRoomId") UUID chatRoomId, @Param("userId") UUID userId);
}

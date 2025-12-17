package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {

//    List<ChatParticipant> findByChatRoomId(UUID chatRoomId);
//
//    List<ChatParticipant> findAllByChatRoomIdIn(List<UUID> chatRoomIds);

    @Query(value = """
        select cp
        from ChatParticipant cp
        where cp.chatRoom.id = :chatRoomId
            and cp.participant.id <> :participantId
        order by cp.createdAt asc
    """)
    List<ChatParticipant> findOtherParticipants(UUID chatRoomId, UUID participantId);

    @Query("""
        select cp.chatRoom.id, cp.participant.id
        from ChatParticipant cp
        where cp.chatRoom.id in :chatRoomIds
        """)
    List<Object[]> findAllParticipantsIdInRoomsId(List<UUID> chatRoomIds);

    Optional<ChatParticipant> findByChatRoomIdAndParticipantId(UUID chatRoomId, UUID id);

    @Query(value = """
        select count(*)
        from chat_participant
        where chat_room_id = :chatRoomId and deleted_at IS NULL
    """, nativeQuery = true)
    long countByChatRoomId(UUID chatRoomId);

    @Modifying
    @Query("""
        update ChatParticipant cp
        set cp.deletedAt = current_timestamp
        where cp.chatRoom.id = :roomId
    """)
    void softDeleteChatParticipantsByRoom(UUID roomId);

    @Modifying
    @Query("""
        update ChatParticipant cp
        set cp.deletedAt = current_timestamp
        where cp.chatRoom.id = :chatRoomId
          and cp.participant.id = :id
    """)
    void softDeleteByChatRoomIdAndParticipantId(UUID chatRoomId, UUID id);
}

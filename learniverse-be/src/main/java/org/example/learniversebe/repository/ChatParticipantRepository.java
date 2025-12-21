package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {

    List<ChatParticipant> findByChatRoomId(UUID chatRoomId);

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

    @Query(value = """
        select cp.participant_id, cp.deleted_at
        from chat_participant cp
        where cp.chat_room_id = :chatRoomId
    """, nativeQuery = true)
    List<Object[]> findParticipantStatesByChatRoomId(UUID chatRoomId);

//    @Query(value = """
//        select cp.participant_id
//        from chat_participant cp
//        where cp.chat_room_id = :chatRoomId
//        and cp.deleted_at is null
//        """, nativeQuery = true)
//    List<UUID> findAllParticipantIdsByChatRoomId(UUID chatRoomId);
//
//    @Query(value = """
//        select cp.participant_id
//        from chat_participant cp
//        where cp.chat_room_id = :chatRoomId
//        and cp.deleted_at is not null
//        """, nativeQuery = true)
//    List<UUID> findAllOldParticipantIdsByChatRoomId(UUID chatRoomId);

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

    @Query(value = """
        select exists(
            select 1
            from chat_participant
            where chat_room_id = :chatRoomId
              and participant_id = :userId
              and deleted_at is null
        )
    """, nativeQuery = true)
    boolean existsByChatRoomIdAndParticipantId(UUID chatRoomId, UUID userId);

    @Modifying
    @Query(value = """
        update chat_participant
        set deleted_at = null,
            joined_at = now(),
            updated_at = now(),
            invited_by = :userId
        where chat_room_id = :chatRoomId
            and participant_id in :toRestore
            and deleted_at is not null
    """, nativeQuery = true)
    void restoreParticipants(UUID chatRoomId, UUID userId, Set<UUID> toRestore);

//    @Query(value = """
//        select u.id, up.display_name, cp.chat_role, up.avatar_url, cp.joined_at
//        from chat_participant cp
//        join "user" u on cp.participant_id = u.id
//        join user_profile up on u.id = up.user_id
//        join chat_room cr on cr.id = cp.chat_room_id
//        where cp.chat_room_id = :chatRoomId and cr.deleted_at is null
//    """, nativeQuery = true)
    @Query(value = """
        select up.user_id, up.display_name, cp.chat_role, up.avatar_url, cp.joined_at
        from chat_participant cp
        join user_profile up on cp.participant_id = up.user_id
        join chat_room cr on cr.id = cp.chat_room_id
        where cp.chat_room_id = :chatRoomId
            and cr.deleted_at is null
            and cp.deleted_at is null
    """, nativeQuery = true)
    List<Object[]> getUsersInChatRoom(UUID chatRoomId);

    @Query(value = """
        select count(cm.id)
        from chat_message cm
        join chat_participant cp on cm.chat_room_id = cp.chat_room_id
        where cm.chat_room_id = :roomId
            and cp.participant_id = :userId
            and cm.created_at > cp.last_read_at
    """, nativeQuery = true)
    Integer getUnreadCount(@Param("roomId") UUID chatRoomId,
                           @Param("userId") UUID participantId);
}

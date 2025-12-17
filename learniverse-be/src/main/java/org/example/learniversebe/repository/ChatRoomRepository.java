package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    @Query(value = "select cr.* " +
            "from chat_room cr " +
            "join chat_participant cp1 on cp1.chat_room_id = cr.id " +
            "join chat_participant cp2 on cp2.chat_room_id = cr.id " +
            "where cr.is_group_chat = false " +
            "and cp1.participant_id = :userId1 " +
            "and cp2.participant_id = :userId2 " +
            "limit 1", nativeQuery = true)
    Optional<ChatRoom> existsDirectMessage(@Param("userId1") UUID userId1,
                                           @Param("userId2") UUID userId2);
    @Query(value = """
            select cr.*
            from chat_room cr
            join chat_participant cp on cr.id = cp.chat_room_id
            where cp.participant_id = :userId
            """, nativeQuery = true)
    List<ChatRoom> findChatRoomsByUserId(@Param("userId") UUID userId);

    @Query(value = """
        select distinct cr.*
        from chat_room cr
        join chat_participant cp on cr.id = cp.chat_room_id
        where cr.is_group_chat = false
    """, nativeQuery = true)
    List<ChatRoom> findAllDirectChatRoomsByUserId(UUID userId);

    @Query(value = """
        select cr.*
        from chat_room cr
        where cr.is_group_chat = true
          and exists (
            select 1
            from chat_participant cp
            where cp.chat_room_id = cr.id
              and cp.participant_id = :userId
          )
    """, nativeQuery = true)
    List<ChatRoom> findAllGroupChatRoomsByUserId(UUID userId);

    @Modifying
    @Query("""
        update ChatRoom cr
        set cr.deletedAt = current_timestamp
        where cr.id = :id
    """)
    void softDeleteChatRoom(UUID id);
}

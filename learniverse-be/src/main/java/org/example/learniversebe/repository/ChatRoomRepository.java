package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}

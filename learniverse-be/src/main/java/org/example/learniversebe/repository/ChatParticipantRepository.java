package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {

    List<ChatParticipant> findByChatRoomId(UUID chatRoomId);

    List<ChatParticipant> findAllByChatRoomIdIn(List<UUID> chatRoomIds);

    @Query("""
        select cp.chatRoom.id, cp.participant.id
        from ChatParticipant cp
        where cp.chatRoom.id in :chatRoomIds
        """)
    List<Object[]> findAllParticipantsIdInRoomsId(List<UUID> chatRoomIds);

}

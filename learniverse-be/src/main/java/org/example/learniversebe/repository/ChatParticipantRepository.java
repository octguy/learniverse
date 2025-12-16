package org.example.learniversebe.repository;

import org.example.learniversebe.model.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {

    List<ChatParticipant> findByChatRoomId(UUID chatRoomId);
}

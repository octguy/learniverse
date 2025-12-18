package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.AddParticipantsRequest;
import org.example.learniversebe.dto.response.AddParticipantsResponse;
import org.example.learniversebe.dto.response.ChatParticipantInRoomResponse;

import java.util.List;
import java.util.UUID;

public interface IChatParticipantService {

    AddParticipantsResponse addParticipant(UUID chatRoomId, AddParticipantsRequest request);

    void removeParticipant(UUID chatRoomId, UUID participantId);

    List<ChatParticipantInRoomResponse> getParticipantsInRoom(UUID chatRoomId);
}

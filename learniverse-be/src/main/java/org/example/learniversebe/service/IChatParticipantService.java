package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.AddParticipantsRequest;
import org.example.learniversebe.dto.response.AddParticipantsResponse;

import java.util.UUID;

public interface IChatParticipantService {

    AddParticipantsResponse addParticipant(UUID chatRoomId, AddParticipantsRequest request);
}

package org.example.learniversebe.repository.projection;

import java.time.LocalDateTime;
import java.util.UUID;

public interface ChatMessageProjection {

    UUID getId();

    UUID getChatRoomId();

    UUID getSenderId();

    String getSenderName();

    String getSenderAvatar();

    String getMessageType();

    String getTextContent();

    String getMetadata();

    UUID getParentMessageId();

    LocalDateTime getSendAt();
}

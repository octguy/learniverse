package org.example.learniversebe.dto.websocket;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.SocketEventType;

@Data
@Builder
@Schema(description = "WebSocket event wrapper for chat-related real-time events")
public class ChatSocketEvent {

    @Schema(description = "Type of socket event", example = "MESSAGE_SENT", allowableValues = {"MESSAGE_SENT", "MESSAGE_EDITED", "MESSAGE_DELETED", "TYPING_INDICATOR", "READ_RECEIPT", "USER_STATUS"})
    private SocketEventType eventType;

    @Schema(description = "Event payload data (type varies based on eventType)")
    private Object data;
}

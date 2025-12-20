package org.example.learniversebe.dto.websocket;

import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.SocketEventType;

@Data
@Builder
public class ChatSocketEvent {

    private SocketEventType eventType;

    private Object data;
}

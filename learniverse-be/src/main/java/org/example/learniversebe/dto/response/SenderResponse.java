package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SenderResponse {

    private UUID senderId;

    private String senderName;

    private String senderAvatar;
}

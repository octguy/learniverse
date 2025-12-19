package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LastMessageResponse {

    private String senderName;

    private String messageType;

    private String content;

    private LocalDateTime sendAt;
}

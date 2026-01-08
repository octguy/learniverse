package org.example.learniversebe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.learniversebe.enums.GroupJoinRequestStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupJoinRequestResponse {
    private UUID id;
    private UUID groupId;
    private String groupName;
    private UserResponse user;
    private GroupJoinRequestStatus status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private UserResponse processedBy;
}

package org.example.learniversebe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.learniversebe.enums.GroupMemberRole;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {

    private UUID id;
    private UUID userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private GroupMemberRole role;
    private LocalDateTime joinedAt;
    private Boolean isBanned;
}

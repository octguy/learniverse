package org.example.learniversebe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.learniversebe.enums.GroupMemberRole;
import org.example.learniversebe.enums.GroupPrivacy;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {

    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String avatarUrl;
    private String coverImageUrl;
    private GroupPrivacy privacy;
    private Integer memberCount;

    private UserResponse createdBy;
    private List<TagResponse> tags;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // User-specific fields
    private Boolean isMember;
    private Boolean hasPendingRequest;
    private GroupMemberRole currentUserRole;
}

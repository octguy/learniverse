package org.example.learniversebe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.learniversebe.enums.GroupPrivacy;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupSummaryResponse {

    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String avatarUrl;
    private GroupPrivacy privacy;
    private Integer memberCount;
    private List<TagResponse> tags;

    // User-specific
    private Boolean isMember;
    private Boolean hasPendingRequest;
}

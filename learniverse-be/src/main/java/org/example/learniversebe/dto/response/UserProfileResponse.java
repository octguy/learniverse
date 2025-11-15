package org.example.learniversebe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private int postCount;
    private int answeredQuestionCount;
    private List<String> tags;
}

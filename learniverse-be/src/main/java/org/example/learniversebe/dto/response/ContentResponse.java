package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ContentStatus;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class ContentResponse {
    private UUID id;
    private UserResponse author;
    private ContentType contentType;
    private ContentStatus status;
    private String title;
    private String body;
    private String slug;
    private Integer viewCount;
    private Integer commentCount;
    private Integer reactionCount;
    private Integer bookmarkCount;
    private Integer shareCount;
    private Integer voteScore;
    private UUID acceptedAnswerId;
    private Integer answerCount;
    private Boolean isAnswered;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime lastEditedAt;
    private Set<TagResponse> tags; // TagResponse DTO
    private Set<AttachmentResponse> attachments; // AttachmentResponse DTO

    // Thêm các trường khác nếu cần

    @Data
    @Builder
    public static class TagResponse {
        private UUID id;
        private String name;
        private String slug;
    }
}


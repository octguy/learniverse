package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ContentType; // Cần import ContentType
import org.example.learniversebe.enums.ReactionType;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin chi tiết của một bài post")
public class PostResponse {

    @Schema(description = "ID của bài post")
    private UUID id;

    @Schema(description = "Thông tin tác giả")
    private UserResponse author;

    @Schema(description = "Loại nội dung (sẽ luôn là POST)")
    @Builder.Default
    private ContentType contentType = ContentType.POST;

    @Schema(description = "Trạng thái bài post (DRAFT, PUBLISHED,...)")
    private ContentStatus status;

    @Schema(description = "Tiêu đề bài post")
    private String title;

    @Schema(description = "Nội dung bài post (có thể là HTML đã render)")
    private String body;

    @Schema(description = "Slug của bài post")
    private String slug;

    @Schema(description = "Số lượt xem")
    private Integer viewCount;

    @Schema(description = "Số lượt bình luận")
    private Integer commentCount;

    @Schema(description = "Số lượt reaction")
    private Integer reactionCount;

    @Schema(description = "Số lượt bookmark")
    private Integer bookmarkCount;

    @Schema(description = "Số lượt chia sẻ")
    private Integer shareCount;

    @Schema(description = "Thời gian tạo")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật lần cuối")
    private LocalDateTime updatedAt;

    @Schema(description = "Thời gian đăng bài")
    private LocalDateTime publishedAt;

    @Schema(description = "Thời gian chỉnh sửa lần cuối")
    private LocalDateTime lastEditedAt;

    @Schema(description = "Danh sách các tag")
    private Set<TagResponse> tags;

    @Schema(description = "Danh sách file đính kèm")
    private Set<AttachmentResponse> attachments;

    @Schema(description = "Bài đăng gốc")
    private PostSummaryResponse originalPost;

    @Schema(description = "ID nhóm (nếu đăng trong nhóm)")
    private UUID groupId;

    @Schema(description = "Tên nhóm (nếu đăng trong nhóm)")
    private String groupName;

    @Schema(description = "Slug nhóm (nếu đăng trong nhóm)")
    private String groupSlug;

    @Schema(description = "Ảnh đại diện nhóm (nếu đăng trong nhóm)")
    private String groupAvatarUrl;

    // Trạng thái của người dùng hiện tại đối với post này
    @Schema(description = "Đã được người dùng lưu lại hay chưa")
    private boolean bookmarkedByCurrentUser;

    @Schema(description = "Reaction hiện tại")
    private ReactionType currentUserReaction;
}

package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ReactionType;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin tóm tắt của một bài post (dùng trong danh sách)")
public class PostSummaryResponse {

    @Schema(description = "ID của bài post")
    private UUID id;

    @Schema(description = "Thông tin tác giả")
    private UserResponse author;

    @Schema(description = "Loại nội dung (sẽ luôn là POST)")
    @Builder.Default
    private ContentType contentType = ContentType.POST;

    @Schema(description = "Tiêu đề bài post")
    private String title;

    @Schema(description = "Đoạn trích nội dung (preview)")
    private String bodyExcerpt;

    @Schema(description = "Slug của bài post")
    private String slug;

    @Schema(description = "Số lượt bình luận")
    private Integer commentCount;

    @Schema(description = "Số lượt reaction")
    private Integer reactionCount;

    @Schema(description = "Số lượt bookmark")
    private Integer bookmarkCount;

    @Schema(description = "Số điểm vote (nếu có áp dụng cho post)")
    private Integer voteScore;

    @Schema(description = "Thời gian tạo/đăng")
    private LocalDateTime publishedAt;

    @Schema(description = "Danh sách các tag")
    private Set<TagResponse> tags;

    @Schema(description = "User hiện tại có bookmark bài này không")
    private Boolean bookmarkedByCurrentUser;

    @Schema(description = "Reaction của user hiện tại (nếu có)")
    private ReactionType currentUserReaction;

    @Schema(description = "ID nhóm (nếu đăng trong nhóm)")
    private UUID groupId;

    @Schema(description = "Tên nhóm (nếu đăng trong nhóm)")
    private String groupName;

    @Schema(description = "Slug nhóm (nếu đăng trong nhóm)")
    private String groupSlug;

    @Schema(description = "Bài đăng gốc")
    private PostSummaryResponse originalPost;
}

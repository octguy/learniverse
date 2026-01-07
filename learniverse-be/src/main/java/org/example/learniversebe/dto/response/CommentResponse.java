package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.CommentableType;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.ReactionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin chi tiết của một bình luận")
public class CommentResponse {

    @Schema(description = "ID của bình luận")
    private UUID id;

    @Schema(description = "Loại đối tượng được bình luận")
    private ReactableType commentableType;

    @Schema(description = "ID của đối tượng được bình luận")
    private UUID commentableId;

    @Schema(description = "Thông tin tác giả")
    private UserResponse author;

    @Schema(description = "ID của comment cha (nếu là reply)")
    private UUID parentId;

    @Schema(description = "Nội dung bình luận (có thể là HTML)")
    private String body;

    @Schema(description = "Số lượt reply")
    private Integer replyCount;

    @Schema(description = "Số lượt reaction")
    private Integer reactionCount;

    @Schema(description = "Đã bị chỉnh sửa hay chưa")
    private Boolean isEdited;

    @Schema(description = "Thời gian tạo")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật")
    private LocalDateTime updatedAt;

    @Schema(description = "Danh sách các replies (nếu có và không phân trang)")
    private List<CommentResponse> replies;

    @Schema(description = "Danh sách người dùng được đề cập")
    private Set<UserResponse> mentionedUsers;

    @Schema(description = "Reaction của người dùng hiện tại (nếu có)")
    private ReactionType currentUserReaction;
}

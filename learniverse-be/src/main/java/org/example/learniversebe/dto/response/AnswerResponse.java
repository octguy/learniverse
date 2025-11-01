package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ReactionType;
import org.example.learniversebe.enums.VoteType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin chi tiết của một câu trả lời")
public class AnswerResponse {

    @Schema(description = "ID của câu trả lời")
    private UUID id;

    @Schema(description = "ID của câu hỏi mà câu trả lời này thuộc về")
    private UUID questionId;

    @Schema(description = "Thông tin tác giả")
    private UserResponse author;

    @Schema(description = "Nội dung câu trả lời (có thể là HTML đã render)")
    private String body; // Hoặc bodyHtml

    @Schema(description = "Điểm vote (upvote - downvote)")
    private Integer voteScore;

    @Schema(description = "Số lượt upvote")
    private Integer upvoteCount;

    @Schema(description = "Số lượt downvote")
    private Integer downvoteCount;

    @Schema(description = "Đánh dấu là câu trả lời được chấp nhận")
    private Boolean isAccepted;

    @Schema(description = "Thời gian tạo")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật lần cuối")
    private LocalDateTime updatedAt;

    @Schema(description = "Số lượng bình luận")
    private Integer commentCount;

    @Schema(description = "Số lượng reaction")
    private Integer reactionCount;

    @Schema(description = "Tình trạng vote của user hiện tại")
    private VoteType currentUserVote;

    @Schema(description = "Tình trạng reaction của user hiện tại")
    private ReactionType currentUserReaction;

    @Schema(description = "Câu hỏi liên quan")
    private ContentResponse acceptedInQuestion;
}

package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ReactionType;
import org.example.learniversebe.enums.VoteType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin chi tiết của một câu hỏi")
public class QuestionResponse {

    @Schema(description = "ID của câu hỏi")
    private UUID id;

    @Schema(description = "Thông tin tác giả")
    private UserResponse author;

    @Schema(description = "Loại nội dung (sẽ luôn là QUESTION)")
    @Builder.Default
    private ContentType contentType = ContentType.QUESTION; // Mặc định là QUESTION

    @Schema(description = "Trạng thái câu hỏi")
    private ContentStatus status;

    @Schema(description = "Tiêu đề câu hỏi")
    private String title;

    @Schema(description = "Nội dung câu hỏi (có thể là HTML đã render)")
    private String body; // Hoặc bodyHtml

    @Schema(description = "Slug của câu hỏi")
    private String slug;

    @Schema(description = "Số lượt xem")
    private Integer viewCount;

    @Schema(description = "Số lượt bình luận")
    private Integer commentCount;

    @Schema(description = "Số lượt bookmark")
    private Integer bookmarkCount;

    @Schema(description = "Điểm vote (upvote - downvote)")
    private Integer voteScore;

    @Schema(description = "ID của câu trả lời được chấp nhận (nếu có)")
    private UUID acceptedAnswerId;

    @Schema(description = "Số lượng câu trả lời")
    private Integer answerCount;

    @Schema(description = "Đã có câu trả lời được chấp nhận hay chưa")
    private Boolean isAnswered;

    @Schema(description = "Thời gian tạo")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật lần cuối")
    private LocalDateTime updatedAt;

    @Schema(description = "Thời gian đăng")
    private LocalDateTime publishedAt;

    @Schema(description = "Thời gian chỉnh sửa lần cuối")
    private LocalDateTime lastEditedAt;

    @Schema(description = "Danh sách các tag")
    private Set<TagResponse> tags;

    @Schema(description = "Danh sách file đính kèm")
    private Set<AttachmentResponse> attachments;

    // Tích hợp phân trang riêng sau này
    @Schema(description = "Danh sách câu trả lời")
    private List<AnswerResponse> answers;

    // Các trạng thái của người dùng hiện tại
    @Schema(description = "Đã được người dùng lưu lại hay chưa")
    private boolean bookmarkedByCurrentUser;

    @Schema(description = "Vote hiện tại")
    private VoteType currentUserVote;

    @Schema(description = "Reaction hiện tại")
    private ReactionType currentUserReaction;
}

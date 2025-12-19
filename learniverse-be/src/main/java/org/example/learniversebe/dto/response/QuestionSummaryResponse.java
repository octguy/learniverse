package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ReactionType;
import org.example.learniversebe.enums.VoteType;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin tóm tắt của một câu hỏi (dùng trong danh sách)")
public class QuestionSummaryResponse {

    @Schema(description = "ID của câu hỏi")
    private UUID id;

    @Schema(description = "Thông tin tác giả")
    private UserResponse author;

    @Schema(description = "Loại nội dung (sẽ luôn là QUESTION)")
    @Builder.Default
    private ContentType contentType = ContentType.QUESTION;

    @Schema(description = "Tiêu đề câu hỏi")
    private String title;

    @Schema(description = "Đoạn trích nội dung (preview)")
    private String bodyExcerpt;

    @Schema(description = "Slug của câu hỏi")
    private String slug;

    @Schema(description = "Số lượt xem")
    private Integer viewCount;

    @Schema(description = "Số lượt bình luận")
    private Integer commentCount;

    @Schema(description = "Số lượt bookmark")
    private Integer bookmarkCount;

    @Schema(description = "Điểm vote")
    private Integer voteScore;

    @Schema(description = "Số lượng câu trả lời")
    private Integer answerCount;

    @Schema(description = "Đã có câu trả lời được chấp nhận hay chưa")
    private Boolean isAnswered;

    @Schema(description = "ID của câu trả lời được chấp nhận (nếu có)")
    private UUID acceptedAnswerId;

    @Schema(description = "Thời gian tạo/đăng")
    private LocalDateTime publishedAt;

    @Schema(description = "Danh sách các tag")
    private Set<TagResponse> tags;

    @Schema(description = "User hiện tại có bookmark bài này không")
    private Boolean bookmarkedByCurrentUser;

    @Schema(description = "Reaction của user hiện tại")
    private ReactionType currentUserReaction;

    @Schema(description = "Vote của user hiện tại (UPVOTE/DOWNVOTE)")
    private VoteType currentUserVote;
}

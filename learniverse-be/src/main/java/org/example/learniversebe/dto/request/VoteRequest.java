package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.VotableType;
import org.example.learniversebe.enums.VoteType;

import java.util.UUID;

@Data
@Schema(description = "Dữ liệu để thực hiện vote (upvote/downvote)")
public class VoteRequest {

    @Schema(description = "Loại đối tượng được vote (CONTENT hoặc ANSWER)", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Votable type cannot be null")
    private VotableType votableType;

    @Schema(description = "ID của đối tượng được vote", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Votable ID cannot be null")
    private UUID votableId;

    @Schema(description = "Loại vote (UPVOTE hoặc DOWNVOTE)", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Vote type cannot be null")
    private VoteType voteType;
}

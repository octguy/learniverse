package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dashboard statistics overview")
public class DashboardStatsResponse {

    @Schema(description = "Total number of users")
    private long totalUsers;

    @Schema(description = "Number of new users registered today")
    private long newUsersToday;

    @Schema(description = "Total number of posts")
    private long totalPosts;

    @Schema(description = "Total number of questions")
    private long totalQuestions;
}

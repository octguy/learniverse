package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Comparison of posts vs questions over time")
public class ContentComparisonResponse {

    @Schema(description = "Period type (DAY, MONTH, YEAR)")
    private String period;

    @Schema(description = "List of comparison data points")
    private List<ComparisonDataPoint> data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComparisonDataPoint {
        @Schema(description = "Time label (date, month, or year)")
        private String label;

        @Schema(description = "Number of posts")
        private long postCount;

        @Schema(description = "Number of questions")
        private long questionCount;
    }
}

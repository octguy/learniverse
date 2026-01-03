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
@Schema(description = "User growth data over time")
public class UserGrowthResponse {

    @Schema(description = "Period type (DAY, MONTH, YEAR)")
    private String period;

    @Schema(description = "List of growth data points")
    private List<GrowthDataPoint> data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthDataPoint {
        @Schema(description = "Time label (date, month, or year)")
        private String label;

        @Schema(description = "Number of new users")
        private long count;
    }
}

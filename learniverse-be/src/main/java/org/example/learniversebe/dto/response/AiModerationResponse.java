package org.example.learniversebe.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AiModerationResponse {
    private boolean success;
    private PredictionResult result;

    @Data
    @NoArgsConstructor
    public static class PredictionResult {
        private String text;

        @JsonProperty("predicted_class")
        private String predictedClass;

        @JsonProperty("predicted_label")
        private int predictedLabel;

        private double confidence;

        @JsonProperty("is_flagged")
        private boolean flagged;
    }
}
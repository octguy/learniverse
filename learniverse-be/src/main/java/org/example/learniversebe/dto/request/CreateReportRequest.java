package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.example.learniversebe.enums.ReportReason;
import org.example.learniversebe.enums.ReportableType;

import java.util.UUID;

/**
 * DTO để tạo một báo cáo mới
 */
@Data
@Schema(description = "Dữ liệu cần thiết để tạo một báo cáo vi phạm")
public class CreateReportRequest {

    @Schema(description = "Loại đối tượng bị báo cáo (POST, QUESTION, ANSWER, COMMENT)", 
            requiredMode = Schema.RequiredMode.REQUIRED,
            example = "POST")
    @NotNull(message = "Reportable type cannot be null")
    private ReportableType reportableType;

    @Schema(description = "ID của đối tượng bị báo cáo", 
            requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Reportable ID cannot be null")
    private UUID reportableId;

    @Schema(description = "Lý do báo cáo", 
            requiredMode = Schema.RequiredMode.REQUIRED,
            example = "SPAM")
    @NotNull(message = "Report reason cannot be null")
    private ReportReason reason;

    @Schema(description = "Mô tả chi tiết (tùy chọn, tối đa 500 ký tự)", 
            maxLength = 500,
            example = "Nội dung này chứa quảng cáo spam...")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}

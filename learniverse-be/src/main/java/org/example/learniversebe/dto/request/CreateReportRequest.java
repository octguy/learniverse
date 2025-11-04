package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.ReportReason;
import org.example.learniversebe.enums.ReportableType;

import java.util.UUID;

@Data
@Schema(description = "Dữ liệu cần thiết để tạo một báo cáo vi phạm")
public class CreateReportRequest {

    @Schema(description = "Loại đối tượng bị báo cáo (CONTENT, ANSWER, COMMENT)", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Reportable type cannot be null")
    private ReportableType reportableType;

    @Schema(description = "ID của đối tượng bị báo cáo", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Reportable ID cannot be null")
    private UUID reportableId;

    @Schema(description = "Lý do báo cáo", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Report reason cannot be null")
    private ReportReason reason;

    @Schema(description = "Mô tả chi tiết (tùy chọn)")
    private String description;
}

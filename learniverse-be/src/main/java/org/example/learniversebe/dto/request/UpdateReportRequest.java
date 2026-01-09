package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.example.learniversebe.enums.ReportActionTaken;
import org.example.learniversebe.enums.ReportStatus;

/**
 * DTO để xử lý (resolve/reject) một báo cáo
 */
@Data
@Schema(description = "Dữ liệu để xử lý một báo cáo vi phạm")
public class UpdateReportRequest {

    @Schema(description = "Trạng thái mới của báo cáo (RESOLVED hoặc REJECTED)", 
            requiredMode = Schema.RequiredMode.REQUIRED,
            example = "RESOLVED")
    @NotNull(message = "Status cannot be null")
    private ReportStatus status;

    @Schema(description = "Hành động đã thực hiện", 
            requiredMode = Schema.RequiredMode.REQUIRED,
            example = "CONTENT_DELETED")
    @NotNull(message = "Action taken cannot be null")
    private ReportActionTaken actionTaken;

    @Schema(description = "Ghi chú của moderator (tùy chọn, tối đa 1000 ký tự)", 
            maxLength = 1000,
            example = "Nội dung đã được xóa do vi phạm quy định về spam")
    @Size(max = 1000, message = "Moderator note must not exceed 1000 characters")
    private String moderatorNote;
}

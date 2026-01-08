package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ReportActionTaken;
import org.example.learniversebe.enums.ReportReason;
import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.enums.ReportableType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO response cho thông tin báo cáo (danh sách)
 */
@Data
@Builder
@Schema(description = "Thông tin cơ bản về một báo cáo")
public class ReportResponse {

    @Schema(description = "ID của báo cáo")
    private UUID id;

    @Schema(description = "Thông tin người báo cáo")
    private UserResponse reporter;

    @Schema(description = "Loại đối tượng bị báo cáo")
    private ReportableType reportableType;

    @Schema(description = "ID của đối tượng bị báo cáo")
    private UUID reportableId;

    @Schema(description = "Lý do báo cáo")
    private ReportReason reason;

    @Schema(description = "Mô tả chi tiết")
    private String description;

    @Schema(description = "Trạng thái báo cáo")
    private ReportStatus status;

    @Schema(description = "Hành động đã thực hiện")
    private ReportActionTaken actionTaken;

    @Schema(description = "Thời gian tạo báo cáo")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian xử lý báo cáo")
    private LocalDateTime resolvedAt;

    @Schema(description = "Thông tin người xử lý")
    private UserResponse resolvedBy;
}

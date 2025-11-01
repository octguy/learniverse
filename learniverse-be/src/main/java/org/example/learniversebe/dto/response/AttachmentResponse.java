package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.AttachmentType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin về file đính kèm")
public class AttachmentResponse {

    @Schema(description = "ID của file đính kèm")
    private UUID id;

    @Schema(description = "Tên file gốc")
    private String fileName;

    @Schema(description = "Loại file (IMAGE, PDF)")
    private AttachmentType fileType;

    @Schema(description = "Kích thước file (bytes)")
    private long fileSize;

    @Schema(description = "Loại MIME (vd: image/png)")
    private String mimeType;

    @Schema(description = "URL để truy cập/tải file")
    private String storageUrl;

    @Schema(description = "Thời gian tải lên")
    private LocalDateTime createdAt;
}

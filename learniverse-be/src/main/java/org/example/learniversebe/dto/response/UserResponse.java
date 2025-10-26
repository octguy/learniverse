package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin cơ bản về người dùng để hiển thị")
public class UserResponse {

    @Schema(description = "ID của người dùng")
    private UUID id;

    @Schema(description = "Tên hiển thị (username) của người dùng")
    private String username;

    @Schema(description = "Avatar của người dùng")
    private String avatarUrl;
}

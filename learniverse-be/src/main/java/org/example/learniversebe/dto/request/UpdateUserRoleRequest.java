package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.UserRole;

@Data
@Schema(description = "Data required to update user role")
public class UpdateUserRoleRequest {

    @Schema(description = "New role for the user", example = "ROLE_MODERATOR", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Role cannot be null")
    private UserRole role;
}

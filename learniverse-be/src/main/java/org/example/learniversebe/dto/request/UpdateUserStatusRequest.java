package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.UserStatus;

@Data
@Schema(description = "Data required to update user account status")
public class UpdateUserStatusRequest {

    @Schema(description = "New status for the user account", example = "BANNED", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Status cannot be null")
    private UserStatus status;
}

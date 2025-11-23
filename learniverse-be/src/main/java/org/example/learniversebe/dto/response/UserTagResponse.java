package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;
@Data
@Builder
public class UserTagResponse {
    private UUID id;
    private String name;
}

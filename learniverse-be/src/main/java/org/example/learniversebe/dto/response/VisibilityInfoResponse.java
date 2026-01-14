package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.ContentVisibility;

import java.util.List;

@Data
@Builder
public class VisibilityInfoResponse {
    private ContentVisibility currentVisibility;
    private List<ContentVisibility> availableOptions;
    private Boolean isInGroup;
    private String groupName;
    private String message; // Giải thích tại sao không đổi được (nếu có)
}
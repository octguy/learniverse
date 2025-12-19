package org.example.learniversebe.dto.response.pagination;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaginationMeta {

    private LocalDateTime nextCursor;

    private boolean hasNext;
}

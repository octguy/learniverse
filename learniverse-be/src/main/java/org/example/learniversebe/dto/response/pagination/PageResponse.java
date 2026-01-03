package org.example.learniversebe.dto.response.pagination;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PageResponse<T> {

    private List<T> data;

    private PaginationMeta pagination;
}

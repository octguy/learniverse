package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.ReportDetailResponse;
import org.example.learniversebe.dto.response.ReportResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.model.Report;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Mapper interface để chuyển đổi giữa Report entity và DTOs.
 * Sử dụng MapStruct để generate code.
 */
@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ReportMapper {

    /**
     * Map Report entity sang ReportResponse DTO
     */
    @Mapping(target = "reporter", source = "reporter")
    @Mapping(target = "resolvedBy", source = "resolvedBy")
    ReportResponse toReportResponse(Report report);

    /**
     * Map danh sách Report entities sang danh sách ReportResponse DTOs
     */
    List<ReportResponse> toReportResponseList(List<Report> reports);

    /**
     * Map Report entity sang ReportDetailResponse DTO (phần cơ bản)
     * Các trường target* cần được set thủ công trong service
     */
    @Mapping(target = "reporter", source = "reporter")
    @Mapping(target = "resolvedBy", source = "resolvedBy")
    @Mapping(target = "targetTitle", ignore = true)
    @Mapping(target = "targetBody", ignore = true)
    @Mapping(target = "targetAuthor", ignore = true)
    @Mapping(target = "targetCreatedAt", ignore = true)
    @Mapping(target = "previousReportCount", ignore = true)
    ReportDetailResponse toReportDetailResponse(Report report);

    /**
     * Map Page<Report> sang PageResponse<ReportResponse>
     */
    default PageResponse<ReportResponse> toPageResponse(Page<Report> page) {
        List<ReportResponse> content = toReportResponseList(page.getContent());
        return PageResponse.<ReportResponse>builder()
                .content(content)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .last(page.isLast())
                .first(page.isFirst())
                .numberOfElements(page.getNumberOfElements())
                .build();
    }
}

package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.CreateReportRequest;
import org.example.learniversebe.dto.request.UpdateReportRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.ReportDetailResponse;
import org.example.learniversebe.dto.response.ReportResponse;
import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.enums.ReportableType;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IReportService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Controller quản lý các báo cáo vi phạm nội dung
 * Hỗ trợ các use cases: UC2.7, UC3.12, UC7.10, UC9.1, UC9.2, UC9.3
 */
@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Report Management", description = "APIs cho quản lý báo cáo vi phạm (UC2.7, UC3.12, UC7.10, UC9.2, UC9.3)")
public class ReportController {

    private final IReportService reportService;

    public ReportController(IReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * UC2.7, UC3.12, UC7.10: Tạo báo cáo mới
     * User báo cáo một bài viết, câu hỏi, câu trả lời hoặc bình luận
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Tạo báo cáo vi phạm mới",
            description = "UC2.7, UC3.12, UC7.10: User tạo báo cáo cho post, question, answer hoặc comment. " +
                    "Yêu cầu đăng nhập. Không thể báo cáo cùng một nội dung hai lần."
    )
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @Valid @RequestBody CreateReportRequest request) {
        
        ReportResponse createdReport = reportService.createReport(request);
        ApiResponse<ReportResponse> response = new ApiResponse<>(
                HttpStatus.CREATED,
                "Cảm ơn. Chúng tôi sẽ xem xét báo cáo của bạn.",
                createdReport,
                null
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * UC9.2: Lấy danh sách tất cả reports với filter
     * Chỉ dành cho Admin/Moderator
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Lấy danh sách tất cả báo cáo",
            description = "UC9.2: Admin/Mod xem danh sách reports với filter theo status, type, ngày. " +
                    "Hỗ trợ phân trang và sắp xếp."
    )
    public ResponseEntity<ApiResponse<PageResponse<ReportResponse>>> getAllReports(
            @Parameter(description = "Filter theo trạng thái (PENDING, RESOLVED, REJECTED)")
            @RequestParam(required = false) ReportStatus status,
            
            @Parameter(description = "Filter theo loại đối tượng (POST, QUESTION, ANSWER, COMMENT)")
            @RequestParam(required = false) ReportableType type,
            
            @Parameter(description = "Filter từ ngày (format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            
            @Parameter(description = "Filter đến ngày (format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            
            @ParameterObject 
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) 
            Pageable pageable) {
        
        PageResponse<ReportResponse> reportPage = reportService.getAllReports(
                status, type, startDate, endDate, pageable);
        
        ApiResponse<PageResponse<ReportResponse>> response = new ApiResponse<>(
                HttpStatus.OK,
                "Reports retrieved successfully",
                reportPage,
                null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * UC9.3: Xem chi tiết một report
     * Chỉ dành cho Admin/Moderator
     */
    @GetMapping("/{reportId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Xem chi tiết một báo cáo",
            description = "UC9.3: Admin/Mod xem chi tiết report, bao gồm thông tin về nội dung bị báo cáo, " +
                    "tác giả, và số lần đã bị báo cáo trước đó."
    )
    public ResponseEntity<ApiResponse<ReportDetailResponse>> getReportById(
            @PathVariable UUID reportId) {
        
        ReportDetailResponse reportDetail = reportService.getReportById(reportId);
        ApiResponse<ReportDetailResponse> response = new ApiResponse<>(
                HttpStatus.OK,
                "Report detail retrieved successfully",
                reportDetail,
                null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * UC9.3: Xử lý report (approve/reject)
     * Chỉ dành cho Admin/Moderator
     */
    @PutMapping("/{reportId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Xử lý một báo cáo",
            description = "UC9.3: Admin/Mod xử lý report - approve (nội dung vi phạm) hoặc reject (không vi phạm). " +
                    "Cập nhật status, action taken, và ghi chú."
    )
    public ResponseEntity<ApiResponse<ReportResponse>> processReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody UpdateReportRequest request) {
        
        ReportResponse updatedReport = reportService.processReport(reportId, request);
        ApiResponse<ReportResponse> response = new ApiResponse<>(
                HttpStatus.OK,
                "Report processed successfully",
                updatedReport,
                null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Kiểm tra user đã report item này chưa
     * Dùng cho frontend để ẩn/hiện nút report hoặc hiển thị thông báo
     */
    @GetMapping("/check")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Kiểm tra đã báo cáo chưa",
            description = "Kiểm tra xem user hiện tại đã báo cáo một nội dung cụ thể chưa. " +
                    "Dùng để hiển thị trạng thái trên frontend."
    )
    public ResponseEntity<ApiResponse<Boolean>> checkAlreadyReported(
            @Parameter(description = "Loại đối tượng")
            @RequestParam ReportableType type,
            
            @Parameter(description = "ID của đối tượng")
            @RequestParam UUID id) {
        
        boolean hasReported = reportService.hasUserReported(type, id);
        ApiResponse<Boolean> response = new ApiResponse<>(
                HttpStatus.OK,
                hasReported ? "Bạn đã báo cáo nội dung này" : "Bạn chưa báo cáo nội dung này",
                hasReported,
                null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Đếm số reports đang pending
     * Dùng cho dashboard admin
     */
    @GetMapping("/count/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Đếm số báo cáo đang chờ xử lý",
            description = "UC9.1: Dùng cho Admin Dashboard để hiển thị số lượng reports cần xử lý."
    )
    public ResponseEntity<ApiResponse<Long>> countPendingReports() {
        long count = reportService.countPendingReports();
        ApiResponse<Long> response = new ApiResponse<>(
                HttpStatus.OK,
                "Pending reports count retrieved successfully",
                count,
                null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách reports của user hiện tại
     */
    @GetMapping("/my-reports")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Lấy danh sách báo cáo của tôi",
            description = "Lấy danh sách các báo cáo mà user hiện tại đã gửi."
    )
    public ResponseEntity<ApiResponse<PageResponse<ReportResponse>>> getMyReports(
            @ParameterObject 
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) 
            Pageable pageable) {
        
        PageResponse<ReportResponse> reportPage = reportService.getMyReports(pageable);
        ApiResponse<PageResponse<ReportResponse>> response = new ApiResponse<>(
                HttpStatus.OK,
                "Your reports retrieved successfully",
                reportPage,
                null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Xem chi tiết một report mà user đã tạo
     */
    @GetMapping("/my-reports/{reportId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Xem chi tiết báo cáo của tôi",
            description = "User xem chi tiết một báo cáo mà họ đã gửi. " +
                    "Bao gồm thông tin về nội dung bị báo cáo và trạng thái xử lý."
    )
    public ResponseEntity<ApiResponse<ReportDetailResponse>> getMyReportById(
            @PathVariable UUID reportId) {
        
        ReportDetailResponse reportDetail = reportService.getMyReportById(reportId);
        ApiResponse<ReportDetailResponse> response = new ApiResponse<>(
                HttpStatus.OK,
                "Your report detail retrieved successfully",
                reportDetail,
                null
        );
        return ResponseEntity.ok(response);
    }
}


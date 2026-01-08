package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreateReportRequest;
import org.example.learniversebe.dto.request.UpdateReportRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.ReportDetailResponse;
import org.example.learniversebe.dto.response.ReportResponse;
import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.enums.ReportableType;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Interface định nghĩa các nghiệp vụ liên quan đến báo cáo vi phạm
 */
public interface IReportService {

    /**
     * Tạo một báo cáo mới.
     * Kiểm tra user chưa report item này trước đó.
     * Gửi notification cho mod team.
     *
     * @param request Dữ liệu báo cáo
     * @return ReportResponse của báo cáo đã tạo
     * @throws org.example.learniversebe.exception.ResourceNotFoundException nếu đối tượng không tồn tại
     * @throws org.example.learniversebe.exception.BadRequestException nếu user đã report item này
     */
    ReportResponse createReport(CreateReportRequest request);

    /**
     * Lấy danh sách tất cả reports với filter.
     * Chỉ dành cho ADMIN/MODERATOR.
     *
     * @param status    Filter theo trạng thái (optional)
     * @param type      Filter theo loại đối tượng (optional)
     * @param startDate Filter theo ngày bắt đầu (optional)
     * @param endDate   Filter theo ngày kết thúc (optional)
     * @param pageable  Thông tin phân trang
     * @return PageResponse chứa danh sách ReportResponse
     */
    PageResponse<ReportResponse> getAllReports(
            ReportStatus status,
            ReportableType type,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);

    /**
     * Lấy chi tiết một report theo ID.
     * Bao gồm thông tin về target content và history.
     * Chỉ dành cho ADMIN/MODERATOR.
     *
     * @param reportId ID của report
     * @return ReportDetailResponse chi tiết
     * @throws org.example.learniversebe.exception.ResourceNotFoundException nếu report không tồn tại
     */
    ReportDetailResponse getReportById(UUID reportId);

    /**
     * Xử lý một report (approve/reject).
     * Chỉ dành cho ADMIN/MODERATOR.
     * Cập nhật status, actionTaken, resolvedBy, resolvedAt.
     *
     * @param reportId ID của report cần xử lý
     * @param request  Dữ liệu xử lý
     * @return ReportResponse đã được cập nhật
     * @throws org.example.learniversebe.exception.ResourceNotFoundException nếu report không tồn tại
     * @throws org.example.learniversebe.exception.BadRequestException nếu report đã được xử lý
     */
    ReportResponse processReport(UUID reportId, UpdateReportRequest request);

    /**
     * Kiểm tra user đã report item này chưa.
     *
     * @param reportableType Loại đối tượng
     * @param reportableId   ID đối tượng
     * @return true nếu đã report
     */
    boolean hasUserReported(ReportableType reportableType, UUID reportableId);

    /**
     * Đếm số reports đang pending.
     * Dùng cho dashboard admin.
     *
     * @return Số lượng reports pending
     */
    long countPendingReports();

    /**
     * Lấy danh sách reports của user hiện tại.
     *
     * @param pageable Thông tin phân trang
     * @return PageResponse chứa danh sách ReportResponse
     */
    PageResponse<ReportResponse> getMyReports(Pageable pageable);

    /**
     * Lấy chi tiết report của user hiện tại theo ID.
     * User chỉ có thể xem report mà họ đã tạo.
     *
     * @param reportId ID của report
     * @return ReportDetailResponse chi tiết
     * @throws org.example.learniversebe.exception.ResourceNotFoundException nếu report không tồn tại
     * @throws org.example.learniversebe.exception.UnauthorizedException nếu report không thuộc về user
     */
    ReportDetailResponse getMyReportById(UUID reportId);
}

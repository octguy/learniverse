package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateReportRequest;
import org.example.learniversebe.dto.request.UpdateReportRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.ReportDetailResponse;
import org.example.learniversebe.dto.response.ReportResponse;
import org.example.learniversebe.dto.response.UserResponse;
import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.enums.ReportableType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.ReportMapper;
import org.example.learniversebe.mapper.UserMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.service.IReportService;
import org.example.learniversebe.util.ServiceHelper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Slf4j
@Service
public class ReportServiceImpl implements IReportService {

    private final ReportRepository reportRepository;
    private final ContentRepository contentRepository;
    private final AnswerRepository answerRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ReportMapper reportMapper;
    private final UserMapper userMapper;
    private final ServiceHelper serviceHelper;
    private final INotificationService notificationService;

    public ReportServiceImpl(
            ReportRepository reportRepository,
            ContentRepository contentRepository,
            AnswerRepository answerRepository,
            CommentRepository commentRepository,
            UserRepository userRepository,
            ReportMapper reportMapper,
            UserMapper userMapper,
            ServiceHelper serviceHelper,
            INotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.contentRepository = contentRepository;
        this.answerRepository = answerRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.reportMapper = reportMapper;
        this.userMapper = userMapper;
        this.serviceHelper = serviceHelper;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public ReportResponse createReport(CreateReportRequest request) {
        log.info("Creating report for {} with ID: {}", request.getReportableType(), request.getReportableId());
        
        User reporter = serviceHelper.getCurrentUser();
        
        // 1. Kiểm tra đối tượng bị báo cáo có tồn tại không
        validateReportableEntity(request.getReportableType(), request.getReportableId());
        
        // 2. Kiểm tra user đã report item này chưa
        if (reportRepository.existsByReporterIdAndReportableTypeAndReportableId(
                reporter.getId(), 
                request.getReportableType(), 
                request.getReportableId())) {
            throw new BadRequestException("Bạn đã báo cáo nội dung này trước đó.");
        }
        
        // 3. Tạo Report entity
        Report report = new Report();
        report.setReporter(reporter);
        report.setReportableType(request.getReportableType());
        report.setReportableId(request.getReportableId());
        report.setReason(request.getReason());
        report.setDescription(request.getDescription());
        report.setStatus(ReportStatus.PENDING);
        
        // 4. Lưu report
        Report savedReport = reportRepository.save(report);
        log.info("Report created with ID: {}", savedReport.getId());
        
        // 5. Gửi notification cho mod team (TODO: Implement broadcast to mods)
        // notificationService.notifyModerators("New report submitted", savedReport.getId());
        
        return reportMapper.toReportResponse(savedReport);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> getAllReports(
            ReportStatus status,
            ReportableType type,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {
        
        log.info("Fetching reports with filters - status: {}, type: {}, startDate: {}, endDate: {}", 
                status, type, startDate, endDate);
        
        // Chuyển đổi LocalDate sang LocalDateTime
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        
        Page<Report> reportPage = findReportsWithFilters(status, type, startDateTime, endDateTime, pageable);
        
        return reportMapper.toPageResponse(reportPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportDetailResponse getReportById(UUID reportId) {
        log.info("Fetching report detail with ID: {}", reportId);
        
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));
        
        // Map cơ bản
        ReportDetailResponse response = reportMapper.toReportDetailResponse(report);
        
        // Lấy thông tin chi tiết về target
        enrichReportDetail(response, report);
        
        return response;
    }

    @Override
    @Transactional
    public ReportResponse processReport(UUID reportId, UpdateReportRequest request) {
        log.info("Processing report with ID: {} - status: {}, action: {}", 
                reportId, request.getStatus(), request.getActionTaken());
        
        User currentUser = serviceHelper.getCurrentUser();
        
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));
        
        // Kiểm tra report chưa được xử lý
        if (report.getStatus() != ReportStatus.PENDING) {
            throw new BadRequestException("Report đã được xử lý trước đó với trạng thái: " + report.getStatus());
        }
        
        // Cập nhật report
        report.setStatus(request.getStatus());
        report.setActionTaken(request.getActionTaken());
        report.setModeratorNote(request.getModeratorNote());
        report.setResolvedBy(currentUser);
        report.setResolvedAt(LocalDateTime.now());
        
        Report updatedReport = reportRepository.save(report);
        log.info("Report processed successfully: {}", updatedReport.getId());
        
        // TODO: Thực hiện action nếu cần (xóa content, warn user, v.v.)
        // Có thể gọi các service khác tùy theo actionTaken
        
        return reportMapper.toReportResponse(updatedReport);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReported(ReportableType reportableType, UUID reportableId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId == null) {
            return false;
        }
        return reportRepository.existsByReporterIdAndReportableTypeAndReportableId(
                currentUserId, reportableType, reportableId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingReports() {
        return reportRepository.countByStatus(ReportStatus.PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> getMyReports(Pageable pageable) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId == null) {
            throw new BadRequestException("User not authenticated");
        }
        
        Page<Report> reportPage = reportRepository.findByReporterIdOrderByCreatedAtDesc(currentUserId, pageable);
        return reportMapper.toPageResponse(reportPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportDetailResponse getMyReportById(UUID reportId) {
        log.info("Fetching my report detail with ID: {}", reportId);
        
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId == null) {
            throw new BadRequestException("User not authenticated");
        }
        
        // Tìm report thuộc về user hiện tại
        Report report = reportRepository.findByIdAndReporterId(reportId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Report not found with id: " + reportId + " or you don't have permission to view it"));
        
        // Map cơ bản
        ReportDetailResponse response = reportMapper.toReportDetailResponse(report);
        
        // Lấy thông tin chi tiết về target
        enrichReportDetail(response, report);
        
        return response;
    }

    // --- Helper Methods ---

    /**
     * Tìm reports với các filter kết hợp
     * Sử dụng các method query riêng biệt để tránh lỗi parameter type với PostgreSQL
     */
    private Page<Report> findReportsWithFilters(
            ReportStatus status, 
            ReportableType type, 
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable) {
        
        boolean hasStatus = status != null;
        boolean hasType = type != null;
        boolean hasDateRange = startDate != null && endDate != null;
        
        // Tất cả filters
        if (hasStatus && hasType && hasDateRange) {
            return reportRepository.findByStatusAndReportableTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
                    status, type, startDate, endDate, pageable);
        }
        // Status + Type
        if (hasStatus && hasType) {
            return reportRepository.findByStatusAndReportableTypeOrderByCreatedAtDesc(status, type, pageable);
        }
        // Status + Date
        if (hasStatus && hasDateRange) {
            return reportRepository.findByStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
                    status, startDate, endDate, pageable);
        }
        // Type + Date
        if (hasType && hasDateRange) {
            return reportRepository.findByReportableTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
                    type, startDate, endDate, pageable);
        }
        // Chỉ Status
        if (hasStatus) {
            return reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        }
        // Chỉ Type
        if (hasType) {
            return reportRepository.findByReportableTypeOrderByCreatedAtDesc(type, pageable);
        }
        // Chỉ Date
        if (hasDateRange) {
            return reportRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate, pageable);
        }
        // Không có filter
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    /**
     * Kiểm tra đối tượng bị báo cáo có tồn tại không
     */
    private void validateReportableEntity(ReportableType type, UUID id) {
        boolean exists = switch (type) {
            case POST, QUESTION -> contentRepository.existsById(id);
            case ANSWER -> answerRepository.existsById(id);
            case COMMENT -> commentRepository.existsById(id);
        };
        
        if (!exists) {
            throw new ResourceNotFoundException(type + " not found with id: " + id);
        }
    }

    /**
     * Bổ sung thông tin chi tiết về target cho ReportDetailResponse
     */
    private void enrichReportDetail(ReportDetailResponse response, Report report) {
        switch (report.getReportableType()) {
            case POST, QUESTION -> enrichWithContentInfo(response, report.getReportableId());
            case ANSWER -> enrichWithAnswerInfo(response, report.getReportableId());
            case COMMENT -> enrichWithCommentInfo(response, report.getReportableId());
        }
        
        // Đếm số lần target đã bị report trước đó
        long previousCount = reportRepository.countByReportableTypeAndReportableId(
                report.getReportableType(), report.getReportableId());
        response.setPreviousReportCount((int) previousCount);
    }

    /**
     * Bổ sung thông tin Content (Post/Question)
     */
    private void enrichWithContentInfo(ReportDetailResponse response, UUID contentId) {
        contentRepository.findById(contentId).ifPresent(content -> {
            response.setTargetTitle(content.getTitle());
            response.setTargetBody(content.getBody());
            response.setTargetCreatedAt(content.getCreatedAt());
            if (content.getAuthor() != null) {
                response.setTargetAuthor(userMapper.toUserResponse(content.getAuthor()));
            }
        });
    }

    /**
     * Bổ sung thông tin Answer
     */
    private void enrichWithAnswerInfo(ReportDetailResponse response, UUID answerId) {
        answerRepository.findById(answerId).ifPresent(answer -> {
            response.setTargetTitle(null); // Answer không có title
            response.setTargetBody(answer.getBody());
            response.setTargetCreatedAt(answer.getCreatedAt());
            if (answer.getAuthor() != null) {
                response.setTargetAuthor(userMapper.toUserResponse(answer.getAuthor()));
            }
        });
    }

    /**
     * Bổ sung thông tin Comment
     */
    private void enrichWithCommentInfo(ReportDetailResponse response, UUID commentId) {
        commentRepository.findById(commentId).ifPresent(comment -> {
            response.setTargetTitle(null); // Comment không có title
            response.setTargetBody(comment.getBody());
            response.setTargetCreatedAt(comment.getCreatedAt());
            if (comment.getAuthor() != null) {
                response.setTargetAuthor(userMapper.toUserResponse(comment.getAuthor()));
            }
        });
    }
}

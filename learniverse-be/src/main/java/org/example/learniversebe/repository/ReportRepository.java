package org.example.learniversebe.repository;

import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.enums.ReportableType;
import org.example.learniversebe.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID>, JpaSpecificationExecutor<Report> {

    /**
     * Tìm report theo ID
     */
    Optional<Report> findById(UUID id);

    /**
     * Kiểm tra user đã report item này chưa
     */
    boolean existsByReporterIdAndReportableTypeAndReportableId(
            UUID reporterId, 
            ReportableType reportableType, 
            UUID reportableId);

    /**
     * Tìm report theo status với phân trang
     */
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    /**
     * Tìm report theo type với phân trang
     */
    Page<Report> findByReportableType(ReportableType reportableType, Pageable pageable);

    /**
     * Tìm report theo status và type
     */
    Page<Report> findByStatusAndReportableType(
            ReportStatus status, 
            ReportableType reportableType, 
            Pageable pageable);

    /**
     * Tìm tất cả reports (không có filter)
     */
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Tìm reports chỉ theo status
     */
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    /**
     * Tìm reports chỉ theo type
     */
    Page<Report> findByReportableTypeOrderByCreatedAtDesc(ReportableType type, Pageable pageable);

    /**
     * Tìm reports theo status và type
     */
    Page<Report> findByStatusAndReportableTypeOrderByCreatedAtDesc(
            ReportStatus status, 
            ReportableType type, 
            Pageable pageable);

    /**
     * Tìm reports theo date range
     */
    Page<Report> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable);

    /**
     * Tìm reports theo status và date range
     */
    Page<Report> findByStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
            ReportStatus status,
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable);

    /**
     * Tìm reports theo type và date range
     */
    Page<Report> findByReportableTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            ReportableType type,
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable);

    /**
     * Tìm reports theo tất cả filters
     */
    Page<Report> findByStatusAndReportableTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            ReportStatus status,
            ReportableType type,
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable);

    /**
     * Đếm số report pending
     */
    long countByStatus(ReportStatus status);

    /**
     * Đếm số lần một đối tượng đã bị report
     */
    @Query("SELECT COUNT(r) FROM Report r WHERE r.reportableType = :type AND r.reportableId = :id")
    long countByReportableTypeAndReportableId(
            @Param("type") ReportableType type, 
            @Param("id") UUID id);

    /**
     * Tìm reports cho một đối tượng cụ thể
     */
    Page<Report> findByReportableTypeAndReportableId(
            ReportableType reportableType, 
            UUID reportableId, 
            Pageable pageable);

    /**
     * Tìm reports của một user (người report)
     */
    Page<Report> findByReporterIdOrderByCreatedAtDesc(UUID reporterId, Pageable pageable);

    /**
     * Tìm report theo ID và reporter ID (để user xem report của mình)
     */
    Optional<Report> findByIdAndReporterId(UUID id, UUID reporterId);
}

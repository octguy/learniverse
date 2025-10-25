package org.example.learniversebe.repository;

import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.model.ContentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ContentReportRepository extends JpaRepository<ContentReport, UUID> {

    // Lấy danh sách report theo trạng thái (ví dụ: chỉ lấy PENDING để moderator xử lý)
    Page<ContentReport> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);

    // Kiểm tra xem user đã report item này chưa
    boolean existsByReportedByIdAndReportableTypeAndReportableId(UUID userId, org.example.learniversebe.enums.ReportableType reportableType, UUID reportableId);

}

package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.learniversebe.enums.ReportActionTaken;
import org.example.learniversebe.enums.ReportReason;
import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.enums.ReportableType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity đại diện cho một báo cáo vi phạm nội dung
 * Hỗ trợ báo cáo cho: POST, QUESTION, ANSWER, COMMENT
 */
@Entity
@Table(name = "reports", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"reporter_id", "reportable_type", "reportable_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class Report extends BaseEntity {

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /**
     * Người báo cáo
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    /**
     * Loại đối tượng bị báo cáo (POST, QUESTION, ANSWER, COMMENT)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "reportable_type", nullable = false, length = 20)
    private ReportableType reportableType;

    /**
     * ID của đối tượng bị báo cáo
     */
    @Column(name = "reportable_id", nullable = false)
    private UUID reportableId;

    /**
     * Lý do báo cáo
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, length = 30)
    private ReportReason reason;

    /**
     * Mô tả chi tiết (optional, max 500 ký tự)
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * Trạng thái báo cáo
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReportStatus status = ReportStatus.PENDING;

    /**
     * Admin/Mod đã xử lý báo cáo này
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    /**
     * Thời gian xử lý báo cáo
     */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    /**
     * Hành động đã thực hiện
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_taken", length = 30)
    private ReportActionTaken actionTaken;

    /**
     * Ghi chú của moderator khi xử lý
     */
    @Column(name = "moderator_note", length = 1000)
    private String moderatorNote;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = ReportStatus.PENDING;
        }
        this.setCreatedAt(now);
        this.setUpdatedAt(now);
    }

    @PreUpdate
    protected void onUpdate() {
        this.setUpdatedAt(LocalDateTime.now());
    }
}

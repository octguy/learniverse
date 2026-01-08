package org.example.learniversebe.enums;

/**
 * Enum định nghĩa trạng thái của một báo cáo
 */
public enum ReportStatus {
    PENDING,    // Đang chờ xử lý
    RESOLVED,   // Đã xử lý (vi phạm)
    REJECTED    // Đã từ chối (không vi phạm)
}

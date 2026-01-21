package org.example.learniversebe.enums;

/**
 * Enum định nghĩa các hành động đã thực hiện khi xử lý báo cáo
 */
public enum ReportActionTaken {
    NONE,           // Chưa có hành động
    CONTENT_DELETED,// Nội dung đã bị xóa
    USER_WARNED,    // Người dùng đã bị cảnh cáo
    USER_SUSPENDED, // Người dùng đã bị tạm khóa
    USER_BANNED,    // Người dùng đã bị cấm
    NO_VIOLATION,   // Không vi phạm
    CONTENT_RESTORED // Nội dung được khôi phục (dành cho auto-flag)
}

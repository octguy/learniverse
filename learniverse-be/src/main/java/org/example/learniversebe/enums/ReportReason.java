package org.example.learniversebe.enums;

/**
 * Enum định nghĩa các lý do báo cáo vi phạm
 */
public enum ReportReason {
    SPAM,           // Spam
    INAPPROPRIATE,  // Nội dung không phù hợp
    HARASSMENT,     // Quấy rối
    COPYRIGHT,      // Vi phạm bản quyền
    OFF_TOPIC,      // Không liên quan (off-topic)
    DUPLICATE,      // Trùng lặp
    TOXIC,          // Độc hại (toxic)
    OTHER           // Khác
}

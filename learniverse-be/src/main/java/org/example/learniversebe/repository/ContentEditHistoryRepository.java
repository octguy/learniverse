package org.example.learniversebe.repository;

import org.example.learniversebe.model.ContentEditHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ContentEditHistoryRepository extends JpaRepository<ContentEditHistory, UUID> {

    // Lấy lịch sử chỉnh sửa của một content, sắp xếp theo thời gian mới nhất trước
    Page<ContentEditHistory> findByContentIdOrderByEditedAtDesc(UUID contentId, Pageable pageable);
}

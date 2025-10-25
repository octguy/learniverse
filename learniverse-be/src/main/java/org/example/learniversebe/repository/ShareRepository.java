package org.example.learniversebe.repository;

import org.example.learniversebe.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ShareRepository extends JpaRepository<Share, UUID> {

    // Đếm số lượt share cho một content
    long countByContentId(UUID contentId);

    // Có thể thêm các query khác nếu cần phân tích hành vi chia sẻ
}

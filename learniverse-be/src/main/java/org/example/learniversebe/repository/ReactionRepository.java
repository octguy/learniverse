package org.example.learniversebe.repository;

import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.ReactionType;
import org.example.learniversebe.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {

    // Tìm một reaction cụ thể của user cho một item
    Optional<Reaction> findByUserIdAndReactableTypeAndReactableIdAndReactionType(
            UUID userId, ReactableType reactableType, UUID reactableId, ReactionType reactionType);

    // Tìm tất cả reaction của user cho một item (để kiểm tra xem user đã react chưa, dù là type nào)
    List<Reaction> findByUserIdAndReactableTypeAndReactableId(
            UUID userId, ReactableType reactableType, UUID reactableId);

    // Đếm số lượng reaction theo type cho một item
    long countByReactableTypeAndReactableIdAndReactionType(
            ReactableType reactableType, UUID reactableId, ReactionType reactionType);

    // Lấy tất cả reaction cho một item
    List<Reaction> findByReactableTypeAndReactableId(
            ReactableType reactableType, UUID reactableId);
}

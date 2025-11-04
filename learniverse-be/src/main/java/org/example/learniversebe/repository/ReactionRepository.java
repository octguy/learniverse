package org.example.learniversebe.repository;

import jakarta.validation.constraints.NotNull;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.ReactionType;
import org.example.learniversebe.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {

    // Tìm tất cả reaction của user cho một item (để kiểm tra xem user đã react chưa, dù là type nào)
    Optional<Reaction> findByUserIdAndReactableTypeAndReactableId(
            UUID userId, ReactableType reactableType, UUID reactableId);

    // Đếm số lượng reaction theo type cho một item
    long countByReactableTypeAndReactableIdAndReactionType(
            ReactableType reactableType, UUID reactableId, ReactionType reactionType);

    // Lấy tất cả reaction cho một item
    List<Reaction> findByReactableTypeAndReactableId(
            ReactableType reactableType, UUID reactableId);

    void deleteByReactableTypeAndReactableIdAndUserId(ReactableType reactableType, UUID reactableId, UUID id);

    @Modifying
    @Query("UPDATE Reaction r SET r.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE r.reactableType = :reactableType " +
            "AND r.reactableId = :reactableId " +
            "AND r.deletedAt IS NULL")
    void softDeleteByReactable(@Param("reactableType") ReactableType reactableType, @Param("reactableId") UUID reactableId);

    Optional<Reaction> findByReactableTypeAndReactableIdAndUserIdAndReactionType(ReactableType reactableType, UUID reactableId, UUID id, @NotNull(message = "Reaction type cannot be null") ReactionType reactionType);
}

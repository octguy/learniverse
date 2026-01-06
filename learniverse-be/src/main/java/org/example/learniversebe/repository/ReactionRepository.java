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

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {

    // Tìm tất cả reaction của user cho một item (để kiểm tra xem user đã react chưa, dù là type nào)
    Optional<Reaction> findByUserIdAndReactableTypeAndReactableId(
            UUID userId, ReactableType reactableType, UUID reactableId);

    @Query(value = "SELECT * FROM reactions r " +
            "WHERE r.user_id = :userId " +
            "AND r.reactable_type = :#{#type.name()} " +
            "AND r.reactable_id = :reactableId " +
            "LIMIT 1", nativeQuery = true)
    Optional<Reaction> findExistingReactionRaw(
            @Param("userId") UUID userId,
            @Param("type") ReactableType type,
            @Param("reactableId") UUID reactableId);

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
    int softDeleteByReactable(@Param("reactableType") ReactableType reactableType, @Param("reactableId") UUID reactableId);

    Optional<Reaction> findByReactableTypeAndReactableIdAndUserIdAndReactionType(ReactableType reactableType, UUID reactableId, UUID id, @NotNull(message = "Reaction type cannot be null") ReactionType reactionType);

    /**
     * Tìm tất cả reaction của user trong một danh sách các item (dùng để map hàng loạt).
     */
    List<Reaction> findByUserIdAndReactableTypeAndReactableIdIn(
            UUID userId,
            ReactableType reactableType,
            Collection<UUID> reactableIds
    );
}

package org.example.learniversebe.repository;

import org.example.learniversebe.model.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, UUID> {

    /** Tìm bookmark của user cho một content cụ thể
     * @param userId Id người dùng
     * @param contentId Id content
     * @return Bookmark
     */
    Optional<Bookmark> findByUserIdAndContentId(UUID userId, UUID contentId);

    /** Tìm bookmark kể cả đã xóa mềm (để xử lý restore)
     */
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId AND b.content.id = :contentId")
    Optional<Bookmark> findByUserIdAndContentIdIncludingDeleted(
            @Param("userId") UUID userId,
            @Param("contentId") UUID contentId);

    @Query("SELECT b FROM Bookmark b JOIN FETCH b.content c LEFT JOIN FETCH c.author WHERE b.user.id = :userId AND b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Bookmark> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    // Đếm số bookmark của user
    long countByUserId(UUID userId);

    // Đếm số lượt bookmark cho một content
    long countByContentId(UUID contentId);

    boolean existsByUserIdAndContentId(UUID currentUserId, UUID contentId);

    @Query("SELECT b FROM Bookmark b JOIN FETCH b.content c LEFT JOIN FETCH c.author WHERE b.user.id = :userId AND LOWER(b.collectionName) = LOWER(:collectionName) ORDER BY b.createdAt DESC")
    Page<Bookmark> findByUserIdAndCollectionNameIgnoreCaseOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            @Param("collectionName") String collectionName,
            Pageable pageable
    );
    /**
     * Xóa mềm tất cả bookmarks của một content
     */
    @Modifying
    @Query("UPDATE Bookmark b SET b.deletedAt = CURRENT_TIMESTAMP WHERE b.content.id = :contentId AND b.deletedAt IS NULL")
    void softDeleteByContentId(@Param("contentId") UUID contentId);
}

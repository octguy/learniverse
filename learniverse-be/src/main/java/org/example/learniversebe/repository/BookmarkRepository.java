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

    /**
     * Tìm bookmark của user cho content, CHỈ những bookmark active (chưa bị xóa)
     */
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId AND b.content.id = :contentId AND b.deletedAt IS NULL")
    Optional<Bookmark> findByUserIdAndContentId(
            @Param("userId") UUID userId,
            @Param("contentId") UUID contentId);

    /**
     * Native Query để tìm bookmark bất kể trạng thái deletedAt
     */
    @Query(value = "SELECT * FROM bookmarks b WHERE b.user_id = :userId AND b.content_id = :contentId", nativeQuery = true)
    Optional<Bookmark> findByUserIdAndContentIdRaw(@Param("userId") UUID userId, @Param("contentId") UUID contentId);

    /**
     * Tìm bookmark của user cho content, BAO GỒM CẢ đã soft delete
     */
    @Query(value = "SELECT * FROM bookmarks b WHERE b.user_id = :userId AND b.content_id = :contentId", nativeQuery = true)
    Optional<Bookmark> findByUserIdAndContentIdIncludingDeleted(
            @Param("userId") UUID userId,
            @Param("contentId") UUID contentId);

    /**
     * Kiểm tra xem user đã bookmark content chưa (chỉ active bookmarks)
     */
    @Query("SELECT COUNT(b) > 0 FROM Bookmark b WHERE b.user.id = :userId AND b.content.id = :contentId AND b.deletedAt IS NULL")
    boolean existsByUserIdAndContentId(
            @Param("userId") UUID userId,
            @Param("contentId") UUID contentId);

    /**
     * Lấy tất cả bookmarks của user (chỉ active)
     */
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId AND b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Bookmark> findByUserIdOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            Pageable pageable);

    /**
     * Lấy bookmarks của user theo collection name (chỉ active)
     */
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId " +
            "AND LOWER(b.collectionName) = LOWER(:collectionName) " +
            "AND b.deletedAt IS NULL " +
            "ORDER BY b.createdAt DESC")
    Page<Bookmark> findByUserIdAndCollectionNameIgnoreCaseOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            @Param("collectionName") String collectionName,
            Pageable pageable);

    /**
     * Đếm số bookmark cho một content (chỉ active)
     */
    @Query("SELECT COUNT(b) FROM Bookmark b WHERE b.content.id = :contentId AND b.deletedAt IS NULL")
    long countByContentId(@Param("contentId") UUID contentId);

    /**
     * Lấy tất cả collection names của user (distinct, chỉ active)
     */
    @Query("SELECT DISTINCT b.collectionName FROM Bookmark b " +
            "WHERE b.user.id = :userId " +
            "AND b.collectionName IS NOT NULL " +
            "AND b.deletedAt IS NULL " +
            "ORDER BY b.collectionName")
    Page<String> findDistinctCollectionNamesByUserId(
            @Param("userId") UUID userId,
            Pageable pageable);

    /**
     * Soft delete all bookmarks for a content
     */
    @Modifying
    @Query("UPDATE Bookmark b SET b.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE b.content.id = :contentId AND b.deletedAt IS NULL")
    int softDeleteByContentId(@Param("contentId") UUID contentId);
}
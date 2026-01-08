package org.example.learniversebe.repository;

import org.example.learniversebe.enums.GroupPrivacy;
import org.example.learniversebe.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupRepository extends JpaRepository<Group, UUID> {

    Optional<Group> findBySlug(String slug);

    boolean existsBySlug(String slug);

    // Find all public groups for discovery
    Page<Group> findByPrivacy(GroupPrivacy privacy, Pageable pageable);

    // Search groups by name or description
    @Query("SELECT g FROM Group g WHERE " +
           "(LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(g.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:privacy IS NULL OR g.privacy = :privacy)")
    Page<Group> searchGroups(@Param("query") String query, 
                             @Param("privacy") GroupPrivacy privacy, 
                             Pageable pageable);

    // Find groups by tag
    @Query("SELECT g FROM Group g JOIN g.groupTags gt WHERE gt.tag.id = :tagId")
    Page<Group> findByTagId(@Param("tagId") UUID tagId, Pageable pageable);

    // Count groups created by user
    long countByCreatedById(UUID userId);
}

package org.example.learniversebe.repository;

import org.example.learniversebe.model.GroupTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GroupTagRepository extends JpaRepository<GroupTag, UUID> {

    List<GroupTag> findByGroupId(UUID groupId);

    void deleteByGroupId(UUID groupId);

    boolean existsByGroupIdAndTagId(UUID groupId, UUID tagId);
}

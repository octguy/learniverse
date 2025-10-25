package org.example.learniversebe.repository;

import org.example.learniversebe.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByContentId(UUID contentId);
    Optional<Attachment> findByStorageKey(String storageKey);
}

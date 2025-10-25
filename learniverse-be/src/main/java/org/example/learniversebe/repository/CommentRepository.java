package org.example.learniversebe.repository;

import org.example.learniversebe.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    // Tìm comment gốc
    Page<Comment> findByCommentableTypeAndCommentableIdAndParentIsNullOrderByCreatedAtAsc(String commentableType, UUID commentableId, Pageable pageable);

    // Tìm các replies cho một comment cha
    Page<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId, Pageable pageable);
}

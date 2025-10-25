package org.example.learniversebe.repository;

import org.example.learniversebe.model.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {
    // Tìm câu trả lời cho một câu hỏi, sắp xếp theo điểm vote hoặc isAccepted trước
    Page<Answer> findByQuestionIdOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(UUID questionId, Pageable pageable);

    List<Answer> findByAuthorId(UUID authorId);
}

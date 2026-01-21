package org.example.learniversebe.service;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.model.Answer;
import org.example.learniversebe.model.Comment;
import org.example.learniversebe.repository.AnswerRepository;
import org.example.learniversebe.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AutoFlagContentService {

    private final AnswerRepository answerRepository;
    private final CommentRepository commentRepository;

    public AutoFlagContentService(AnswerRepository answerRepository, CommentRepository commentRepository) {
        this.answerRepository = answerRepository;
        this.commentRepository = commentRepository;
    }

    /**
     * Saves a hidden answer in a separate transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Answer saveHiddenAnswer(Answer answer) {
        answer.setIsVisible(false);
        Answer saved = answerRepository.save(answer);
        log.info("Hidden answer saved with ID: {}", saved.getId());
        return saved;
    }

    /**
     * Saves a hidden comment in a separate transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Comment saveHiddenComment(Comment comment) {
        comment.setIsVisible(false);
        Comment saved = commentRepository.save(comment);
        log.info("Hidden comment saved with ID: {}", saved.getId());
        return saved;
    }
}

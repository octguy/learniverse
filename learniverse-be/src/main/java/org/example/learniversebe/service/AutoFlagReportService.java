package org.example.learniversebe.service;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.enums.ReportReason;
import org.example.learniversebe.enums.ReportStatus;
import org.example.learniversebe.enums.ReportableType;
import org.example.learniversebe.model.Answer;
import org.example.learniversebe.model.Comment;
import org.example.learniversebe.model.Report;
import org.example.learniversebe.repository.ReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AutoFlagReportService {

    private final ReportRepository reportRepository;

    public AutoFlagReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    /**
     * Creates system report in a SEPARATE transaction so it won't be rolled back
     * when the caller throws an exception.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Report createForAnswer(Answer answer) {
        Report report = new Report();
        report.setReportableType(ReportableType.ANSWER);
        report.setReportableId(answer.getId());
        report.setReason(ReportReason.SYSTEM_AUTO_FLAG);
        report.setDescription("Nội dung tự động bị gắn cờ bởi AI: " +
                answer.getBody().substring(0, Math.min(200, answer.getBody().length())));
        report.setStatus(ReportStatus.PENDING);
        report.setReporter(null); // System generated, no reporter

        Report saved = reportRepository.save(report);
        log.info("System report created with ID: {} for answer: {}", saved.getId(), answer.getId());
        return saved;
    }

    /**
     * Creates system report in a SEPARATE transaction so it won't be rolled back
     * when the caller throws an exception.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Report createForComment(Comment comment) {
        Report report = new Report();
        report.setReportableType(ReportableType.COMMENT);
        report.setReportableId(comment.getId());
        report.setReason(ReportReason.SYSTEM_AUTO_FLAG);
        report.setDescription("Nội dung tự động bị gắn cờ bởi AI: " +
                comment.getBody().substring(0, Math.min(200, comment.getBody().length())));
        report.setStatus(ReportStatus.PENDING);
        report.setReporter(null); // System generated, no reporter

        Report saved = reportRepository.save(report);
        log.info("System report created with ID: {} for comment: {}", saved.getId(), comment.getId());
        return saved;
    }
}

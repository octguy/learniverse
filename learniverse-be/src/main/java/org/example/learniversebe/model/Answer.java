package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.learniversebe.enums.AttachmentType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="\"answers\"")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE answers SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Answer extends BaseEntity {
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Content question; // Liên kết đến Content (chỉ question mới có answer)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(nullable = false)
    private Integer voteScore = 0;

    @Column(nullable = false)
    private Integer upvoteCount = 0;

    @Column(nullable = false)
    private Integer downvoteCount = 0;

    @Column(nullable = false)
    private Boolean isAccepted = false;

    @OneToOne(mappedBy = "acceptedAnswer", fetch = FetchType.LAZY)
    private Content acceptedInQuestion;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        this.setCreatedAt(now);
        this.setUpdatedAt(now);
    }

    @PreUpdate
    protected void onUpdate() {
        this.setUpdatedAt(LocalDateTime.now());
    }
}

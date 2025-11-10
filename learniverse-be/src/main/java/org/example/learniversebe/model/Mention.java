package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="\"mentions\"", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"comment_id", "mentioned_user_id"}, name = "uq_mention_per_comment")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE mentions SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Mention extends BaseEntity {
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentioned_user_id", nullable = false)
    private User mentionedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentioned_by", nullable = false)
    private User mentionedBy;

    @Column(name = "is_notified")
    private Boolean isNotified = false;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        this.setCreatedAt(now);
        this.setUpdatedAt(now);
    }

}

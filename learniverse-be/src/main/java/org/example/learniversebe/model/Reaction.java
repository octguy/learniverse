package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.ReactionType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="\"reactions\"", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"reactable_type", "reactable_id", "user_id", "reaction_type"}, name = "uq_reaction_per_user_item_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE reactions SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Reaction extends BaseEntity {
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "reactable_type", nullable = false)
    private ReactableType reactableType;

    @Column(name = "reactable_id", nullable = false)
    private UUID reactableId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "reaction_type", nullable = false)
    private ReactionType reactionType;

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

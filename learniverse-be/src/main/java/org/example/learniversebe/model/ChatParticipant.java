package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.enums.GroupChatRole;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name="chat_participant",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"chat_room_id", "participant_id"},
                        name = "uq_chat_participant_per_room"
                )
        }
)
@Getter
@Setter
@SQLRestriction("deleted_at IS NULL")
public class ChatParticipant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="invited_by")
    private User invitedBy; // null for who creates direct messages

    @Column(name="joined_at")
    private LocalDateTime joinedAt;

    @Column(name="last_read_at")
    private LocalDateTime lastReadAt;

    @Enumerated(EnumType.STRING)
    @Column(name="chat_role", nullable = false, length = 50)
    private GroupChatRole chatRole;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.setCreatedAt(now);
        this.setUpdatedAt(now);
        this.setJoinedAt(LocalDateTime.now());
    }

    @PreUpdate
    protected void onUpdate() {
        this.setUpdatedAt(LocalDateTime.now());
    }
}

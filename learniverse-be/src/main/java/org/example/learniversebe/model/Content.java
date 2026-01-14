package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ContentVisibility;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name="\"contents\"")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE contents SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Content extends BaseEntity {
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ContentStatus status = ContentStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false)
    private ContentVisibility visibility = ContentVisibility.PUBLIC;

    @Column(length = 300)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(length = 400, unique = true)
    private String slug;

    @Column(nullable = false)
    private Integer viewCount = 0;

    // Denormalized
    @Column(nullable = false)
    private Integer commentCount = 0;

    @Column(nullable = false)
    private Integer reactionCount = 0;

    @Column(nullable = false)
    private Integer bookmarkCount = 0;

    @Column(nullable = false)
    private Integer shareCount = 0;

    // Q&A
    private Integer voteScore = 0;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_answer_id")
    private Answer acceptedAnswer;

    @Column(nullable = false)
    private Integer answerCount = 0;

    private Boolean isAnswered = false;

    private LocalDateTime publishedAt;
    private LocalDateTime lastEditedAt;

    @Column(columnDefinition = "tsvector", insertable = false, updatable = false)
    private String searchVector;

    @OneToMany(mappedBy = "content", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ContentTag> contentTags = new HashSet<>();

    @OneToMany(mappedBy = "content", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<Attachment> attachments = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_content_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Content originalContent;

    // Group post support
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Group group;

    @Column(name = "is_pinned", nullable = false, columnDefinition = "boolean default false")
    private Boolean isPinned = false;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        this.setCreatedAt(now);
        this.setUpdatedAt(now);
        // Có thể thêm logic tạo slug tự động ở đây nếu muốn

        if (this.group != null && this.visibility == null) {
            this.visibility = ContentVisibility.GROUP;
        } else if (this.visibility == null) {
            this.visibility = ContentVisibility.PUBLIC;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.setUpdatedAt(LocalDateTime.now());
    }

    // Helper method để thêm attachment
//    public void addAttachment(Attachment attachment) {
//        attachments.add(attachment);
//        attachment.setContent(this);
//    }
//
//    public void removeAttachment(Attachment attachment) {
//        attachments.remove(attachment);
//        attachment.setContent(null);
//    }
}

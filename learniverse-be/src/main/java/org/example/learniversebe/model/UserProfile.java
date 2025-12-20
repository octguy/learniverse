package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.*;

import java.security.Timestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name="user_profile")
@NoArgsConstructor
@Getter
@Setter
public class UserProfile extends BaseEntity {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    @Column(name="display_name")
    private String displayName;

    @Column(name="bio", length=500)
    private String bio;

    @Column(name="avatar_url")
    private String avatarUrl;

    @Column(name="cover_url")
    private String coverUrl;

    @Column(name="post_count")
    private int postCount = 0;

    @Column(name="answered_question_count")
    private int answeredQuestionCount = 0;

    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserProfileTag> userProfileTags = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.setCreatedAt(now);
        this.setUpdatedAt(now);
    }

    @PreUpdate
    protected void onUpdate() {
        this.setUpdatedAt(LocalDateTime.now());
    }
}

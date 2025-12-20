package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.enums.UserTagType;
import org.example.learniversebe.model.composite_key.UserProfileTagId;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name="user_profile_tag")
@Getter
@Setter
public class UserProfileTag extends BaseEntity {

    @EmbeddedId
    private UserProfileTagId userProfileTagId;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userProfileId")
    @JoinColumn(name="user_profile_id", nullable = false)
    private UserProfile userProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name="tag_id", nullable = false)
    private Tag tag;

    private UserTagType type;

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
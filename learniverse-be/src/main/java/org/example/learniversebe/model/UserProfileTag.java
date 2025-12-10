package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.model.composite_key.UserProfileTagId;
import java.time.LocalDateTime;

@Entity
@Table(name="user_profile_tag")
@Getter
@Setter
public class UserProfileTag extends BaseEntity {

    @EmbeddedId
    private UserProfileTagId userProfileTagId = new UserProfileTagId();

    @ManyToOne
    @MapsId("userProfileId")
    @JoinColumn(name="user_profile_id", nullable = false)
    private UserProfile userProfile;

    @ManyToOne
    @MapsId("userTagId")
    @JoinColumn(name="user_tag_id", nullable = false)
    private UserTag userTag;

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
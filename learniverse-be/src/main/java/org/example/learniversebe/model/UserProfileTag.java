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
    @MapsId("userTagId")
    @JoinColumn(name="user_tag_id", nullable = false)
    private UserTag userTag;

    public UserTagType getType() {
        return userProfileTagId != null ? userProfileTagId.getType() : null;
    }

    public void setType(UserTagType type) {
        if (this.userProfileTagId == null) {
            this.userProfileTagId = new UserProfileTagId();
        }
        this.userProfileTagId.setType(type);
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.getCreatedAt() == null) this.setCreatedAt(now);
        this.setUpdatedAt(now);
    }

    @PreUpdate
    protected void onUpdate() {
        this.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserProfileTag that = (UserProfileTag) o;
        return Objects.equals(userProfileTagId, that.userProfileTagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userProfileTagId);
    }
}
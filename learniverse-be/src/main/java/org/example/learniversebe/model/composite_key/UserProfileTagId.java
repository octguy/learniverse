package org.example.learniversebe.model.composite_key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import org.example.learniversebe.enums.UserTagType;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileTagId implements Serializable {

    @Column(name="user_profile_id", columnDefinition = "uuid")
    private UUID userProfileId;

    @Column(name="tag_id", columnDefinition = "uuid")
    private UUID tagId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50)
    private UserTagType type;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserProfileTagId that = (UserProfileTagId) o;
        return Objects.equals(userProfileId, that.userProfileId) &&
                Objects.equals(tagId, that.tagId) &&
                type == that.type;
    }

    @Override
    public int hashCode() {
        return Objects.hash(userProfileId, tagId, type);
    }
}
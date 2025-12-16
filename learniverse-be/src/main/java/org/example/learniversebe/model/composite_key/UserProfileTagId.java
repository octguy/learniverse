package org.example.learniversebe.model.composite_key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import org.example.learniversebe.enums.UserTagType;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserProfileTagId implements Serializable {

    @Column(name="user_profile_id", columnDefinition = "uuid")
    private UUID userProfileId;

    @Column(name="tag_id", columnDefinition = "uuid")
    private UUID tagId;
}
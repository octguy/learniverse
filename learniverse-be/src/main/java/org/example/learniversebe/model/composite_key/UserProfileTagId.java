package org.example.learniversebe.model.composite_key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Embeddable
@Getter
@Setter
public class UserProfileTagId {
    @Column(name="user_profile_id", columnDefinition = "uuid")
    private UUID userProfileId;

    @Column(name="user_tag_id", columnDefinition = "uuid")
    private UUID userTagId;
}



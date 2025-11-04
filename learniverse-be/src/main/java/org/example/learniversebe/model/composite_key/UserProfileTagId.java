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
    @Column(name="user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name="role_id", columnDefinition = "uuid")
    private UUID userTagId;
}



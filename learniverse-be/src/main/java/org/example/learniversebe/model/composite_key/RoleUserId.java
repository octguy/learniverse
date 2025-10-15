package org.example.learniversebe.model.composite_key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
public class RoleUserId implements Serializable {

    @Column(name="user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name="role_id", columnDefinition = "uuid")
    private UUID roleId;
}

package org.example.learniversebe.model.composite_key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Setter
@Getter
public class RoleUserId implements Serializable {

    @Column(name="user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name="role_id", columnDefinition = "uuid")
    private UUID roleId;
}

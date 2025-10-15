package org.example.learniversebe.model;

import jakarta.persistence.*;
import org.example.learniversebe.model.composite_key.RoleUserId;

@Entity
public class RoleUser extends BaseEntity {

    @EmbeddedId
    private RoleUserId roleUserId;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name="user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @ManyToOne
    @MapsId("roleId")
    @JoinColumn(name="role_id", referencedColumnName = "id", nullable = false)
    private Role role;
}

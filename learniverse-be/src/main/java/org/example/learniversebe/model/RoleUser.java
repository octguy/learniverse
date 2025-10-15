package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.model.composite_key.RoleUserId;

@Entity
@Table(name="role_user")
@Setter
@Getter
public class RoleUser extends BaseEntity {

    @EmbeddedId
    private RoleUserId roleUserId = new RoleUserId(); // initialize to avoid NullPointerException

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name="user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @ManyToOne
    @MapsId("roleId")
    @JoinColumn(name="role_id", referencedColumnName = "id", nullable = false)
    private Role role;
}

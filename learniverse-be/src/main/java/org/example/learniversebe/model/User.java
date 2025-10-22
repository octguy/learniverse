package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.enums.UserStatus;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name="\"user\"")
@Getter
@Setter
public class User extends BaseEntity {

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name="username", unique = true, nullable = false, length = 50)
    private String username;

    @Column(name="email", unique = true, nullable = false, length = 50)
    private String email;

    @Column(name="enabled", nullable = false)
    private boolean enabled;

    @Enumerated(EnumType.STRING)
    @Column(name="status", nullable = false)
    private UserStatus status;

    @Column(name="last_login_at")
    private LocalDateTime lastLoginAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RoleUser> roleUsers = new HashSet<>();

    public void addRole(Role role) {
//        System.out.println("User ID = " + this.getId());
//        System.out.println("Role ID = " + role.getId());
        RoleUser roleUser = new RoleUser();
        roleUser.setRole(role);
        roleUser.setUser(this);
        roleUser.setCreatedAt(LocalDateTime.now());
        roleUser.setUpdatedAt(LocalDateTime.now());
        this.roleUsers.add(roleUser);
        // not necessary to set roleUserId here, it will be set automatically (thanks to @MapsId)
        // only if it was initialized, otherwise BUMP  :D
    }
}

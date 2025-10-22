package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.enums.UserRole;

import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "\"role\"")
@Getter
@Setter
public class Role extends BaseEntity {

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name="name", unique = true, nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private UserRole name;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RoleUser> roleUsers;
}

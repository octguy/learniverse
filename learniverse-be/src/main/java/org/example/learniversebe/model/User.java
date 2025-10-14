package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name="\"user\"")
@Getter
@Setter
public class User implements UserDetails {

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name="username", unique = true, nullable = false, length = 50)
    private String username;

    @Column(name="email", unique = true, nullable = false, length = 50)
    private String email;

    @Column(name="password", nullable = false, length = 200)
    private String password;

    @Column(name="enabled", nullable = false)
    private boolean enabled;

    @Column(name="verification_code", length = 6)
    private String verificationCode;

    @Column(name="verification_expiration")
    private LocalDateTime verificationExpiration;

    @Column(name="last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name="created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    public User() {}

    public User(UUID id, String username, String email, String password, boolean enabled, String verificationCode, LocalDateTime verificationExpiration, LocalDateTime lastLoginAt, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.enabled = enabled;
        this.verificationCode = verificationCode;
        this.verificationExpiration = verificationExpiration;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
    }
    // Implement below methods by logic later on
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}

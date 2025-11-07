package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="auth_credential")
@Getter
@Setter
@SQLRestriction("deleted_at IS NULL")
public class AuthCredential extends BaseEntity {

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name="password", nullable = false, length = 200)
    private String password;

    @Column(name="verfication_code", length = 6)
    private String verificationCode;

    @Column(name="verification_expiration")
    private LocalDateTime verificationExpiration;

    @Column(name="last_password_change_at")
    private LocalDateTime lastPasswordChangeAt;
}

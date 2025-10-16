package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="password_reset_token")
@Getter
@Setter
public class PasswordResetToken extends BaseEntity {

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name="token", nullable = false, length = 200)
    private String token;

    @Column(name="expiration", nullable = false)
    private LocalDateTime expiration;
}

package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.example.learniversebe.enums.FriendStatus;

import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "friend", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id_1", "user_id_2"})
})
public class Friend extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id_1", nullable = false)
    private UUID userId1;

    @Column(name = "user_id_2", nullable = false)
    private UUID userId2;

    @Column(name = "action_user_id", nullable = false)
    private UUID actionUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FriendStatus status;
}
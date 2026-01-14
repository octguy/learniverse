package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.*;
import org.example.learniversebe.model.composite_key.RoleUserId;
import org.hibernate.proxy.HibernateProxy;

import java.util.Objects;

@Entity
@Table(name="role_user")
@Setter
@Getter
@ToString
@RequiredArgsConstructor
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

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy ? ((HibernateProxy) o).getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        RoleUser roleUser = (RoleUser) o;
        return getRoleUserId() != null && Objects.equals(getRoleUserId(), roleUser.getRoleUserId());
    }

    @Override
    public final int hashCode() {
        return Objects.hash(roleUserId);
    }
}

package org.example.learniversebe.model.composite_key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.proxy.HibernateProxy;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
@Setter
@Getter
public class RoleUserId implements Serializable {

    @Column(name="user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name="role_id", columnDefinition = "uuid")
    private UUID roleId;

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy ? ((HibernateProxy) o).getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        RoleUserId that = (RoleUserId) o;
        return getUserId() != null && Objects.equals(getUserId(), that.getUserId())
                && getRoleId() != null && Objects.equals(getRoleId(), that.getRoleId());
    }

    @Override
    public final int hashCode() {
        return Objects.hash(userId, roleId);
    }
}

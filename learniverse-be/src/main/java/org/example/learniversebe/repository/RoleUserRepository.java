package org.example.learniversebe.repository;

import org.example.learniversebe.model.RoleUser;
import org.example.learniversebe.model.composite_key.RoleUserId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RoleUserRepository extends JpaRepository<RoleUser, RoleUserId> {

    @Query(value =  """
            select exists (
                    select 1
                    from role_user ru
                    join "role" r on ru.role_id = r.id
                    where r.name = 'ROLE_ADMIN'
                )
  """, nativeQuery = true)
    boolean existsOneAdmin();
}

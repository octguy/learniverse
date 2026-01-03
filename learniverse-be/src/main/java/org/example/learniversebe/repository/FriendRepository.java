package org.example.learniversebe.repository;

import org.example.learniversebe.enums.FriendStatus;
import org.example.learniversebe.model.Friend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId1 AND f.userId2 = :userId2) OR (f.userId1 = :userId2 AND f.userId2 = :userId1)")
    Optional<Friend> findRelationship(UUID userId1, UUID userId2);

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId OR f.userId2 = :userId) AND f.status = :status AND f.actionUserId <> :userId")
    List<Friend> findPendingRequestsToUser(@Param("userId") UUID userId, @Param("status") FriendStatus status);

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId OR f.userId2 = :userId) AND f.status = :status")
    List<Friend> findAcceptedFriends(@Param("userId") UUID userId, @Param("status") FriendStatus status);

    Optional<Friend> findByUserId1AndUserId2(UUID userId1, UUID userId2);

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId OR f.userId2 = :userId) AND f.status = :status AND f.actionUserId = :userId")
    List<Friend> findPendingRequestsFromUser(@Param("userId") UUID userId, @Param("status") FriendStatus status);

    boolean existsByUserId1AndUserId2AndStatus(UUID userId1, UUID userId2, FriendStatus status);
    @Query("SELECT DISTINCT CASE WHEN f.userId1 = :userId THEN f.userId2 ELSE f.userId1 END " +
            "FROM Friend f " +
            "WHERE (f.userId1 = :userId OR f.userId2 = :userId) " +
            "AND (f.status = :acceptedStatus OR f.status = :pendingStatus)")
    List<UUID> findAllRelatedUserIds(@Param("userId") UUID userId,
                                     @Param("acceptedStatus") FriendStatus acceptedStatus,
                                     @Param("pendingStatus") FriendStatus pendingStatus);
}

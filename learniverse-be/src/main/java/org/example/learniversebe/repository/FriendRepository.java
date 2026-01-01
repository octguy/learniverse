package org.example.learniversebe.repository;

import org.example.learniversebe.enums.FriendStatus;
import org.example.learniversebe.model.Friend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId1 AND f.userId2 = :userId2) OR (f.userId1 = :userId2 AND f.userId2 = :userId1)")
    Optional<Friend> findRelationship(UUID userId1, UUID userId2);

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId OR f.userId2 = :userId) AND f.status = 'PENDING' AND f.actionUserId <> :userId")
    List<Friend> findPendingRequestsToUser(UUID userId);

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId OR f.userId2 = :userId) AND f.status = 'ACCEPTED'")
    List<Friend> findAcceptedFriends(UUID userId);

    Optional<Friend> findByUserId1AndUserId2(UUID userId1, UUID userId2);

    @Query("SELECT f FROM Friend f WHERE (f.userId1 = :userId OR f.userId2 = :userId) AND f.status = 'PENDING' AND f.actionUserId = :userId")
    List<Friend> findPendingRequestsFromUser(UUID userId);

    boolean existsByUserId1AndUserId2AndStatus(UUID userId1, UUID userId2, FriendStatus status);
}

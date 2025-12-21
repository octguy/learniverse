package org.example.learniversebe.repository;

import org.example.learniversebe.enums.VotableType;
import org.example.learniversebe.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoteRepository extends JpaRepository<Vote, UUID> {

    // Tìm vote của một user cho một item cụ thể
    Optional<Vote> findByUserIdAndVotableTypeAndVotableId(UUID userId, VotableType votableType, UUID votableId);

    @Query(value = "SELECT * FROM votes v " +
            "WHERE v.user_id = :userId " +
            "AND v.votable_type = :#{#type.name()} " +
            "AND v.votable_id = :votableId " +
            "LIMIT 1", nativeQuery = true)
    Optional<Vote> findExistingVoteRaw(@Param("userId") UUID userId,
                                       @Param("type") VotableType type,
                                       @Param("votableId") UUID votableId);

    // Đếm số upvote cho một item
    long countByVotableTypeAndVotableIdAndVoteType(VotableType votableType, UUID votableId, org.example.learniversebe.enums.VoteType voteType);

    @Modifying // Đánh dấu đây là một query thay đổi dữ liệu (UPDATE/DELETE)
    @Query("UPDATE Vote v SET v.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE v.votableType = :votableType " +
            "AND v.votableId = :votableId " +
            "AND v.deletedAt IS NULL")
    void softDeleteByVotable(@Param("votableType") VotableType votableType, @Param("votableId") UUID votableId);
}

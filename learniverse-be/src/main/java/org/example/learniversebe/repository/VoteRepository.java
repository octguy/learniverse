package org.example.learniversebe.repository;

import org.example.learniversebe.enums.VotableType;
import org.example.learniversebe.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoteRepository extends JpaRepository<Vote, UUID> {

    // Tìm vote của một user cho một item cụ thể
    Optional<Vote> findByUserIdAndVotableTypeAndVotableId(UUID userId, VotableType votableType, UUID votableId);

    // Đếm số upvote cho một item
    long countByVotableTypeAndVotableIdAndVoteType(VotableType votableType, UUID votableId, org.example.learniversebe.enums.VoteType voteType);

}

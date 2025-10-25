package org.example.learniversebe.repository;

import org.example.learniversebe.model.Mention;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MentionRepository extends JpaRepository<Mention, UUID> {

}

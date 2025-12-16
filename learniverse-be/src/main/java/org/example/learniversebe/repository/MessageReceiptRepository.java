package org.example.learniversebe.repository;

import org.example.learniversebe.model.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, UUID> {
}

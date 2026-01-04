package com.example.chatapp.repository;

import com.example.chatapp.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // --- POUR LE CHAT GÉNÉRAL ---
    // On cherche seulement les messages où 'recipient' est NULL (Public)
    List<Message> findTop50ByRecipientIsNullOrderByTimestampDesc();

    // --- POUR LE CHAT PRIVÉ ---
    List<Message> findBySenderAndRecipientOrSenderAndRecipientOrderByTimestampAsc(
            String sender1, String recipient1, String sender2, String recipient2);
}
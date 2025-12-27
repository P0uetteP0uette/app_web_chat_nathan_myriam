package com.example.chatapp.repository;

import com.example.chatapp.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    // Magie Spring : Trouve les 50 premiers, triés par ID décroissant (du plus récent au plus vieux)
    List<Message> findTop50ByOrderByIdDesc();
}
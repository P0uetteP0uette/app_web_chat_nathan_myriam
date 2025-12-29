package com.example.chatapp.repository;

import com.example.chatapp.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository gérant l'accès aux données pour l'entité Message.
 * Permet d'effectuer les opérations CRUD et des requêtes spécifiques sur la table 'messages'.
 */
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Récupère les 50 derniers messages enregistrés en base.
     * Le tri est effectué par ID décroissant pour l'historique.
     *
     * @return La liste des 50 derniers messages.
     */
    List<Message> findTop50ByOrderByIdDesc();
}
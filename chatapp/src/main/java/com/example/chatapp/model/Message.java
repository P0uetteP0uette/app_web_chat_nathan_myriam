package com.example.chatapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.example.chatapp.service.MessageEncryptor;

/**
 * Entité JPA représentant un message stocké en base de données.
 * Mise à jour pour supporter les messages privés (Expéditeur + Destinataire).
 */
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Convert(converter = MessageEncryptor.class)
    private Long id;

    private String sender;    // Pseudo de l'expéditeur
    private String recipient; // Pseudo du destinataire (NOUVEAU)
    private String content;   // Le texte du message

    private LocalDateTime timestamp; // Date précise pour le tri (REMPLACE 'time')

    /**
     * Constructeur vide requis par JPA.
     */
    public Message() {}

    /**
     * Constructeur pour créer un nouveau message.
     * La date est mise automatiquement à "Maintenant".
     *
     * @param sender L'expéditeur
     * @param recipient Le destinataire
     * @param content Le texte
     */
    public Message(String sender, String recipient, String content) {
        this.sender = sender;
        this.recipient = recipient;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }

    // --- Getters et Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
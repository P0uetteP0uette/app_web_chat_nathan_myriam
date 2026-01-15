package com.example.chatapp.model;

import java.time.LocalDateTime;

/**
 * Modèle de données (DTO) représentant un message échangé via WebSocket.
 *
 * Cette classe est utilisée pour structurer les données transmises entre le client et le serveur
 * via le protocole STOMP, que ce soit pour un message de chat, une notification de connexion
 * ou un changement de statut.
 */
public class ChatMessage {
    
    /** Type de l'événement (CHAT, JOIN, LEAVE, TYPING, STATUS). */
    private MessageType type;

    /** Le contenu textuel du message. */
    private String content;

    /** Expéditeur (utilisé pour la compatibilité avec certains clients). */
    private String from;

    /** Expéditeur (champ principal). */
    private String sender;

    /** Destinataire (null pour un message public, rempli pour un message privé). */
    private String recipient;

    /** Heure formatée (ex: "14:30") pour l'affichage direct. */
    private String time;

    /** Date et heure précises pour le tri chronologique et le stockage. */
    private LocalDateTime timestamp;

    public ChatMessage() {
    }

    /**
     * Constructeur utilitaire pour créer rapidement un message.
     *
     * @param type Le type d'événement.
     * @param content Le contenu du message.
     * @param sender L'auteur du message.
     */
    public ChatMessage(MessageType type, String content, String sender) {
        this.type = type;
        this.content = content;
        this.from = sender;
        this.sender = sender;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
        if (this.sender == null) {
            this.sender = from;
        }
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
        if (this.from == null) {
            this.from = sender;
        }
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "ChatMessage{" +
                "type=" + type +
                ", content='" + content + '\'' +
                ", sender='" + sender + '\'' +
                ", recipient='" + recipient + '\'' +
                ", time='" + time + '\'' +
                '}';
    }
}
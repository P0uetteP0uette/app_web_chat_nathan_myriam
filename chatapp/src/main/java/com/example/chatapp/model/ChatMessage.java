package com.example.chatapp.model;

import java.time.LocalDateTime;

/**
 * Modèle représentant un message dans le chat.
 * Utilisé pour les échanges WebSocket (STOMP) entre le serveur et les clients.
 */
public class ChatMessage {
    
    private MessageType type;
    private String content;
    private String from;      // Pour les messages publics (compatibilité)
    private String sender;    // Pour les messages privés
    private String recipient; // Pour les messages privés
    private String time;      // Format HH:mm
    private LocalDateTime timestamp; // Timestamp complet

    // Constructeurs
    public ChatMessage() {
    }

    public ChatMessage(MessageType type, String content, String from) {
        this.type = type;
        this.content = content;
        this.from = from;
        this.sender = from;
    }

    // Getters et Setters
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
        // Synchroniser avec sender pour compatibilité
        if (this.sender == null) {
            this.sender = from;
        }
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
        // Synchroniser avec from pour compatibilité
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
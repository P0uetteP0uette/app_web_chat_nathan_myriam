package com.example.chatapp.model;

public class ChatMessage {

    private MessageType type;
    
    private String content;
    private String from;
    private String time;
    private String recipient;

    // Constructeur vide
    public ChatMessage() {}

    // Getters et Setters
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
}
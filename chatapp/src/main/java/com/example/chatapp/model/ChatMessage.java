package com.example.chatapp.model;

/**
 * Modèle de données (DTO) représentant un message échangé via WebSocket.
 * Cet objet agit comme une enveloppe pour transporter les informations entre le client (JS) et le serveur (Java).
 */
public class ChatMessage {

    /**
     * Le type du message (CHAT, JOIN, LEAVE, STATUS).
     * Permet au frontend de savoir comment traiter l'information.
     */
    private MessageType type;
    
    /**
     * Le contenu textuel du message.
     */
    private String content;

    /**
     * Le pseudo de l'expéditeur.
     */
    private String from;

    /**
     * L'heure de l'envoi (formatée en chaîne de caractères).
     */
    private String time;

    /**
     * Le destinataire du message.
     * Si ce champ est rempli, c'est un message privé. Sinon, c'est un message public.
     */
    private String recipient;

    /**
     * Constructeur par défaut nécessaire pour la désérialisation JSON par Jackson.
     */
    public ChatMessage() {}

    // --- Getters et Setters ---

    /**
     * Obtient le type du message.
     * @return Le type (enum MessageType).
     */
    public MessageType getType() { return type; }

    /**
     * Définit le type du message.
     * @param type Le nouveau type.
     */
    public void setType(MessageType type) { this.type = type; }

    /**
     * Obtient le contenu du message.
     * @return Le texte du message.
     */
    public String getContent() { return content; }

    /**
     * Définit le contenu du message.
     * @param content Le texte à envoyer.
     */
    public void setContent(String content) { this.content = content; }

    /**
     * Obtient le nom de l'expéditeur.
     * @return Le pseudo de l'expéditeur.
     */
    public String getFrom() { return from; }

    /**
     * Définit le nom de l'expéditeur.
     * @param from Le pseudo de l'expéditeur.
     */
    public void setFrom(String from) { this.from = from; }

    /**
     * Obtient l'heure du message.
     * @return L'heure formatée (ex: "14:30").
     */
    public String getTime() { return time; }

    /**
     * Définit l'heure du message.
     * @param time L'heure formatée.
     */
    public void setTime(String time) { this.time = time; }

    /**
     * Obtient le destinataire du message (pour les messages privés).
     * @return Le pseudo du destinataire ou null si public.
     */
    public String getRecipient() { return recipient; }

    /**
     * Définit le destinataire du message.
     * @param recipient Le pseudo du destinataire.
     */
    public void setRecipient(String recipient) { this.recipient = recipient; }
}
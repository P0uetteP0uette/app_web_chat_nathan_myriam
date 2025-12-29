package com.example.chatapp.model;

import jakarta.persistence.*;

/**
 * Entité JPA représentant un message stocké en base de données.
 * Cette classe est mappée à la table "messages" et permet la persistance de l'historique du chat.
 */
@Entity
@Table(name = "messages")
public class Message {

    /**
     * Identifiant unique du message (Clé primaire).
     * Généré automatiquement par la base de données (Auto-incrément).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Le pseudonyme de l'expéditeur du message.
     */
    private String sender;

    /**
     * Le contenu textuel du message.
     */
    private String content;

    /**
     * L'heure d'envoi du message stockée sous forme de chaîne (ex: "14:30").
     */
    private String time; 

    /**
     * Constructeur vide requis par la spécification JPA.
     * Nécessaire pour que le framework puisse instancier l'objet depuis la base de données.
     */
    public Message() {}

    /**
     * Constructeur permettant de créer un nouveau message avant sauvegarde.
     *
     * @param sender Le pseudo de l'expéditeur.
     * @param content Le texte du message.
     * @param time L'heure d'envoi formatée.
     */
    public Message(String sender, String content, String time) {
        this.sender = sender;
        this.content = content;
        this.time = time;
    }

    // --- Getters et Setters ---

    /**
     * Récupère l'identifiant unique du message.
     * @return L'ID du message.
     */
    public Long getId() { return id; }

    /**
     * Définit l'identifiant du message.
     * @param id Le nouvel ID.
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Récupère le nom de l'expéditeur.
     * @return Le pseudo de l'expéditeur.
     */
    public String getSender() { return sender; }

    /**
     * Définit le nom de l'expéditeur.
     * @param sender Le pseudo de l'expéditeur.
     */
    public void setSender(String sender) { this.sender = sender; }

    /**
     * Récupère le contenu du message.
     * @return Le texte du message.
     */
    public String getContent() { return content; }

    /**
     * Définit le contenu du message.
     * @param content Le nouveau texte.
     */
    public void setContent(String content) { this.content = content; }

    /**
     * Récupère l'heure d'envoi.
     * @return L'heure formatée.
     */
    public String getTime() { return time; }

    /**
     * Définit l'heure d'envoi.
     * @param time L'heure formatée (ex: "HH:mm").
     */
    public void setTime(String time) { this.time = time; }
}
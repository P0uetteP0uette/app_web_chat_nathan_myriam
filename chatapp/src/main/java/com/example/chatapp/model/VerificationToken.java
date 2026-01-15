package com.example.chatapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entité représentant le jeton de validation envoyé par email.
 * Lie un utilisateur à un code unique temporaire.
 */
@Entity
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Le code unique (UUID) qui sera envoyé par email.
     */
    private String token;

    /**
     * L'utilisateur associé à ce token.
     * La relation est unique (OneToOne) : un token appartient à un seul utilisateur.
     */
    @OneToOne(targetEntity = User.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    private LocalDateTime expiryDate;

    /**
     * Constructeur par défaut requis par JPA.
     */
    public VerificationToken() {}

    /**
     * Constructeur principal générant un nouveau token pour un utilisateur.
     *
     * Le token est un UUID aléatoire et sa durée de validité est fixée à 24 heures
     * à partir de l'instant de création.
     *
     * @param user L'utilisateur pour lequel le token est créé.
     */
    public VerificationToken(User user) {
        this.user = user;
        this.expiryDate = LocalDateTime.now().plusHours(24); // Valide 24h
        this.token = UUID.randomUUID().toString(); // Génère un code aléatoire
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public User getUser() { return user; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    
    public void setToken(String token) { this.token = token; }
    public void setUser(User user) { this.user = user; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
}